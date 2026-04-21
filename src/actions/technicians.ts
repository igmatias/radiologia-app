"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/actions/auth"

export async function getTechniciansByBranch(branchId: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, technicians: [] }
  try {
    const techs = await prisma.technicianProfile.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: 'asc' },
    })
    return { success: true, technicians: techs }
  } catch (e) {
    return { success: false, technicians: [] }
  }
}

export async function saveTechnicianProfile(data: { id?: string; name: string; branchId: string }) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  if (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN') return { success: false, error: "Sin permisos" }
  try {
    if (data.id) {
      await prisma.technicianProfile.update({ where: { id: data.id }, data: { name: data.name } })
    } else {
      await prisma.technicianProfile.create({ data: { name: data.name, branchId: data.branchId } })
    }
    revalidatePath("/tecnico")
    return { success: true }
  } catch (e) {
    return { success: false, error: "No se pudo guardar el técnico" }
  }
}

export async function deleteTechnicianProfile(id: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  if (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN') return { success: false, error: "Sin permisos" }
  try {
    await prisma.technicianProfile.update({ where: { id }, data: { isActive: false } })
    revalidatePath("/tecnico")
    return { success: true }
  } catch (e) {
    return { success: false, error: "No se pudo eliminar" }
  }
}

export async function assignTechnicianToOrder(orderId: string, technicianId: string | null) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  try {
    await prisma.order.update({ where: { id: orderId }, data: { technicianId } })
    revalidatePath("/tecnico")
    return { success: true }
  } catch (e) {
    return { success: false, error: "No se pudo asignar el técnico" }
  }
}
