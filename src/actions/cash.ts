"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { MovementType, PaymentMethod } from "@prisma/client"

export async function getDailyCash(branchId: string, dateStr: string) {
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

export async function createCashMovement(data: { branchId: string, type: MovementType, amount: number, description: string, method: PaymentMethod }) {
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