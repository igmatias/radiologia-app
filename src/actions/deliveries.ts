"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/actions/auth"

export async function getDeliveries(branchId: string, dateStr: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, pending: [], delayed: [], delivered: [] }
  try {
    const startOfDay = new Date(`${dateStr}T00:00:00.000-03:00`)
    const endOfDay   = new Date(`${dateStr}T23:59:59.999-03:00`)
    const [pending, delayed, delivered] = await Promise.all([
      prisma.order.findMany({
        where: { branchId, status: "LISTO_PARA_ENTREGA" },
        include: { patient: true, dentist: true, payments: true, items: { include: { procedure: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.findMany({
        where: { branchId, status: "DEMORADA" },
        include: { patient: true, dentist: true, payments: true, items: { include: { procedure: true } } },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.order.findMany({
        where: { branchId, status: "ENTREGADA", updatedAt: { gte: startOfDay, lte: endOfDay } },
        include: { patient: true, dentist: true, payments: true, items: { include: { procedure: true } } },
        orderBy: { updatedAt: 'desc' }
      }),
    ])
    return { success: true, pending, delayed, delivered }
  } catch (error) {
    console.error("Error obteniendo entregas:", error)
    return { success: false, pending: [], delayed: [], delivered: [] }
  }
}

export async function markAsDelivered(orderId: string, method: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    const existingNotes = order?.notes ? `${order.notes} | ` : ""
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "ENTREGADA", deliveredAt: new Date(), deliveryMethod: method, notes: `${existingNotes}Entregado vía: ${method}` }
    })
    revalidatePath("/entregas")
    return { success: true }
  } catch (error) {
    console.error("Error al entregar:", error)
    return { success: false, error: "No se pudo actualizar el estado." }
  }
}

export async function markAsDelayed(orderId: string, reason: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    const existingNotes = order?.notes ? `${order.notes} | ` : ""
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "DEMORADA", notes: `${existingNotes}⚠️ Demorado: ${reason}` }
    })
    revalidatePath("/entregas")
    return { success: true }
  } catch (error) {
    console.error("Error al demorar:", error)
    return { success: false, error: "No se pudo demorar la orden." }
  }
}
