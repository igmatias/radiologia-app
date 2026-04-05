"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/actions/auth"
import { startOfDateAR, endOfDateAR } from "@/lib/dates"

const FOUR_YEARS_MS = 4 * 366 * 24 * 60 * 60 * 1000

function dateCap(start: Date, end: Date, label: string) {
  const diff = end.getTime() - start.getTime()
  if (diff < 0) return `El rango de fechas es inválido.`
  if (diff > FOUR_YEARS_MS) return `${label} no puede superar los 4 años.`
  return null
}

export async function getDentistStats(dentistId: string, startDate: string, endDate: string) {
  try {
    const start = startOfDateAR(startDate)
    const end = endOfDateAR(endDate)

    const rangeError = dateCap(start, end, "El rango de fechas")
    if (rangeError) return { success: false, orders: [], chartData: [], totalProcedures: 0, totalPatients: 0, error: rangeError }

    const orders = await prisma.order.findMany({
      where: {
        dentistId: dentistId,
        status: { not: 'ANULADA' },
        createdAt: { gte: start, lte: end }
      },
      include: {
        patient: true,
        items: { include: { procedure: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 2000
    })

    const procedureCounts: Record<string, number> = {}
    let totalProcedures = 0
    const uniquePatients = new Set()

    orders.forEach(order => {
      uniquePatients.add(order.patientId)
      order.items.forEach(item => {
        const procName = item.procedure?.name || 'Desconocido'
        procedureCounts[procName] = (procedureCounts[procName] || 0) + 1
        totalProcedures++
      })
    })

    const chartData = Object.entries(procedureCounts)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / totalProcedures) * 100) || 0 }))
      .sort((a, b) => b.count - a.count)

    return { success: true, orders, chartData, totalProcedures, totalPatients: uniquePatients.size }
  } catch (error) {
    console.error("Error obteniendo stats:", error)
    return { success: false, orders: [], chartData: [], totalProcedures: 0, totalPatients: 0 }
  }
}

export async function getInsuranceBilling(obrasocialId: string, startDate: string, endDate: string, branchId: string, variantId?: string) {
  try {
    const start = startOfDateAR(startDate)
    const end = endOfDateAR(endDate)

    const rangeError = dateCap(start, end, "El rango de facturación")
    if (rangeError) return { success: false, items: [], error: rangeError }

    const whereClause: any = {
      order: {
        obraSocialId: obrasocialId,
        status: { not: 'ANULADA' },
        createdAt: { gte: start, lte: end }
      }
    }

    if (branchId && branchId !== "ALL") {
      whereClause.order.branchId = branchId
    }
    if (variantId) {
      whereClause.order.osVariantId = variantId
    }

    const items = await prisma.orderItem.findMany({
      where: whereClause,
      include: {
        procedure: true,
        order: { include: { patient: true, branch: true, osVariant: true } }
      },
      orderBy: { order: { createdAt: 'asc' } },
      take: 5000
    })

    const os = await prisma.obraSocial.findUnique({
      where: { id: obrasocialId },
      include: { priceList: { include: { prices: { select: { procedureId: true, customCode: true } } } } }
    })
    const codeMap: Record<string, string> = {}
    os?.priceList?.prices.forEach((p: any) => {
      if (p.customCode) codeMap[p.procedureId] = p.customCode
    })

    const itemsWithCode = items.map(item => ({
      ...item,
      displayCode: codeMap[item.procedureId] || item.procedure?.code || 'S/C'
    }))

    return { success: true, items: itemsWithCode }
  } catch (error) {
    console.error("Error obteniendo facturación:", error)
    return { success: false, items: [] }
  }
}

export async function updateItemInsuranceAmount(itemId: string, newAmount: number) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, error: "Sin permisos para modificar montos." }
  }
  try {
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { insuranceCoverage: newAmount }
    })
    return { success: true }
  } catch (error) {
    console.error("Error actualizando monto:", error)
    return { success: false, error: "No se pudo actualizar el monto." }
  }
}

export async function updateItemPatientCopay(itemId: string, amount: number) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, error: "Sin permisos para modificar copagos." }
  }
  try {
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { patientCopay: amount }
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al actualizar el copago." }
  }
}

export async function updateOrderDate(orderId: string, newDate: string) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, error: "Sin permisos para modificar fechas de órdenes." }
  }
  try {
    const date = new Date(newDate + "T12:00:00")
    await prisma.order.update({ where: { id: orderId }, data: { createdAt: date } })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al actualizar la fecha." }
  }
}
