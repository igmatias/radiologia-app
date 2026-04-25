"use server"

import { prisma } from "@/lib/prisma"
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit"

export async function getPatientResults(accessCode: string, dni: string) {
  if (!accessCode || accessCode === "undefined" || accessCode === "null") {
    return { success: false, error: "El enlace está corrupto o es inválido." };
  }

  // Rate limiting por código de acceso: máx 5 intentos fallidos en 15 min
  const rateLimitKey = `portal:${accessCode}`;
  const rateCheck = checkRateLimit(rateLimitKey);
  if (rateCheck.limited) {
    return {
      success: false,
      error: `Demasiados intentos fallidos. Intentá de nuevo en ${Math.ceil(rateCheck.retryAfterSeconds! / 60)} minutos.`,
    };
  }

  try {
    const linkOrder = await prisma.order.findFirst({
      where: { accessCode: accessCode },
      include: { patient: true }
    });

    if (!linkOrder) {
      return { success: false, error: "El enlace es inválido o el estudio no existe." };
    }

    // Limpiamos absolutamente todo lo que no sea número (puntos, espacios, guiones)
    const dbDni = linkOrder.patient.dni.toString().replace(/\D/g, '');
    const inputDni = dni.toString().replace(/\D/g, '');

    if (dbDni !== inputDni) {
      return { success: false, error: "El DNI ingresado no coincide con el paciente de este estudio." };
    }

    // DNI correcto: limpiar el rate limit
    clearRateLimit(rateLimitKey);

    const allOrders = await prisma.order.findMany({
      where: { patientId: linkOrder.patientId },
      include: {
        items: { include: { procedure: true } },
        dentist: true,
        branch: true,
        tomografiaData: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return { success: true, patient: linkOrder.patient, orders: allOrders };
  } catch (error) {
    console.error("Error en portal:", error);
    return { success: false, error: "Ocurrió un error al buscar los resultados. Reintentá en unos minutos." };
  }
}
