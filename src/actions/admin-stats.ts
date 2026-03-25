"use server"

import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"
import { revalidatePath } from "next/cache"
import { toNum } from "@/lib/utils"

// 1. OBTENER TODO EL TABLERO DEL DUEÑO (Con filtros)
export async function getAdminDashboardData(filtros: { fechaInicio: Date, fechaFin: Date, branchId: string }) {
  const inicio = startOfDay(new Date(filtros.fechaInicio));
  const fin = endOfDay(new Date(filtros.fechaFin));

  const branchQuery = filtros.branchId !== "ALL" ? { branchId: filtros.branchId } : {};

  try {
    // A. FACTURACIÓN Y PORCENTAJES
    const pagos = await prisma.payment.findMany({
      where: {
        createdAt: { gte: inicio, lte: fin },
        order: branchQuery
      }
    });

    let totalFacturado = 0;
    const desglose: Record<string, number> = { EFECTIVO: 0, MERCADOPAGO: 0, TARJETA_DEBITO: 0, TARJETA_CREDITO: 0, TRANSFERENCIA: 0, SALDO: 0 };

    pagos.forEach(p => {
      const monto = toNum(p.amount);
      totalFacturado += monto;
      if (desglose[p.method] !== undefined) desglose[p.method] += monto;
      else desglose[p.method] = monto;
    });

    // Calculamos los porcentajes automáticos
    const porcentajes = Object.keys(desglose).map(key => ({
      metodo: key,
      monto: desglose[key],
      porcentaje: totalFacturado > 0 ? Math.round((desglose[key] / totalFacturado) * 100) : 0
    })).filter(m => m.monto > 0).sort((a, b) => b.monto - a.monto);

    // B. GASTOS Y MOVIMIENTOS
    const movimientos = await prisma.cashMovement.findMany({
      where: {
        createdAt: { gte: inicio, lte: fin },
        ...branchQuery
      },
      orderBy: { createdAt: 'desc' },
      include: { branch: true }
    });

    const totalGastos = movimientos.filter(m => m.type === 'GASTO').reduce((acc, m) => acc + toNum(m.amount), 0);

    // C. CAJAS DIARIAS EN VIVO (Mostradores)
    const cajasDiarias = await prisma.dailyRegister.findMany({
      where: {
        date: { gte: inicio, lte: fin },
        ...branchQuery
      },
      include: { branch: true },
      orderBy: { date: 'desc' }
    });

    // D. CAJAS FUERTES (Bóvedas) - Esto es histórico, no importa la fecha
    const bovedas = await prisma.safeVault.findMany({
      where: branchQuery,
      include: { branch: true }
    });

    // E. TIEMPOS PROMEDIO DE GESTIÓN
    const ordenesConTiempos = await prisma.order.findMany({
      where: {
        createdAt: { gte: inicio, lte: fin },
        status: { not: 'ANULADA' },
        ...branchQuery
      },
      select: { createdAt: true, attendedAt: true, deliveredAt: true }
    });

    const avg = (nums: number[]) => nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    const hs = (a: Date, b: Date) => (b.getTime() - a.getTime()) / (1000 * 60 * 60);

    // 1. Creación → Llamado (attendedAt)
    const t1 = ordenesConTiempos
      .filter(o => o.attendedAt)
      .map(o => hs(o.createdAt, o.attendedAt!));

    // 2. Llamado → Entrega (attendedAt → deliveredAt)
    const t2 = ordenesConTiempos
      .filter(o => o.attendedAt && o.deliveredAt)
      .map(o => hs(o.attendedAt!, o.deliveredAt!));

    // 3. Creación → Entrega (total)
    const t3 = ordenesConTiempos
      .filter(o => o.deliveredAt)
      .map(o => hs(o.createdAt, o.deliveredAt!));

    const entregaStats = {
      creacionALlamado:  { avg: avg(t1), n: t1.length },
      llamadoAEntrega:   { avg: avg(t2), n: t2.length },
      creacionAEntrega:  { avg: avg(t3), n: t3.length },
    };

    return {
      success: true,
      data: {
        totalFacturado,
        desglose,
        porcentajes,
        totalGastos,
        movimientos,
        cajasDiarias,
        bovedas,
        entregaStats
      }
    };
  } catch (error) {
    console.error("Error cargando dashboard:", error);
    return { success: false, error: "Error al cargar los datos." };
  }
}

// 2. RETIRAR PLATA DE LA BÓVEDA (AL BOLSILLO DEL DUEÑO)
export async function retirarDeBoveda(branchId: string, amount: number, description: string) {
  try {
    const boveda = await prisma.safeVault.findUnique({ where: { branchId } });
    if (!boveda || toNum(boveda.balance) < amount) {
      return { success: false, error: "No hay suficiente dinero en esta Caja Fuerte." };
    }

    // 1. Restamos de la Caja Fuerte
    await prisma.safeVault.update({
      where: { branchId },
      data: { balance: { decrement: amount } }
    });

    // 2. Anotamos el movimiento para que quede el registro contable
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
    console.error("⛔ ERROR AL RETIRAR DE BOVEDA:", error);
    return { success: false, error: "No se pudo completar el retiro." };
  }
}

// (Mantenemos la función de cobro de saldos por las dudas que la necesites)
export async function cobrarSaldoPendiente(paymentId: string, nuevoMetodo: any) {
  try {
    await prisma.payment.update({ where: { id: paymentId }, data: { method: nuevoMetodo, createdAt: new Date() } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}