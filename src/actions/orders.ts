"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { OrderStatus } from "@prisma/client"
import { startOfDay, endOfDay } from "date-fns"
import { startOfTodayAR, endOfTodayAR, startOfDateAR, endOfDateAR, currentYearAR } from "@/lib/dates"
import { toNum } from "@/lib/utils"
import { getCurrentSession } from "@/actions/auth"
import { z } from "zod"
import { sendStudyReadyEmail } from "@/lib/email"

// ─── Schemas de validación ────────────────────────────────────────────────────
const PatientSchema = z.object({
  dni: z.string().min(7, "DNI inválido").max(11, "DNI inválido").regex(/^\d+$/, "DNI solo debe contener números"),
  firstName: z.string().min(1, "Nombre requerido").max(100),
  lastName: z.string().min(1, "Apellido requerido").max(100),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  affiliateNumber: z.string().optional(),
  obrasocialId: z.string().optional(),
  plan: z.string().optional(),
})

const OrderItemSchema = z.object({
  procedureId: z.string().min(1, "ID de práctica requerido"),
  price: z.number().min(0, "Precio no puede ser negativo"),
  insuranceCoverage: z.number().min(0),
  patientCopay: z.number().min(0),
  teeth: z.array(z.number()).optional(),
  locations: z.array(z.string()).optional(),
  customName: z.string().optional().nullable(),
  metadata: z.object({
    photos: z.array(z.string()).optional(),
    basePhotoCount: z.number().optional(),
    extraPricePerPhoto: z.number().optional(),
  }).optional(),
})

const PaymentSchema = z.object({
  method: z.enum(["EFECTIVO", "TARJETA_DEBITO", "TARJETA_CREDITO", "TRANSFERENCIA", "MERCADOPAGO", "CUENTA_CORRIENTE", "OTRO", "SALDO"]),
  amount: z.number().min(0),
})

const CreateOrderSchema = z.object({
  branchId: z.string().min(1, "Sede requerida"),
  patient: PatientSchema,
  dentistId: z.string().optional(),
  osVariantId: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, "Debe agregar al menos una práctica"),
  total: z.number().min(0),
  patientAmount: z.number().min(0),
  insuranceAmount: z.number().min(0),
  notes: z.string().optional(),
  paymentsList: z.array(PaymentSchema).optional(),
})

const UpdateOrderSchema = z.object({
  dentistId: z.string().optional().nullable(),
  osVariantId: z.string().optional().nullable(),
  items: z.array(OrderItemSchema).min(1, "Debe agregar al menos una práctica"),
  total: z.number().min(0),
  patientAmount: z.number().min(0),
  insuranceAmount: z.number().min(0),
  notes: z.string().optional(),
  paymentsList: z.array(PaymentSchema).optional(),
})

// Helper para audit log
async function logOrderHistory(orderId: string, action: string, details?: string, oldStatus?: OrderStatus, newStatus?: OrderStatus, userId?: string) {
  try {
    await prisma.orderHistory.create({ data: { orderId, action, details, oldStatus, newStatus, userId } });
  } catch (e) { console.error("Error logging history:", e); }
}

/**
 * Genera una ESTIMACIÓN del próximo código de orden para mostrar en la UI.
 * ⚠️  NOTA: Solo es informativo. El código real se asigna atómicamente en createOrder()
 *     usando el dailyId (autoincrement) que garantiza unicidad sin race conditions.
 *     Este preview puede no coincidir exactamente si hay órdenes concurrentes.
 */
export async function getNextOrderNumber(branchId: string) {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true }
    })

    if (!branch) return "---"

    const prefix = branch.name.charAt(0).toUpperCase()
    const currentYear = currentYearAR()

    // Tomamos el dailyId más alto de este año para estimar el siguiente
    const lastOrder = await prisma.order.findFirst({
      where: {
        branchId,
        createdAt: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
        }
      },
      orderBy: { dailyId: 'desc' },
      select: { dailyId: true }
    })

    const nextNumber = (lastOrder?.dailyId ?? 0) + 1
    return `${prefix}-${currentYear}-${nextNumber.toString().padStart(6, '0')}`
  } catch (error) {
    console.error("Error al estimar Nro de Orden:", error)
    return "---"
  }
}

/**
 * Crea una nueva orden desde Recepción
 */
export async function createOrder(data: any) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };

  // Validar datos de entrada
  const parsed = CreateOrderSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError.message };
  }

  try {
    const { branchId, patient, dentistId, items, total, patientAmount, insuranceAmount, notes, paymentsList } = parsed.data

    const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } })
    const prefix = branch?.name?.charAt(0)?.toUpperCase() || "X"
    const currentYear = currentYearAR()

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
              metadata: {
                teeth: item.teeth || [],
                locations: item.locations || [],
                customName: item.customName || null,
                photos: item.metadata?.photos || [],
                basePhotoCount: item.metadata?.basePhotoCount ?? 5,
                extraPricePerPhoto: item.metadata?.extraPricePerPhoto ?? 0,
              }
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

    await logOrderHistory(newOrder.id, "ORDEN_CREADA", `Código: ${newOrder.code}. ${items.length} práctica(s). Total: $${total}`, undefined, "CREADA" as OrderStatus, session.id);
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
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };

  const parsed = UpdateOrderSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError.message };
  }

  try {
    const { dentistId, items, total, patientAmount, insuranceAmount, notes, paymentsList } = parsed.data

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
          metadata: {
            teeth: item.teeth || [],
            locations: item.locations || [],
            customName: item.customName || null,
            photos: item.metadata?.photos || [],
            basePhotoCount: item.metadata?.basePhotoCount ?? 5,
            extraPricePerPhoto: item.metadata?.extraPricePerPhoto ?? 0,
          }
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

    await logOrderHistory(orderId, "ORDEN_EDITADA", `${items.length} práctica(s). Total: $${total}`, undefined, undefined, session.id);
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
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  try {
    const isAnulando = currentStatus !== 'ANULADA';
    const newStatus: OrderStatus = isAnulando ? 'ANULADA' : 'CREADA';

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    if (!order) return { success: false, error: "Orden no encontrada" };

    // Usamos el orderId (UUID único) en la descripción para evitar borrar movimientos equivocados
    const anulacionTag = `[ANULACION:${orderId}]`;
    const description = `ANULACIÓN ORDEN Nº ${order.code || order.id} ${anulacionTag}`;

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
      // Filtramos por el tag único del orderId para no borrar movimientos equivocados.
      await prisma.cashMovement.deleteMany({
        where: {
          branchId: order.branchId,
          description: { contains: anulacionTag }
        }
      });
    }

    // 3. Actualizamos el estado real de la orden
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus }
    });

    await logOrderHistory(orderId, isAnulando ? "ORDEN_ANULADA" : "ORDEN_REACTIVADA", description, currentStatus as OrderStatus, newStatus, session.id);
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

export async function getPatientPendingDebt(dni: string) {
  try {
    const payments = await prisma.payment.findMany({
      where: { method: 'SALDO', order: { patient: { dni }, status: { not: 'ANULADA' } } },
      include: { order: { select: { code: true, createdAt: true } } }
    });
    const totalDebt = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    return { totalDebt, payments: payments.map(p => ({ amount: Number(p.amount), orderCode: p.order.code, date: p.order.createdAt })) };
  } catch (error) { return { totalDebt: 0, payments: [] } }
}

// Fix #3 — requiere sesión activa
export async function getPatientHistory(dni: string) {
  const session = await getCurrentSession()
  if (!session) return []
  try {
    return await prisma.order.findMany({
      where: { patient: { dni } },
      include: { branch: true, dentist: true, items: { include: { procedure: true } }, payments: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
  } catch (error) { return [] }
}

export async function getDailyOrders(branchId: string) {
  try {
    const ordenes = await prisma.order.findMany({
      where: {
        branchId,
        createdAt: { gte: startOfTodayAR(), lte: endOfTodayAR() }
      },
      include: { patient: true, dentist: true, items: { include: { procedure: true } }, payments: true },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: ordenes };
  } catch (error) { return { success: false, error: "Error al cargar órdenes" } }
}

const FOUR_YEARS_MS = 4 * 366 * 24 * 60 * 60 * 1000

// Control de recetas
export async function getOrdersForRecipeCheck(branchId: string, startDate: string, endDate: string, obraSocialId?: string, osVariantId?: string) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado", data: [] };
  try {
    const start = startOfDateAR(startDate);
    const end = endOfDateAR(endDate);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0 || diffMs > FOUR_YEARS_MS) return { success: false, error: "El rango de fechas no puede superar los 4 años.", data: [] };
    const where: any = { branchId, status: { not: 'ANULADA' }, createdAt: { gte: start, lte: end } };
    if (obraSocialId && obraSocialId !== 'ALL') where.obraSocialId = obraSocialId;
    if (osVariantId) where.osVariantId = osVariantId;
    const ordenes = await prisma.order.findMany({
      where,
      include: { patient: true, dentist: true, obraSocial: true, osVariant: true, items: { include: { procedure: true } } },
      orderBy: { createdAt: 'asc' },
      take: 5000
    });
    return { success: true, data: ordenes };
  } catch (error) { return { success: false, error: "Error al cargar órdenes", data: [] } }
}

export async function toggleRecipeCheck(orderId: string, checked: boolean, userName?: string) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        recipeChecked: checked,
        recipeCheckedAt: checked ? new Date() : null,
        recipeCheckedBy: checked ? (userName || null) : null
      }
    });
    return { success: true };
  } catch (error) { return { success: false, error: "Error al actualizar" } }
}

export async function updateOrderStatusAction(orderId: string, newStatus: OrderStatus | 'PARA_REPETIR') {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  try {
    const prev = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus as OrderStatus,
        completedAt: newStatus === 'LISTO_PARA_ENTREGA' ? new Date() : undefined
      }
    });
    await logOrderHistory(orderId, "CAMBIO_ESTADO", `${prev?.status} → ${newStatus}`, prev?.status, newStatus as OrderStatus, session.id);

    // Email al odontólogo cuando el estudio está listo (no-blocking)
    if (newStatus === 'LISTO_PARA_ENTREGA') {
      prisma.order.findUnique({
        where: { id: orderId },
        select: {
          code: true,
          dentist: { select: { firstName: true, lastName: true, email: true } },
          patient: { select: { firstName: true, lastName: true, dni: true } },
          branch: { select: { name: true } },
          items: { select: { procedure: { select: { name: true } } } },
        }
      }).then(order => {
        if (order?.dentist?.email) {
          sendStudyReadyEmail({
            to: order.dentist.email,
            dentistName: `${order.dentist.lastName}, ${order.dentist.firstName}`,
            patientName: `${order.patient?.lastName ?? ''}, ${order.patient?.firstName ?? ''}`,
            patientDni: order.patient?.dni ?? '',
            orderCode: order.code ?? orderId,
            procedures: order.items.map(i => i.procedure.name),
            branch: order.branch?.name ?? '',
          }).catch(e => console.error('[Email] Error enviando notificacion estudio listo:', e))
        }
      }).catch(() => {})
    }

    revalidatePath("/tecnico");
    revalidatePath("/recepcion");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return { success: false }
  }
}

export async function getAuditLog(startDate: string, endDate: string, search?: string) {
  const session = await getCurrentSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, logs: [], error: "Sin permisos para ver el log de auditoría." };
  }
  try {
    const start = startOfDateAR(startDate);
    const end = endOfDateAR(endDate);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0 || diffMs > FOUR_YEARS_MS) return { success: false, logs: [], error: "El rango de fechas no puede superar los 4 años." };
    const where: any = { createdAt: { gte: start, lte: end } };
    if (search?.trim()) {
      const term = search.trim().slice(0, 100) // Fix #7 — cap de longitud
      where.OR = [
        { action: { contains: term, mode: 'insensitive' } },
        { details: { contains: term, mode: 'insensitive' } },
        { order: { code: { contains: term, mode: 'insensitive' } } },
        { order: { patient: { lastName: { contains: term, mode: 'insensitive' } } } },
      ];
    }
    const logs = await prisma.orderHistory.findMany({
      where,
      include: { order: { include: { patient: { select: { lastName: true, firstName: true, dni: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 500
    });
    return { success: true, logs };
  } catch (error) { return { success: false, logs: [] } }
}

export async function getOrders() {
  try {
    return await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfTodayAR(),
          lte: endOfTodayAR(),
        },
      },
      include: { patient: true, dentist: true, items: { include: { procedure: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
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
      if (filters.startDate) where.createdAt.gte = startOfDateAR(filters.startDate)
      if (filters.endDate) where.createdAt.lte = endOfDateAR(filters.endDate)
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
  osVariantId?: string | null
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
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  if (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN') return { success: false, error: "Sin permisos" };
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
            hidden: i.hidden ?? false,
            metadata: { teeth: i.teeth || [], locations: i.locations || [] }
          }))
        })
        await tx.order.update({
          where: { id: orderId },
          data: { totalAmount: total, insuranceAmount: totalOS, patientAmount: totalPac }
        })
      }
    })

    await logOrderHistory(orderId, "ORDEN_EDITADA_ADMIN", `Campos editados: ${Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined).join(', ')}`, undefined, undefined, session.id);
    revalidatePath('/admin/ordenes')
    revalidatePath('/recepcion')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'No se pudo actualizar la orden' }
  }
}