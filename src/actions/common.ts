'use server'

import { prisma } from "@/lib/prisma"

// Traer todas las sucursales
export async function getBranches() {
  return await prisma.branch.findMany({ where: { isActive: true } })
}

// Traer odontólogos activos
export async function getDentists() {
  return await prisma.dentist.findMany({ 
    where: { isActive: true },
    orderBy: { lastName: 'asc' }
  })
}

// Traer obras sociales
export async function getObrasSociales() {
  return await prisma.obraSocial.findMany({ 
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
}

// Traer lista de estudios (Procedimientos)
export async function getProcedures() {
  return await prisma.procedure.findMany({ 
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
}