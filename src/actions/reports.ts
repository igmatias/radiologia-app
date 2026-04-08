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

// Fix #2 — getDentistStats ahora requiere sesión activa
export async function getDentistStats(dentistId: string, startDate: string, endDate: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, orders: [], chartData: [], totalProcedures: 0, totalPatients: 0, error: "No autenticado" }

  try {
    const start = startOfDateAR(startDate)
    const end = endOfDateAR(endDate)

    const rangeError = dateCap(start, end, "El rango de fechas")
    if (rangeError) return { success: false, orders: [], chartData: [], totalProcedures: 0, totalPatients: 0, error: rangeError }

    const orderWhere = {
      dentistId,
      status: { not: 'ANULADA' as const },
      createdAt: { gte: start, lte: end }
    }

    // Perf fix: 3 queries en paralelo — chart y pacientes se agregan en la DB, no en JS
    const [orders, procedureGroups, uniquePatients] = await Promise.all([
      // Lista de órdenes para la tabla
      prisma.order.findMany({
        where: orderWhere,
        include: {
          patient: true,
          items: { include: { procedure: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 2000
      }),
      // Conteo por práctica — groupBy en la DB
      prisma.orderItem.groupBy({
        by: ['procedureId'],
        where: { order: orderWhere },
        _count: { id: true },
      }),
      // Pacientes únicos — distinct en la DB
      prisma.order.findMany({
        where: orderWhere,
        select: { patientId: true },
        distinct: ['patientId'],
      }),
    ])

    // Resolver nombres de procedimientos para el chart (query pequeña)
    const procedureIds = procedureGroups.map(g => g.procedureId)
    const procedures = procedureIds.length > 0
      ? await prisma.procedure.findMany({
          where: { id: { in: procedureIds } },
          select: { id: true, name: true }
        })
      : []
    const procMap = Object.fromEntries(procedures.map(p => [p.id, p.name]))

    const totalProcedures = procedureGroups.reduce((acc, g) => acc + g._count.id, 0)
    const chartData = procedureGroups
      .map(g => ({
        name: procMap[g.procedureId] || 'Desconocido',
        count: g._count.id,
        percentage: totalProcedures > 0 ? Math.round((g._count.id / totalProcedures) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)

    return { success: true, orders, chartData, totalProcedures, totalPatients: uniquePatients.length }
  } catch (error) {
    console.error("Error obteniendo stats:", error)
    return { success: false, orders: [], chartData: [], totalProcedures: 0, totalPatients: 0 }
  }
}

// Fix #2 — getInsuranceBilling ahora requiere ADMIN o SUPERADMIN
export async function getInsuranceBilling(obrasocialId: string, startDate: string, endDate: string, branchId: string, variantId?: string) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, items: [], error: "Sin permisos para acceder a la facturación." }
  }

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

    // Perf fix: select explicito — no traer campos no usados en facturacion
    const items = await prisma.orderItem.findMany({
      where: whereClause,
      select: {
        id: true,
        procedureId: true,
        price: true,
        insuranceCoverage: true,
        patientCopay: true,
        procedure: { select: { id: true, name: true, code: true } },
        order: {
          select: {
            id: true,
            code: true,
            createdAt: true,
            patient: { select: { firstName: true, lastName: true, affiliateNumber: true, plan: true, dni: true } },
            branch: { select: { id: true, name: true } },
            osVariant: { select: { id: true, name: true } },
          }
        }
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

export async function getBillingPeriodsForOS(obraSocialId: string) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, periods: [] }
  }
  try {
    const periods = await prisma.billingPeriod.findMany({
      where: { obraSocialId },
      orderBy: { startDate: 'desc' }
    })
    return { success: true, periods }
  } catch (error) {
    console.error("Error obteniendo períodos:", error)
    return { success: false, periods: [] }
  }
}

// Fix #6 — validación de montos negativos
export async function updateItemInsuranceAmount(itemId: string, newAmount: number) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, error: "Sin permisos para modificar montos." }
  }
  if (newAmount < 0) return { success: false, error: "El monto no puede ser negativo." }
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

// Fix #6 — validación de montos negativos
export async function updateItemPatientCopay(itemId: string, amount: number) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, error: "Sin permisos para modificar copagos." }
  }
  if (amount < 0) return { success: false, error: "El copago no puede ser negativo." }
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

// Fix #4 — updateOrderDate ahora registra auditoría
export async function updateOrderDate(orderId: string, newDate: string) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, error: "Sin permisos para modificar fechas de órdenes." }
  }
  try {
    const prev = await prisma.order.findUnique({ where: { id: orderId }, select: { createdAt: true } })
    const date = new Date(newDate + "T12:00:00")
    await prisma.order.update({ where: { id: orderId }, data: { createdAt: date } })
    // Registro de auditoría: quién cambió qué fecha
    await prisma.orderHistory.create({
      data: {
        orderId,
        action: "FECHA_MODIFICADA",
        details: `${prev?.createdAt?.toISOString().split('T')[0] ?? '?'} -> ${newDate}`,
        userId: session.id,
      }
    }).catch(() => {}) // no bloquear si falla el log
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al actualizar la fecha." }
  }
}
