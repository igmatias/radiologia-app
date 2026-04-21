"use server"

import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { getCurrentSession } from "@/actions/auth"
import { getDentistSession } from "@/lib/session"

export async function createDerivacion(data: {
  dentistId: string
  patientApellido: string
  patientNombre: string
  patientDni?: string
  patientBirthDate?: string
  cobertura: string
  obraSocial?: string
  nroAfiliado?: string
  procedures: string
  indicaciones?: string
}) {
  const dentistSession = await getDentistSession()
  if (!dentistSession) return { success: false, error: "No autenticado" }
  try {
    const prescriptionCode = `DER-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`
    const derivacion = await prisma.derivacion.create({
      data: {
        prescriptionCode,
        dentistId: data.dentistId,
        patientApellido: data.patientApellido.toUpperCase(),
        patientNombre: data.patientNombre.toUpperCase(),
        patientDni: data.patientDni || null,
        patientBirthDate: data.patientBirthDate || null,
        cobertura: data.cobertura,
        obraSocial: data.obraSocial || null,
        nroAfiliado: data.nroAfiliado || null,
        procedures: [data.procedures],
        indicaciones: data.indicaciones || null,
        status: "PENDIENTE",
      },
    })
    return { success: true, code: derivacion.prescriptionCode }
  } catch (e: any) {
    return { success: false, error: e?.message || "Error al crear derivación" }
  }
}

export async function saveDerivacion(data: {
  dentistId: string
  patientApellido: string
  patientNombre: string
  patientDni?: string
  patientBirthDate?: string
  cobertura: string
  obraSocial?: string
  nroAfiliado?: string
  procedures: any[]
  indicaciones?: string
}) {
  const dentistSession = await getDentistSession()
  if (!dentistSession) return { success: false, error: "No autenticado" }
  try {
    let prescriptionCode: string
    let exists = true
    do {
      prescriptionCode = Math.floor(100000 + Math.random() * 900000).toString()
      const found = await prisma.derivacion.findUnique({ where: { prescriptionCode }, select: { id: true } })
      exists = !!found
    } while (exists)
    await prisma.derivacion.create({
      data: {
        prescriptionCode,
        dentistId: data.dentistId,
        patientApellido: data.patientApellido.toUpperCase(),
        patientNombre: data.patientNombre.toUpperCase(),
        patientDni: data.patientDni || null,
        patientBirthDate: data.patientBirthDate || null,
        cobertura: data.cobertura,
        obraSocial: data.obraSocial || null,
        nroAfiliado: data.nroAfiliado || null,
        procedures: data.procedures,
        indicaciones: data.indicaciones || null,
        status: "PENDIENTE",
      },
    })
    return { success: true, prescriptionCode }
  } catch (e: any) {
    return { success: false, error: e?.message || "Error al guardar derivación" }
  }
}

export async function findDerivacion(prescriptionCode: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  try {
    const derivacion = await prisma.derivacion.findUnique({
      where: { prescriptionCode },
      include: { dentist: { select: { firstName: true, lastName: true, matriculaProv: true } } },
    })
    if (!derivacion) return { success: false, error: "Código no encontrado" }
    return { success: true, derivacion, data: derivacion }
  } catch (e: any) {
    return { success: false, error: "Error al buscar derivación" }
  }
}

export async function markDerivacionCargada(prescriptionCode: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  try {
    await prisma.derivacion.update({
      where: { prescriptionCode },
      data: { status: "CARGADA", usedAt: new Date() },
    })
    return { success: true }
  } catch (e: any) {
    return { success: false, error: "Error al actualizar derivación" }
  }
}
