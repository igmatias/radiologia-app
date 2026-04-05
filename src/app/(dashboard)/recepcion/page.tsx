import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/actions/auth"
import { redirect } from "next/navigation"
import RecepcionClient from "./recepcion-client"

export const dynamic = 'force-dynamic'

export default async function RecepcionPage() {
  const session = await getCurrentSession()
  if (!session) redirect('/login')
  if (session.role === 'TECHNICIAN') redirect('/tecnico')

  const [branches, dentists, obrasSociales, procedures, saldos] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true } }),
    prisma.dentist.findMany({ where: { isActive: true } }),
    prisma.obraSocial.findMany({ where: { isActive: true }, include: { variants: { orderBy: { name: 'asc' } } } }),
    prisma.procedure.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    }),
    prisma.payment.findMany({
      where: { method: 'SALDO' },
      include: {
        order: {
          include: { patient: true, items: { include: { procedure: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    })
  ])

  return (
    <RecepcionClient
      branches={branches}
      dentists={dentists}
      obrasSociales={obrasSociales}
      procedures={procedures}
      saldos={saldos}
    />
  )
}
