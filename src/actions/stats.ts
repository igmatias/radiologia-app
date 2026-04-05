"use server"
import { prisma } from "@/lib/prisma"
import { subWeeks, subMonths, endOfWeek, endOfMonth, startOfWeek, startOfMonth } from "date-fns"
import { nowAR, endOfTodayAR } from "@/lib/dates"
import { toZonedTime, fromZonedTime } from "date-fns-tz"

const TZ = "America/Argentina/Buenos_Aires"
const ar = (d: Date) => toZonedTime(d, TZ)
const utc = (d: Date) => fromZonedTime(d, TZ)

export async function getComparativeStats(branchId?: string) {
  try {
    const now = nowAR()
    const branchFilter = branchId && branchId !== "ALL" ? { branchId } : {}
    const notAnulada = { NOT: { status: 'ANULADA' as const } }

    const thisWeekStart  = utc(startOfWeek(now, { weekStartsOn: 1 }))
    const lastWeekStart  = utc(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }))
    const lastWeekEnd    = utc(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }))
    const thisMonthStart = utc(startOfMonth(now))
    const lastMonthStart = utc(startOfMonth(subMonths(now, 1)))
    const lastMonthEnd   = utc(endOfMonth(subMonths(now, 1)))
    const endOfToday     = endOfTodayAR()

    const [semanaActual, semanaAnterior, mesActual, mesAnterior, topProcedures, porSede] = await Promise.all([
      prisma.order.aggregate({
        where: { ...branchFilter, ...notAnulada, createdAt: { gte: thisWeekStart, lte: endOfToday } },
        _sum: { patientAmount: true }, _count: true
      }),
      prisma.order.aggregate({
        where: { ...branchFilter, ...notAnulada, createdAt: { gte: lastWeekStart, lte: lastWeekEnd } },
        _sum: { patientAmount: true }, _count: true
      }),
      prisma.order.aggregate({
        where: { ...branchFilter, ...notAnulada, createdAt: { gte: thisMonthStart, lte: endOfToday } },
        _sum: { patientAmount: true }, _count: true
      }),
      prisma.order.aggregate({
        where: { ...branchFilter, ...notAnulada, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { patientAmount: true }, _count: true
      }),
      prisma.orderItem.groupBy({
        by: ['procedureId'],
        where: { order: { ...branchFilter, ...notAnulada, createdAt: { gte: thisMonthStart } } },
        _count: { id: true },
        _sum: { price: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),
      prisma.branch.findMany({
        where: { isActive: true },
        select: {
          id: true, name: true,
          orders: {
            where: { ...notAnulada, createdAt: { gte: thisMonthStart } },
            select: { patientAmount: true }
          }
        }
      })
    ])

    const procedureIds = topProcedures.map(p => p.procedureId)
    const procedures = await prisma.procedure.findMany({
      where: { id: { in: procedureIds } }, select: { id: true, name: true }
    })
    const procMap = Object.fromEntries(procedures.map(p => [p.id, p.name]))

    const maxProcQty = topProcedures[0]?._count.id || 1

    return {
      success: true,
      data: {
        semana: {
          actual: { monto: Number(semanaActual._sum.patientAmount ?? 0), ordenes: semanaActual._count },
          anterior: { monto: Number(semanaAnterior._sum.patientAmount ?? 0), ordenes: semanaAnterior._count }
        },
        mes: {
          actual: { monto: Number(mesActual._sum.patientAmount ?? 0), ordenes: mesActual._count },
          anterior: { monto: Number(mesAnterior._sum.patientAmount ?? 0), ordenes: mesAnterior._count }
        },
        topPracticas: topProcedures.map(p => ({
          nombre: procMap[p.procedureId] || 'Desconocido',
          cantidad: p._count.id,
          monto: Number(p._sum.price ?? 0),
          porcentaje: Math.round((p._count.id / maxProcQty) * 100)
        })),
        porSede: porSede.map(b => ({
          nombre: b.name,
          monto: b.orders.reduce((s, o) => s + Number(o.patientAmount), 0),
          ordenes: b.orders.length
        }))
      }
    }
  } catch (e) {
    console.error(e)
    return { success: false, data: null }
  }
}
