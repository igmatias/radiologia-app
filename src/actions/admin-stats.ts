"use server"

import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"
import { revalidatePath } from "next/cache"
import { toNum } from "@/lib/utils"
import { getCurrentSession } from "@/actions/auth"

// 1. OBTENER TODO EL TABLERO DEL DUEÑO (Con filtros)
export async function getAdminDashboardData(filtros: { fechaInicio: Date, fechaFin: Date, branchId: string }) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, error: "Sin permisos" }
  }
  const inicio = startOfDay(new Date(filtros.fechaInicio));
  const fin = endOfDay(new Date(filtros.fechaFin));

  const branchQuery = filtros.branchId !== "ALL" ? { branchId: filtros.branchId } : {};

  try {
    // Perf fix: 4 queries en paralelo en vez de secuenciales
    const [pagos, movimientos, cajasDiarias, bovedas] = await Promise.all([
      prisma.payment.findMany({
        where: {
          createdAt: { gte: inicio, lte: fin },
          order: branchQuery
        }
      }),
      prisma.cashMovement.findMany({
        where: {
          createdAt: { gte: inicio, lte: fin },
          ...branchQuery
        },
        orderBy: { createdAt: 'desc' },
        include: { branch: true }
      }),
      prisma.dailyRegister.findMany({
        where: {
          date: { gte: inicio, lte: fin },
          ...branchQuery
        },
        include: { branch: true },
        orderBy: { date: 'desc' }
      }),
      prisma.safeVault.findMany({
        where: branchQuery,
        include: { branch: true }
      }),
    ]);

    let totalFacturado = 0;
    const desglose: Record<string, number> = { EFECTIVO: 0, MERCADOPAGO: 0, TARJETA_DEBITO: 0, TARJETA_CREDITO: 0, TRANSFERENCIA: 0, SALDO: 0 };

    pagos.forEach(p => {
      const monto = toNum(p.amount);
      totalFacturado += monto;
      if (desglose[p.method] !== undefined) desglose[p.method] += monto;
      else desglose[p.method] = monto;
    });

    const porcentajes = Object.keys(desglose).map(key => ({
      metodo: key,
      monto: desglose[key],
      porcentaje: totalFacturado > 0 ? Math.round((desglose[key] / totalFacturado) * 100) : 0
    })).filter(m => m.monto > 0).sort((a, b) => b.monto - a.monto);

    const totalGastos = movimientos.filter(m => m.type === 'GASTO').reduce((acc, m) => acc + toNum(m.amount), 0);

    return {
      success: true,
      data: {
        totalFacturado,
        desglose,
        porcentajes,
        totalGastos,
        movimientos,
        cajasDiarias,
        bovedas
      }
    };
  } catch (error) {
    console.error("Error cargando dashboard:", error);
    return { success: false, error: "Error al cargar los datos." };
  }
}

// 2. RETIRAR PLATA DE LA BÓVEDA (AL BOLSILLO DEL DUEÑO)
export async function retirarDeBoveda(branchId: string, amount: number, description: string) {
  const session = await getCurrentSession()
  if (!session || session.role !== 'SUPERADMIN') {
    return { success: false, error: "Solo el SUPERADMIN puede retirar de la bóveda" }
  }
  try {
    const boveda = await prisma.safeVault.findUnique({ where: { branchId } });
    if (!boveda || toNum(boveda.balance) < amount) {
      return { success: false, error: "No hay suficiente dinero en esta Caja Fuerte." };
    }

    await prisma.safeVault.update({
      where: { branchId },
      data: { balance: { decrement: amount } }
    });

    await prisma.cashMovement.create({
      data: {
        branchId,
        type: 'RETIRO_DUENO',
        amount,
        description,
        method: 'EFECTIVO'
      }
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al retirar de boveda:", error);
    return { success: false, error: "No se pudo completar el retiro." };
  }
}

export async function cobrarSaldoPendiente(paymentId: string, nuevoMetodo: any) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false }
  }
  try {
    await prisma.payment.update({ where: { id: paymentId }, data: { method: nuevoMetodo, createdAt: new Date() } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// ESTADÍSTICAS DEL PERSONAL TÉCNICO
export async function getTechnicianStats(filtros: { fechaInicio: Date, fechaFin: Date, branchId: string }) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, stats: [] }
  }
  const inicio = startOfDay(new Date(filtros.fechaInicio))
  const fin = endOfDay(new Date(filtros.fechaFin))
  const branchQuery = filtros.branchId !== "ALL" ? { branchId: filtros.branchId } : {}

  try {
    // Perf fix: select en vez de include — solo campos necesarios, _count para items
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: inicio, lte: fin },
        technicianId: { not: null },
        ...branchQuery,
      },
      select: {
        technicianId: true,
        createdAt: true,
        attendedAt: true,
        completedAt: true,
        technician: { select: { name: true } },
        branch: { select: { name: true } },
        _count: { select: { items: true } },
      },
    })

    const byTech: Record<string, {
      name: string
      branchName: string
      totalOrdenes: number
      totalEstudios: number
      tiemposAtencion: number[]
      tiemposProceso: number[]
    }> = {}

    for (const order of orders) {
      if (!order.technician) continue
      const id = order.technicianId!
      if (!byTech[id]) {
        byTech[id] = {
          name: order.technician.name,
          branchName: order.branch.name,
          totalOrdenes: 0,
          totalEstudios: 0,
          tiemposAtencion: [],
          tiemposProceso: [],
        }
      }
      byTech[id].totalOrdenes++
      // Perf fix: usa _count.items en vez de order.items.length
      byTech[id].totalEstudios += order._count.items

      if (order.attendedAt) {
        const mins = (new Date(order.attendedAt).getTime() - new Date(order.createdAt).getTime()) / 60000
        if (mins >= 0 && mins < 480) byTech[id].tiemposAtencion.push(Math.round(mins))
      }
      if (order.attendedAt && order.completedAt) {
        const mins = (new Date(order.completedAt).getTime() - new Date(order.attendedAt).getTime()) / 60000
        if (mins >= 0 && mins < 480) byTech[id].tiemposProceso.push(Math.round(mins))
      }
    }

    const avg = (arr: number[]) => arr.length === 0 ? null : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)

    const stats = Object.values(byTech)
      .map(t => ({
        name: t.name,
        branchName: t.branchName,
        totalOrdenes: t.totalOrdenes,
        totalEstudios: t.totalEstudios,
        avgTiempoAtencion: avg(t.tiemposAtencion),
        avgTiempoProceso: avg(t.tiemposProceso),
      }))
      .sort((a, b) => b.totalEstudios - a.totalEstudios)

    return { success: true, stats }
  } catch (error) {
    console.error("Error en getTechnicianStats:", error)
    return { success: false, stats: [] }
  }
}
