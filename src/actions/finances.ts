"use server"

import { prisma } from "@/lib/prisma"

export async function getDashboardMetrics(startDateStr: string, endDateStr: string, branchId?: string) {
  try {
    const start = new Date(`${startDateStr}T00:00:00.000-03:00`);
    const end = new Date(`${endDateStr}T23:59:59.999-03:00`);

    const orderWhere: any = {
      createdAt: { gte: start, lte: end },
      status: { not: "ANULADA" }
    };
    if (branchId && branchId !== "TODAS" && branchId !== "ALL") {
      orderWhere.branchId = branchId;
    }

    // Perf fix: todas las consultas en paralelo, aggregaciones en la DB (no en JS)
    const [
      pagosPorMetodo,
      orderStats,
      totalEstudios,
      pacientesUnicos,
      topDentistsRaw,
    ] = await Promise.all([
      // Ingresos agrupados por método en la DB (sin SALDO)
      prisma.payment.groupBy({
        by: ['method'],
        where: { method: { not: 'SALDO' }, order: orderWhere },
        _sum: { amount: true },
      }),
      // Total OS + total órdenes en un solo aggregate
      prisma.order.aggregate({
        where: orderWhere,
        _sum: { insuranceAmount: true },
        _count: { id: true },
      }),
      // Total estudios — count en DB sin traer registros
      prisma.orderItem.count({ where: { order: orderWhere } }),
      // Pacientes únicos — distinct en DB
      prisma.order.findMany({
        where: orderWhere,
        select: { patientId: true },
        distinct: ['patientId'],
      }),
      // Top dentistas por cantidad de órdenes — groupBy en DB
      prisma.order.groupBy({
        by: ['dentistId'],
        where: orderWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 6,
      }),
    ]);

    // Construir mapa de ingresos por método
    const ingresosPorMetodo: Record<string, number> = {
      EFECTIVO: 0, MERCADOPAGO: 0, TARJETA_DEBITO: 0, TARJETA_CREDITO: 0, TRANSFERENCIA: 0
    };
    let totalCaja = 0;
    for (const p of pagosPorMetodo) {
      const amount = Number(p._sum.amount ?? 0);
      totalCaja += amount;
      ingresosPorMetodo[p.method] = (ingresosPorMetodo[p.method] ?? 0) + amount;
    }

    // Resolver nombres de dentistas (solo para los top 6)
    const dentistIds = topDentistsRaw
      .map(d => d.dentistId)
      .filter((id): id is string => id !== null);

    const dentistNames = dentistIds.length > 0
      ? await prisma.dentist.findMany({
          where: { id: { in: dentistIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const dentistMap = Object.fromEntries(
      dentistNames.map(d => [d.id, `Dr. ${d.lastName}, ${d.firstName}`])
    );

    const topDentists = topDentistsRaw
      .map(d => ({
        name: d.dentistId ? (dentistMap[d.dentistId] ?? 'Desconocido') : 'PARTICULAR',
        count: d._count.id,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      success: true,
      data: {
        totalCaja,
        totalObrasSociales: Number(orderStats._sum.insuranceAmount ?? 0),
        totalEstudios,
        totalPacientes: pacientesUnicos.length,
        totalOrdenes: orderStats._count.id,
        ingresosPorMetodo,
        topDentists,
      }
    };
  } catch (error) {
    console.error("Error obteniendo métricas:", error);
    return { success: false, error: "Error al calcular métricas" };
  }
}
