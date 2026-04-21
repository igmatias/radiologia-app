"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { MovementType, PaymentMethod } from "@prisma/client"
import { getCurrentSession } from "@/actions/auth"

export async function getDailyCash(branchId: string, dateStr: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, payments: [], movements: [] }
  try {
    // 🔥 FIX DE ZONA HORARIA: Separamos el texto "YYYY-MM-DD" manualmente
    const [year, month, day] = dateStr.split('-');
    
    // Armamos el inicio y fin del día exactamente con esos números locales
    const startOfDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
    const endOfDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999);

    // Traemos los ingresos de pacientes
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        order: { branchId: branchId }
      },
      include: {
        order: { include: { patient: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Traemos los gastos y retiros manuales
    const movements = await prisma.cashMovement.findMany({
      where: {
        branchId: branchId,
        createdAt: { gte: startOfDay, lte: endOfDay }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, payments, movements };
  } catch (error) {
    console.error("Error obteniendo caja:", error);
    return { success: false, payments: [], movements: [] };
  }
}

export async function getCashConsolidated(dateStr: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, data: [] }
  try {
    const [year, month, day] = dateStr.split('-')
    const startOfDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0)
    const endOfDay   = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999)

    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    const results = await Promise.all(branches.map(async (branch) => {
      const [payments, movements] = await Promise.all([
        prisma.payment.findMany({
          where: { createdAt: { gte: startOfDay, lte: endOfDay }, order: { branchId: branch.id } },
          include: { order: { include: { patient: true } } },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.cashMovement.findMany({
          where: { branchId: branch.id, createdAt: { gte: startOfDay, lte: endOfDay } },
          orderBy: { createdAt: 'asc' },
        }),
      ])

      const totalIngresos = payments
        .filter(p => p.method !== 'SALDO' && p.method !== 'CUENTA_CORRIENTE')
        .reduce((acc, p) => acc + Number(p.amount), 0)

      const totalEgresos = movements
        .filter(m => m.type !== 'INGRESO_EXTRA')
        .reduce((acc, m) => acc + Number(m.amount), 0)

      const totalIngresosExtra = movements
        .filter(m => m.type === 'INGRESO_EXTRA')
        .reduce((acc, m) => acc + Number(m.amount), 0)

      const byMethod: Record<string, number> = {}
      for (const p of payments) {
        if (p.method === 'SALDO' || p.method === 'CUENTA_CORRIENTE') continue
        byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount)
      }

      return {
        branch,
        payments,
        movements,
        totalIngresos,
        totalEgresos,
        totalIngresosExtra,
        balance: totalIngresos + totalIngresosExtra - totalEgresos,
        byMethod,
      }
    }))

    return { success: true, data: results }
  } catch (error) {
    console.error('Error caja consolidada:', error)
    return { success: false, data: [] }
  }
}

export async function createCashMovement(data: { branchId: string, type: MovementType, amount: number, description: string, method: PaymentMethod }) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  try {
    await prisma.cashMovement.create({
      data: {
        branchId: data.branchId,
        type: data.type,
        amount: data.amount,
        description: data.description.toUpperCase(),
        method: data.method
      }
    });
    
    revalidatePath("/caja");
    return { success: true };
  } catch (error) {
    console.error("Error creando movimiento:", error);
    return { success: false, error: "No se pudo guardar el movimiento" };
  }
}

export async function updateCashMovement(id: string, data: { type: MovementType, amount: number, description: string, method: PaymentMethod }) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  try {
    await prisma.cashMovement.update({
      where: { id },
      data: {
        type: data.type,
        amount: data.amount,
        description: data.description.toUpperCase(),
        method: data.method
      }
    });
    
    revalidatePath("/caja");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando movimiento:", error);
    return { success: false, error: "No se pudo actualizar el movimiento" };
  }
}

export async function deleteCashMovement(id: string) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  try {
    await prisma.cashMovement.delete({
      where: { id }
    });
    
    revalidatePath("/caja");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando movimiento:", error);
    return { success: false, error: "No se pudo eliminar el movimiento" };
  }
}

export async function updatePatientPaymentMethod(paymentId: string, newMethod: PaymentMethod) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  try {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { method: newMethod }
    });
    
    revalidatePath("/caja");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando método de pago:", error);
    return { success: false, error: "No se pudo actualizar el pago" };
  }
}