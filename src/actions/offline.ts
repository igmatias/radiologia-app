'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentSession } from '@/actions/auth'

export async function importOfflineSession(data: any) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, error: 'Sin permisos' }
  }

  if (!data?.version || !data?.orders) {
    return { success: false, error: 'Archivo inválido o corrupto' }
  }

  const log: string[] = []
  let ordersCreated = 0
  let patientsCreated = 0
  let cajaCreated = 0
  const errors: string[] = []

  try {
    // ── 1. Órdenes ──────────────────────────────────────────────
    for (const o of (data.orders || [])) {
      try {
        // Upsert paciente por DNI
        let patientId: string

        if (o.patientDni) {
          const patient = await prisma.patient.upsert({
            where: { dni: o.patientDni },
            update: {
              firstName: o.patientFirstName || undefined,
              lastName: o.patientLastName || undefined,
              birthDate: o.patientBirthDate ? new Date(o.patientBirthDate) : undefined,
              phone: o.patientPhone || undefined,
              defaultObraSocialId: o.obraSocialId || undefined,
            },
            create: {
              dni: o.patientDni,
              firstName: o.patientFirstName || null,
              lastName: o.patientLastName || null,
              birthDate: o.patientBirthDate ? new Date(o.patientBirthDate) : null,
              phone: o.patientPhone || null,
              affiliateNumber: o.patientAffiliateNumber || null,
              plan: o.patientPlan || null,
              defaultObraSocialId: o.obraSocialId || null,
            }
          })
          patientId = patient.id
          if (!patient.updatedAt || new Date(patient.updatedAt).getTime() < Date.now() - 1000) {
            patientsCreated++
          }
        } else {
          errors.push(`Orden sin DNI (tempId: ${o.tempId}) — omitida`)
          continue
        }

        // Resolver branchId
        let branchId = o.branchId || data.branchId
        if (!branchId) {
          const branch = await prisma.branch.findFirst({ where: { isActive: true } })
          branchId = branch?.id
        }
        if (!branchId) {
          errors.push(`Sin sede para orden de ${o.patientLastName} — omitida`)
          continue
        }

        // Generar código de orden
        const now = new Date()
        const year = now.getFullYear()
        const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } })
        const prefix = (branch?.name?.[0] || 'X').toUpperCase()

        const order = await prisma.order.create({
          data: {
            branchId,
            patientId,
            obraSocialId: o.obraSocialId || null,
            osVariantId: o.osVariantId || null,
            dentistId: o.dentistId || null,
            status: 'CREADA',
            notes: o.notes || null,
            totalAmount: o.totalAmount || 0,
            patientAmount: o.patientAmount || 0,
            insuranceAmount: o.insuranceAmount || 0,
            createdAt: o.createdAt ? new Date(o.createdAt) : now,
            accessCode: crypto.randomUUID(),
            items: {
              create: (o.items || []).map((it: any) => ({
                procedureId: it.procedureId,
                price: it.amount || 0,
                insuranceCoverage: it.insuranceCoverage || 0,
                patientCopay: it.patientCopay || 0,
                status: 'CREADA',
                metadata: { offlineImport: true }
              }))
            }
          }
        })

        // Actualizar código
        const codeStr = `${prefix}-${year}-${String(order.dailyId).padStart(6, '0')}`
        await prisma.order.update({
          where: { id: order.id },
          data: { code: codeStr }
        })

        ordersCreated++
        log.push(`✓ Orden ${codeStr} — ${o.patientLastName}, ${o.patientFirstName}`)
      } catch (err: any) {
        errors.push(`Error en orden de ${o.patientLastName || '?'}: ${err.message}`)
      }
    }

    // ── 2. Movimientos de caja ───────────────────────────────────
    const branchId = data.branchId
    if (branchId) {
      for (const m of (data.cajaMovimientos || [])) {
        try {
          if (m.type === 'COBRO') {
            // Los cobros de órdenes se registran como pagos — acá solo los registramos como nota
            // No creamos Payment porque no tenemos el orderId; solo registramos como movimiento extra
            await prisma.cashMovement.create({
              data: {
                branchId,
                type: 'INGRESO_EXTRA',
                amount: m.amount,
                description: `[OFFLINE] ${m.description}`,
                method: m.method || 'EFECTIVO',
                createdAt: m.createdAt ? new Date(m.createdAt) : new Date()
              }
            })
          } else {
            await prisma.cashMovement.create({
              data: {
                branchId,
                type: 'GASTO',
                amount: m.amount,
                description: `[OFFLINE] ${m.description}`,
                method: m.method || 'EFECTIVO',
                createdAt: m.createdAt ? new Date(m.createdAt) : new Date()
              }
            })
          }
          cajaCreated++
        } catch (err: any) {
          errors.push(`Error en movimiento de caja: ${err.message}`)
        }
      }
    }

    return {
      success: true,
      ordersCreated,
      patientsCreated,
      cajaCreated,
      log,
      errors
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
