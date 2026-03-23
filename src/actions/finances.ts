"use server"

import { prisma } from "@/lib/prisma"

export async function getDashboardMetrics(startDateStr: string, endDateStr: string, branchId?: string) {
  try {
    const start = new Date(`${startDateStr}T00:00:00.000-03:00`);
    const end = new Date(`${endDateStr}T23:59:59.999-03:00`);

    const whereClause: any = {
      createdAt: { gte: start, lte: end },
      status: { not: "ANULADA" } 
    };

    // 🔥 CORRECCIÓN: Ahora ignora el filtro si le mandamos "TODAS" o "ALL"
    if (branchId && branchId !== "TODAS" && branchId !== "ALL") {
      whereClause.branchId = branchId;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        payments: true,
        items: true,
        dentist: true 
      }
    });

    let totalCaja = 0;
    let totalObrasSociales = 0;
    let totalEstudios = 0;
    const pacientesUnicos = new Set();
    
    const ingresosPorMetodo: Record<string, number> = {
      "EFECTIVO": 0,
      "MERCADOPAGO": 0,
      "TARJETA_DEBITO": 0,
      "TARJETA_CREDITO": 0,
      "TRANSFERENCIA": 0,
    };

    const dentistTally: Record<string, { name: string, count: number }> = {};

    orders.forEach(order => {
      totalObrasSociales += Number(order.insuranceAmount || 0);
      totalEstudios += order.items.length;
      pacientesUnicos.add(order.patientId);

      order.payments.forEach((p: any) => {
        if (p.method !== "SALDO") {
          const amount = Number(p.amount || 0);
          totalCaja += amount;
          if (ingresosPorMetodo[p.method] !== undefined) {
            ingresosPorMetodo[p.method] += amount;
          } else {
            ingresosPorMetodo[p.method] = amount;
          }
        }
      });

      const docName = order.dentist ? `Dr. ${order.dentist.lastName}, ${order.dentist.firstName}` : 'PARTICULAR';
      if (!dentistTally[docName]) {
        dentistTally[docName] = { name: docName, count: 0 };
      }
      dentistTally[docName].count += 1;
    });

    const topDentists = Object.values(dentistTally)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { 
      success: true, 
      data: {
        totalCaja,
        totalObrasSociales,
        totalEstudios,
        totalPacientes: pacientesUnicos.size,
        totalOrdenes: orders.length,
        ingresosPorMetodo,
        topDentists 
      } 
    };
  } catch (error) {
    console.error("Error obteniendo métricas:", error);
    return { success: false, error: "Error al calcular métricas" };
  }
}