"use server"

import { prisma } from "@/lib/prisma"

export async function getPatientResults(accessCode: string, dni: string) {
  if (!accessCode || accessCode === "undefined" || accessCode === "null") {
    return { success: false, error: "El enlace está corrupto o es inválido." };
  }

  try {
    const linkOrder = await prisma.order.findFirst({
      where: { accessCode: accessCode },
      include: { patient: true }
    });

    if (!linkOrder) {
      return { success: false, error: "El enlace es inválido o el estudio no existe." };
    }
    
    // 🔥 LA MAGIA: Limpiamos absolutamente todo lo que no sea número (puntos, espacios, guiones)
    const dbDni = linkOrder.patient.dni.toString().replace(/\D/g, '');
    const inputDni = dni.toString().replace(/\D/g, '');

    // Comparamos los números puros
    if (dbDni !== inputDni) {
      return { success: false, error: "El DNI ingresado no coincide con el paciente de este estudio." };
    }

    const allOrders = await prisma.order.findMany({
      where: { patientId: linkOrder.patientId },
      include: {
        items: { include: { procedure: true } },
        dentist: true,
        branch: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, patient: linkOrder.patient, orders: allOrders };
  } catch (error) {
    console.error("🔥 ERROR EN PORTAL:", error);
    return { success: false, error: "Ocurrió un error al buscar los resultados. Reintentá en unos minutos." };
  }
}