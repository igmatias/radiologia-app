"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { OrderStatus } from "@prisma/client"
import { startOfDay, endOfDay } from "date-fns"

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
    const { branchId, patient, dentistId, items, total, patientAmount, insuranceAmount, notes, orderNumber, paymentsList } = data

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

      return await tx.order.create({
        data: {
          code: orderNumber,
          branchId,
          patientId: dbPatient.id,
          dentistId: dentistId && dentistId !== "" ? dentistId : null,
          obraSocialId: patient.obrasocialId || null,
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
              metadata: { teeth: item.teeth || [], locations: item.locations || [] }
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
    })

    revalidatePath("/recepcion")
    revalidatePath("/tecnico") 
    return { success: true, orderId: newOrder.id }
  } catch (error) {
    console.error("Error creando orden:", error)
    return { success: false, error: "Error interno al procesar la orden" }
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
          metadata: { teeth: item.teeth || [], locations: item.locations || [] }
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
        .reduce((acc, curr) => acc + curr.amount, 0);

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
      amount: priceRecord?.amount || 0,
      insuranceCoverage: priceRecord?.insuranceCoverage || 0,
      patientCopay: priceRecord?.patientCopay || 0
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
      include: { branch: true, dentist: true, items: { include: { procedure: true } } },
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