"use server"

import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"

export async function getDentistStats(dentistId: string, startDate: string, endDate: string) {
  try {
    // Manejo de fechas seguro para evitar saltos de zona horaria
    const start = startOfDay(new Date(startDate + "T12:00:00"));
    const end = endOfDay(new Date(endDate + "T12:00:00"));

    const orders = await prisma.order.findMany({
      where: {
        dentistId: dentistId,
        status: { not: 'ANULADA' }, // 🔥 CRUCIAL: No contamos las anuladas en las métricas
        createdAt: { gte: start, lte: end }
      },
      include: {
        patient: true,
        items: { include: { procedure: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Armamos el recuento de estudios para el gráfico
    const procedureCounts: Record<string, number> = {};
    let totalProcedures = 0;
    const uniquePatients = new Set(); // 🔥 Set para contar pacientes únicos reales

    orders.forEach(order => {
      uniquePatients.add(order.patientId);
      order.items.forEach(item => {
        const procName = item.procedure?.name || 'Desconocido';
        procedureCounts[procName] = (procedureCounts[procName] || 0) + 1;
        totalProcedures++;
      });
    });

    // Lo convertimos a un array ordenado de mayor a menor
    const chartData = Object.entries(procedureCounts)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / totalProcedures) * 100) || 0 }))
      .sort((a, b) => b.count - a.count);

    return { 
      success: true, 
      orders, 
      chartData, 
      totalProcedures, 
      totalPatients: uniquePatients.size 
    };
  } catch (error) {
    console.error("Error obteniendo stats:", error);
    return { success: false, orders: [], chartData: [], totalProcedures: 0, totalPatients: 0 };
  }
}

export async function getInsuranceBilling(obrasocialId: string, startDate: string, endDate: string, branchId: string, variantId?: string) {
  try {
    const start = startOfDay(new Date(startDate + "T12:00:00"));
    const end = endOfDay(new Date(endDate + "T12:00:00"));

    // Armamos el filtro base
    const whereClause: any = {
      order: {
        obraSocialId: obrasocialId,
        status: { not: 'ANULADA' },
        createdAt: { gte: start, lte: end }
      }
    };

    // Filtro por sede
    if (branchId && branchId !== "ALL") {
      whereClause.order.branchId = branchId;
    }

    // Filtro por sub-selección (variante)
    if (variantId) {
      whereClause.order.osVariantId = variantId;
    }

    const items = await prisma.orderItem.findMany({
      where: whereClause,
      include: {
        procedure: true,
        order: {
          include: { patient: true, branch: true, osVariant: true }
        }
      },
      orderBy: {
        order: { createdAt: 'asc' }
      }
    });

    // Cargar el mapa de códigos personalizados para esta OS
    const os = await prisma.obraSocial.findUnique({
      where: { id: obrasocialId },
      include: { priceList: { include: { prices: { select: { procedureId: true, customCode: true } } } } }
    });
    const codeMap: Record<string, string> = {};
    os?.priceList?.prices.forEach((p: any) => {
      if (p.customCode) codeMap[p.procedureId] = p.customCode;
    });

    // Adjuntar el código a usar (personalizado si existe, sino el de la práctica)
    const itemsWithCode = items.map(item => ({
      ...item,
      displayCode: codeMap[item.procedureId] || item.procedure?.code || 'S/C'
    }));

    return { success: true, items: itemsWithCode };
  } catch (error) {
    console.error("Error obteniendo facturación:", error);
    return { success: false, items: [] };
  }
}

// 🔥 Esta es la función clave para el ajuste rápido de precio
export async function updateItemInsuranceAmount(itemId: string, newAmount: number) {
  try {
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { insuranceCoverage: newAmount }
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error actualizando monto:", error);
    return { success: false, error: "No se pudo actualizar el monto" };
  }
}

export async function updateItemPatientCopay(itemId: string, amount: number) {
  try {
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { patientCopay: amount }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar el copago" };
  }
}

export async function updateOrderDate(orderId: string, newDate: string) {
  try {
    const date = new Date(newDate + "T12:00:00")
    await prisma.order.update({ where: { id: orderId }, data: { createdAt: date } })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al actualizar la fecha" }
  }
}