"use server"

import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

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
