import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentSession } from '@/actions/auth'
import { generateOfflineHTML } from './template'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getCurrentSession()
  if (!session) return new NextResponse('No autorizado', { status: 401 })

  const [patients, procedures, obrasSociales, dentists, branches] = await Promise.all([
    prisma.patient.findMany({
      select: {
        id: true, dni: true, firstName: true, lastName: true,
        birthDate: true, affiliateNumber: true, plan: true,
        defaultObraSocialId: true, phone: true
      },
      orderBy: { lastName: 'asc' }
    }),
    prisma.procedure.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, category: true, requiresTooth: true, options: true },
      orderBy: { code: 'asc' }
    }),
    prisma.obraSocial.findMany({
      where: { isActive: true },
      include: {
        variants: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
        priceList: { include: { prices: { select: { procedureId: true, amount: true, insuranceCoverage: true, patientCopay: true } } } }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.dentist.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true, matriculaProv: true },
      orderBy: { lastName: 'asc' }
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ])

  // Build flat price map per OS: { osId: { procedureId: { amount, insuranceCoverage, patientCopay } } }
  const osSociales = obrasSociales.map(os => ({
    id: os.id,
    name: os.name,
    variants: os.variants,
    priceMap: Object.fromEntries(
      (os.priceList?.prices || []).map(p => [
        p.procedureId,
        {
          amount: Number(p.amount),
          insuranceCoverage: Number(p.insuranceCoverage),
          patientCopay: Number(p.patientCopay)
        }
      ])
    )
  }))

  const data = {
    patients: patients.map(p => ({
      ...p,
      birthDate: p.birthDate ? p.birthDate.toISOString() : null
    })),
    procedures,
    obrasSociales: osSociales,
    dentists,
    branches,
    generatedAt: new Date().toISOString()
  }

  const html = generateOfflineHTML(data)

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': 'attachment; filename="EMERGENCIA.html"',
      'Cache-Control': 'no-store'
    }
  })
}
