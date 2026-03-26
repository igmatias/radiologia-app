"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createTicket(dentistId: string, subject: string, message: string) {
  try {
    await prisma.ticket.create({
      data: { dentistId, subject, message, status: "ABIERTO" }
    })
    revalidatePath("/recepcion")
    return { success: true }
  } catch (e) {
    console.error(e)
    return { success: false, error: "Error al enviar la solicitud" }
  }
}

export async function getTickets(status?: "ABIERTO" | "RESPONDIDO" | "CERRADO") {
  try {
    const tickets = await prisma.ticket.findMany({
      where: status ? { status } : undefined,
      include: { dentist: { select: { firstName: true, lastName: true, matriculaProv: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, data: tickets }
  } catch (e) {
    return { success: false, data: [] }
  }
}

export async function replyTicket(ticketId: string, reply: string, repliedBy: string) {
  try {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { reply, repliedBy, repliedAt: new Date(), status: "RESPONDIDO" }
    })
    revalidatePath("/recepcion")
    return { success: true }
  } catch (e) {
    return { success: false, error: "Error al responder" }
  }
}

export async function closeTicket(ticketId: string) {
  try {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "CERRADO" }
    })
    revalidatePath("/recepcion")
    return { success: true }
  } catch (e) {
    return { success: false }
  }
}

export async function getDentistTickets(dentistId: string) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { dentistId },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, data: tickets }
  } catch (e) {
    return { success: false, data: [] }
  }
}

export async function countOpenTickets() {
  try {
    const count = await prisma.ticket.count({ where: { status: "ABIERTO" } })
    return count
  } catch (e) {
    return 0
  }
}

export async function markRespondidosAsRead(dentistId: string) {
  try {
    await prisma.ticket.updateMany({
      where: { dentistId, status: "RESPONDIDO" },
      data: { status: "CERRADO" }
    })
    revalidatePath("/portal-medico/panel")
    return { success: true }
  } catch (e) {
    return { success: false }
  }
}
