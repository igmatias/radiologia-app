"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getDeliveries(branchId: string, dateStr: string) {
  try {
    // 1. Buscamos las órdenes "LISTO_PARA_ENTREGA" (Las que terminó el técnico)
    const pending = await prisma.order.findMany({
      where: { branchId, status: "LISTO_PARA_ENTREGA" },
      include: { 
        patient: true, 
        dentist: true, 
        payments: true,
        items: { include: { procedure: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Buscamos las órdenes "DEMORADA"
    const delayed = await prisma.order.findMany({
      where: { branchId, status: "DEMORADA" },
      include: { 
        patient: true, 
        dentist: true, 
        payments: true,
        items: { include: { procedure: true } } 
      },
      orderBy: { updatedAt: 'desc' }
    });

    // 3. Buscamos las entregadas HOY (para el historial de la columna derecha)
    const startOfDay = new Date(`${dateStr}T00:00:00.000-03:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999-03:00`);

    const delivered = await prisma.order.findMany({
      where: { 
        branchId, 
        status: "ENTREGADA",
        updatedAt: { gte: startOfDay, lte: endOfDay } 
      },
      include: { 
        patient: true, 
        dentist: true, 
        payments: true,
        items: { include: { procedure: true } } 
      },
      orderBy: { updatedAt: 'desc' }
    });

    return { success: true, pending, delayed, delivered };
  } catch (error) {
    console.error("Error obteniendo entregas:", error);
    return { success: false, pending: [], delayed: [], delivered: [] };
  }
}

export async function markAsDelivered(orderId: string, method: string) {
  try {
    // Primero buscamos la orden para no pisar las notas viejas
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    const existingNotes = order?.notes ? `${order.notes} | ` : "";

    // Actualizamos el estado a ENTREGADA
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "ENTREGADA",
        deliveredAt: new Date(),
        notes: `${existingNotes}Entregado vía: ${method}`
      }
    });
    
    revalidatePath("/entregas");
    return { success: true };
  } catch (error) {
    console.error("Error al entregar:", error);
    return { success: false, error: "No se pudo actualizar el estado." };
  }
}

// 🔥 ESTA ES LA FUNCIÓN QUE FALTABA
export async function markAsDelayed(orderId: string, reason: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    const existingNotes = order?.notes ? `${order.notes} | ` : "";

    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "DEMORADA",
        notes: `${existingNotes}⚠️ Demorado: ${reason}` 
      }
    });
    
    revalidatePath("/entregas");
    return { success: true };
  } catch (error) {
    console.error("Error al demorar:", error);
    return { success: false, error: "No se pudo demorar la orden." };
  }
}