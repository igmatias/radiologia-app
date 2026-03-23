"use server"

import { prisma } from "@/lib/prisma"

export async function searchOrdersGlobal(query: string) {
  if (!query || query.length < 2) return { success: false, orders: [] };
  
  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { patient: { dni: { contains: query } } },
          { patient: { lastName: { contains: query, mode: 'insensitive' } } },
          { patient: { firstName: { contains: query, mode: 'insensitive' } } }
        ]
      },
      include: {
        patient: true,
        items: { include: { procedure: true } },
        dentist: true
      },
      orderBy: { createdAt: 'desc' },
      take: 15 // Trae los últimos 15 resultados que coincidan
    });
    
    return { success: true, orders };
  } catch (error) {
    console.error("Error buscando órdenes:", error);
    return { success: false, orders: [] };
  }
}