"use server"

import { prisma } from "@/lib/prisma"

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
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
  procedures: { procId: string; procName: string; teeth: number[]; options: string[] }[]
  indicaciones?: string
}) {
  try {
    // Generate unique 6-digit code
    let code = generateCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.derivacion.findUnique({ where: { prescriptionCode: code } })
      if (!existing) break
      code = generateCode()
      attempts++
    }

    const derivacion = await prisma.derivacion.create({
      data: {
        prescriptionCode: code,
        dentistId: data.dentistId,
        patientApellido: data.patientApellido,
        patientNombre: data.patientNombre,
        patientDni: data.patientDni || null,
        patientBirthDate: data.patientBirthDate || null,
        cobertura: data.cobertura,
        obraSocial: data.obraSocial || null,
        nroAfiliado: data.nroAfiliado || null,
        procedures: data.procedures as any,
        indicaciones: data.indicaciones || null,
      },
    })

    return { success: true, prescriptionCode: derivacion.prescriptionCode }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function findDerivacion(code: string) {
  try {
    const derivacion = await prisma.derivacion.findUnique({
      where: { prescriptionCode: code.trim() },
      include: { dentist: { select: { id: true, firstName: true, lastName: true, matriculaProv: true } } },
    })

    if (!derivacion) return { success: false, error: "No se encontró ninguna derivación con ese código" }
    if (derivacion.status === "CARGADA") return { success: false, error: "Esta derivación ya fue utilizada" }
    if (derivacion.status === "ANULADA") return { success: false, error: "Esta derivación fue anulada" }

    return { success: true, data: derivacion }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function markDerivacionCargada(code: string) {
  try {
    await prisma.derivacion.update({
      where: { prescriptionCode: code },
      data: { status: "CARGADA", usedAt: new Date() },
    })
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
