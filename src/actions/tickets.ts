"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendTicketReplyEmail } from "@/lib/email"
import { getCurrentSession } from "@/actions/auth"
import { getDentistSession } from "@/lib/session"

export async function createTicket(dentistId: string, subject: string, message: string) {
  const dentistSession = await getDentistSession()
  if (!dentistSession) return { success: false, error: "No autenticado" }
  try {
    await prisma.ticket.create({ data: { dentistId, subject, message, status: "ABIERTO" } })
    revalidatePath("/recepcion")
    return { success: true }
  } catch (e) {
    console.error(e)
    return { success: false, error: "Error al enviar la solicitud" }
  }
}

export async function getTickets(status?: "ABIERTO" | "RESPONDIDO" | "CERRADO") {
  const session = await getCurrentSession()
  if (!session) return { success: false, data: [] }
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
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  try {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { reply, repliedBy, repliedAt: new Date(), status: "RESPONDIDO" },
      include: { dentist: { select: { firstName: true, lastName: true, email: true } } }
    })
    revalidatePath("/recepcion")
    if (ticket.dentist?.email) {
      sendTicketReplyEmail({
        to: ticket.dentist.email,
        dentistName: `${ticket.dentist.lastName}, ${ticket.dentist.firstName}`,
        subject: ticket.subject,
        originalMessage: ticket.message,
        reply,
        repliedBy,
      }).catch(e => console.error('[Email] Error enviando respuesta de ticket:', e))
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: "Error al responder" }
  }
}

export async function closeTicket(ticketId: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  try {
    await prisma.ticket.update({ where: { id: ticketId }, data: { status: "CERRADO" } })
    revalidatePath("/recepcion")
    return { success: true }
  } catch (e) {
    return { success: false }
  }
}

export async function getDentistTickets(dentistId: string) {
  const dentistSession = await getDentistSession()
  if (!dentistSession) return { success: false, data: [] }
  try {
    const tickets = await prisma.ticket.findMany({ where: { dentistId }, orderBy: { createdAt: "desc" } })
    return { success: true, data: tickets }
  } catch (e) {
    return { success: false, data: [] }
  }
}

export async function countOpenTickets() {
  const session = await getCurrentSession()
  if (!session) return 0
  try {
    return await prisma.ticket.count({ where: { status: "ABIERTO" } })
  } catch (e) {
    return 0
  }
}

export async function markRespondidosAsRead(dentistId: string) {
  const dentistSession = await getDentistSession()
  if (!dentistSession) return { success: false, error: "No autenticado" }
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
