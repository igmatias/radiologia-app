"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { OrderStatus } from "@prisma/client"
import { startOfDay, endOfDay } from "date-fns"
import { toNum } from "@/lib/utils"

/**
 * Genera el próximo número de orden correlativo para una sucursal.
 */
export async function getNextOrderNumber(branchId: string) {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true }
    })

    if (!branch) throw new Error("Sucursal no encontrada")

    const prefix = branch.name.charAt(0).toUpperCase()
    const currentYear = new Date().getFullYear()

    const lastOrder = await prisma.order.findFirst({
      where: {
        branchId: branchId,
        createdAt: {
          gte: new Date(`${currentYear}-01-01`),
          lt: new Date(`${currentYear + 1}-01-01`),
        }
      },
      orderBy: { createdAt: 'desc' },
      select: { code: true }
    })

    let nextNumber = 1
    if (lastOrder?.code) {
      const parts = lastOrder.code.split('-')
      const lastCount = parseInt(parts[parts.length - 1])
      if (!isNaN(lastCount)) {
        nextNumber = lastCount + 1
      }
    }

    return `${prefix}-${currentYear}-${nextNumber.toString().padStart(6, '0')}`
  } catch (error) {
    console.error("Error al generar Nro de Orden:", error)
    return `ERR-${Math.floor(Math.random() * 1000)}`
  }
}

/**
 * Crea una nueva orden desde Recepción
 */
export async function createOrder(data: any) {
  try {
    const { branchId, patient, dentistId, items, total, patientAmount, insuranceAmount, notes, paymentsList } = data

    const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } })
    const prefix = branch?.name?.charAt(0)?.toUpperCase() || "X"
    const currentYear = new Date().getFullYear()

    const newOrder = await prisma.$transaction(async (tx) => {
      const dbPatient = await tx.patient.upsert({
        where: { dni: patient.dni },
        update: {
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone || null,
          email: patient.email || null, 
          birthDate: patient.birthDate ? new Date(patient.birthDate) : null,
          affiliateNumber: patient.affiliateNumber || null,
          plan: patient.plan || null,
          defaultObraSocialId: patient.obrasocialId || null,
        },
        create: {
          dni: patient.dni,
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone || null,
          email: patient.email || null, 
          birthDate: patient.birthDate ? new Date(patient.birthDate) : null,
          affiliateNumber: patient.affiliateNumber || null,
          plan: patient.plan || null,
          defaultObraSocialId: patient.obrasocialId || null,
        },
      })

      // Crear sin code primero para obtener el dailyId autoincrement
      const created = await tx.order.create({
        data: {
          branchId,
          patientId: dbPatient.id,
          dentistId: dentistId && dentistId !== "" ? dentistId : null,
          obraSocialId: patient.obrasocialId || null,
          osVariantId: data.osVariantId || null,
          totalAmount: total,
          patientAmount: patientAmount || 0,
          insuranceAmount: insuranceAmount || 0,
          notes,
          status: "CREADA",
          items: {
            create: items.map((item: any) => ({
              procedureId: item.procedureId,
              price: item.price,
              patientCopay: item.patientCopay || 0,
              insuranceCoverage: item.insuranceCoverage || 0,
              status: "CREADA",
              metadata: { teeth: item.teeth || [], locations: item.locations || [], customName: item.customName || null }
            }))
          },
          payments: {
            create: paymentsList?.filter((p: any) => p.amount > 0).map((p: any) => ({
              amount: p.amount,
              method: p.method
            })) || []
          }
        },
      })

      // Usar dailyId para generar el código único (autoincrement = sin colisiones)
      const orderCode = `${prefix}-${currentYear}-${created.dailyId.toString().padStart(6, '0')}`
      return await tx.order.update({
        where: { id: created.id },
        data: { code: orderCode },
      })
    })

    revalidatePath("/recepcion")
    revalidatePath("/tecnico")
    return { success: true, orderId: newOrder.id, orderCode: newOrder.code }
  } catch (error: any) {
    console.error("Error creando orden:", error)
    const msg = error?.message || String(error)
    return { success: false, error: msg.length > 200 ? msg.slice(0, 200) : msg }
  }
}

/**
 * Actualiza una orden existente (Edición)
 */
export async function updateOrder(orderId: string, data: any) {
  try {
    const { dentistId, items, total, patientAmount, insuranceAmount, notes, paymentsList, branchId } = data

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          dentistId: dentistId || null,
          totalAmount: total,
          patientAmount: patientAmount,
          insuranceAmount: insuranceAmount,
          notes: notes,
        }
      })

      await tx.orderItem.deleteMany({ where: { orderId } })
      await tx.orderItem.createMany({
        data: items.map((item: any) => ({
          orderId,
          procedureId: item.procedureId,
          price: item.price,
          patientCopay: item.patientCopay || 0,
          insuranceCoverage: item.insuranceCoverage || 0,
          status: "CREADA",
          metadata: { teeth: item.teeth || [], locations: item.locations || [], customName: item.customName || null }
        }))
      })

      if (paymentsList && paymentsList.length > 0) {
        for (const p of paymentsList) {
          if (p.amount > 0) {
            await tx.payment.create({
              data: { orderId, amount: p.amount, method: p.method }
            })
            // Nota: Aquí no creamos CashMovement manual porque el sistema ya suma 
            // los registros de la tabla 'Payment' en el total de la caja.
          }
        }
      }
    })

    revalidatePath("/recepcion")
    revalidatePath("/tecnico")
    return { success: true }
  } catch (error) {
    console.error("Error editando orden:", error)
    return { success: false, error: "No se pudo actualizar la orden" }
  }
}

/**
 * Alterna entre ANULADA y CREADA con impacto contable limpio
 */
export async function toggleOrderActivation(orderId: string, currentStatus: string) {
  try {
    const isAnulando = currentStatus !== 'ANULADA';
    const newStatus: OrderStatus = isAnulando ? 'ANULADA' : 'CREADA';

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    if (!order) return { success: false, error: "Orden no encontrada" };

    const description = `ANULACIÓN ORDEN Nº ${order.code || order.id}`;

    if (isAnulando) {
      // 1. Si anulamos, calculamos el efectivo a restar y creamos un GASTO
      const totalEfectivo = order.payments
        .filter(p => p.method === 'EFECTIVO')
        .reduce((acc, curr) => acc + toNum(curr.amount), 0);

      if (totalEfectivo > 0) {
        await prisma.cashMovement.create({
          data: {
            branchId: order.branchId,
            type: 'GASTO',
            amount: totalEfectivo,
            description: description,
            method: 'EFECTIVO'
          }
        });
      }
    } else {
      // 2. Si reactivamos, BORRAMOS el movimiento de gasto que creamos al anular.
      // Esto devuelve el balance de caja a la normalidad.
      await prisma.cashMovement.deleteMany({
        where: {
          branchId: order.branchId,
          description: description
        }
      });
    }

    // 3. Actualizamos el estado real de la orden
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus }
    });

    revalidatePath("/recepcion");
    revalidatePath("/tecnico");
    return { success: true };
  } catch (error) {
    console.error("Error en toggleOrderActivation:", error);
    return { success: false, error: "Error al procesar el cambio de estado" };
  }
}

// --- FUNCIONES DE CONSULTA (MANTENIDAS) ---

export async function getProcedurePrice(procedureId: string, obraSocialId: string) {
  try {
    const os = await prisma.obraSocial.findUnique({
      where: { id: obraSocialId },
      select: { priceListId: true }
    })
    if (!os?.priceListId) return { amount: 0, insuranceCoverage: 0, patientCopay: 0 }
    const priceRecord = await prisma.price.findUnique({
      where: { priceListId_procedureId: { priceListId: os.priceListId, procedureId: procedureId } }
    })
    return {
      amount: toNum(priceRecord?.amount),
      insuranceCoverage: toNum(priceRecord?.insuranceCoverage),
      patientCopay: toNum(priceRecord?.patientCopay)
    }
  } catch (error) { return { amount: 0, insuranceCoverage: 0, patientCopay: 0 } }
}

export async function getPatientByDni(dni: string) {
  try {
    return await prisma.patient.findUnique({
      where: { dni },
      select: { firstName: true, lastName: true, birthDate: true, phone: true, email: true, affiliateNumber: true, plan: true, defaultObraSocialId: true }
    })
  } catch (error) { return null }
}

export async function getPatientHistory(dni: string) {
  try {
    return await prisma.order.findMany({
      where: { patient: { dni } },
      include: { branch: true, dentist: true, items: { include: { procedure: true } }, payments: true },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) { return [] }
}

export async function getDailyOrders(branchId: string) {
  try {
    const hoy = new Date();
    const ordenes = await prisma.order.findMany({
      where: {
        branchId,
        createdAt: { gte: startOfDay(hoy), lte: endOfDay(hoy) }
      },
      include: { patient: true, dentist: true, items: { include: { procedure: true } }, payments: true },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: ordenes };
  } catch (error) { return { success: false, error: "Error al cargar órdenes" } }
}

export async function updateOrderStatusAction(orderId: string, newStatus: OrderStatus | 'PARA_REPETIR') {
  try {
    // Si el estado es PARA_REPETIR lo guardamos, sino usamos el normal
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: newStatus as OrderStatus,
        completedAt: newStatus === 'LISTO_PARA_ENTREGA' ? new Date() : undefined
      }
    });
    revalidatePath("/tecnico");
    revalidatePath("/recepcion");
    return { success: true };
  } catch (error) { 
    console.error("Error al actualizar estado:", error);
    return { success: false } 
  }
}

export async function getOrders() {
  try {
    return await prisma.order.findMany({
      include: { patient: true, dentist: true, items: { include: { procedure: true } } },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) { return [] }
}

export async function searchOrdersAdmin(filters: {
  search?: string
  branchId?: string
  obraSocialId?: string
  osVariantId?: string
  procedureId?: string
  startDate?: string
  endDate?: string
  status?: string
}) {
  try {
    const where: any = {}

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = startOfDay(new Date(filters.startDate + "T12:00:00"))
      if (filters.endDate) where.createdAt.lte = endOfDay(new Date(filters.endDate + "T12:00:00"))
    }
    if (filters.branchId && filters.branchId !== 'ALL') where.branchId = filters.branchId
    if (filters.obraSocialId && filters.obraSocialId !== 'ALL') where.obraSocialId = filters.obraSocialId
    if (filters.osVariantId) where.osVariantId = filters.osVariantId
    if (filters.status && filters.status !== 'ALL') where.status = filters.status
    if (filters.procedureId && filters.procedureId !== 'ALL') {
      where.items = { some: { procedureId: filters.procedureId } }
    }
    if (filters.search?.trim()) {
      const s = filters.search.trim()
      where.OR = [
        { code: { contains: s, mode: 'insensitive' } },
        { patient: { dni: { contains: s } } },
        { patient: { lastName: { contains: s, mode: 'insensitive' } } },
        { patient: { firstName: { contains: s, mode: 'insensitive' } } },
      ]
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        patient: true,
        dentist: true,
        branch: true,
        obraSocial: { include: { variants: true } },
        osVariant: true,
        items: { include: { procedure: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return { success: true, orders: JSON.parse(JSON.stringify(orders, (_k, v) =>
      v?.constructor?.name === 'Decimal' ? Number(v) : v
    )) }
  } catch (error) {
    console.error(error)
    return { success: false, orders: [] }
  }
}

export async function adminUpdateOrder(orderId: string, data: {
  code?: string
  createdAt?: string
  status?: string
  notes?: string
  dentistId?: string | null
  obraSocialId?: string | null
  branchId?: string
  patient?: {
    firstName?: string
    lastName?: string
    phone?: string
    email?: string
    birthDate?: string | null
    affiliateNumber?: string
    plan?: string
  }
  items?: Array<{
    procedureId: string
    price: number
    insuranceCoverage: number
    patientCopay: number
    teeth?: string[]
    locations?: string[]
  }>
}) {
  try {
    await prisma.$transaction(async (tx) => {
      const orderUpdate: any = {}
      if (data.code !== undefined) orderUpdate.code = data.code
      if (data.createdAt) orderUpdate.createdAt = new Date(data.createdAt + "T12:00:00")
      if (data.status) orderUpdate.status = data.status
      if (data.notes !== undefined) orderUpdate.notes = data.notes
      if (data.dentistId !== undefined) orderUpdate.dentistId = data.dentistId
      if (data.obraSocialId !== undefined) orderUpdate.obraSocialId = data.obraSocialId
      if (data.osVariantId !== undefined) orderUpdate.osVariantId = data.osVariantId || null
      if (data.branchId) orderUpdate.branchId = data.branchId

      if (Object.keys(orderUpdate).length > 0) {
        await tx.order.update({ where: { id: orderId }, data: orderUpdate })
      }

      if (data.patient) {
        const order = await tx.order.findUnique({ where: { id: orderId }, select: { patientId: true } })
        if (order) {
          const patUpdate: any = {}
          if (data.patient.firstName !== undefined) patUpdate.firstName = data.patient.firstName
          if (data.patient.lastName !== undefined) patUpdate.lastName = data.patient.lastName
          if (data.patient.phone !== undefined) patUpdate.phone = data.patient.phone
          if (data.patient.email !== undefined) patUpdate.email = data.patient.email
          if (data.patient.birthDate !== undefined) patUpdate.birthDate = data.patient.birthDate ? new Date(data.patient.birthDate) : null
          if (data.patient.affiliateNumber !== undefined) patUpdate.affiliateNumber = data.patient.affiliateNumber
          if (data.patient.plan !== undefined) patUpdate.plan = data.patient.plan
          if (Object.keys(patUpdate).length > 0) {
            await tx.patient.update({ where: { id: order.patientId }, data: patUpdate })
          }
        }
      }

      if (data.items) {
        await tx.orderItem.deleteMany({ where: { orderId } })
        const total = data.items.reduce((acc, i) => acc + i.price, 0)
        const totalOS = data.items.reduce((acc, i) => acc + i.insuranceCoverage, 0)
        const totalPac = data.items.reduce((acc, i) => acc + i.patientCopay, 0)
        await tx.orderItem.createMany({
          data: data.items.map(i => ({
            orderId,
            procedureId: i.procedureId,
            price: i.price,
            insuranceCoverage: i.insuranceCoverage,
            patientCopay: i.patientCopay,
            status: 'CREADA',
            metadata: { teeth: i.teeth || [], locations: i.locations || [] }
          }))
        })
        await tx.order.update({
          where: { id: orderId },
          data: { totalAmount: total, insuranceAmount: totalOS, patientAmount: totalPac }
        })
      }
    })

    revalidatePath('/admin/ordenes')
    revalidatePath('/recepcion')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'No se pudo actualizar la orden' }
  }
}