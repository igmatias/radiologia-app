'use server'

import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/actions/auth"

export async function getBranches() {
  const session = await getCurrentSession()
  if (!session) return []
  return await prisma.branch.findMany({ where: { isActive: true } })
}

export async function getDentists() {
  const session = await getCurrentSession()
  if (!session) return []
  return await prisma.dentist.findMany({
    where: { isActive: true },
    orderBy: { lastName: 'asc' }
  })
}

export async function getObrasSociales() {
  const session = await getCurrentSession()
  if (!session) return []
  return await prisma.obraSocial.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
}

export async function getProcedures() {
  const session = await getCurrentSession()
  if (!session) return []
  return await prisma.procedure.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
}
