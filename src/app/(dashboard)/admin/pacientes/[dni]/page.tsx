import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PacienteTimelineClient from "./paciente-timeline-client"

export const dynamic = 'force-dynamic'

export default async function PacienteTimelinePage({ params }: { params: Promise<{ dni: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN') redirect('/recepcion')

  const { dni: rawDni } = await params
  const dni = decodeURIComponent(rawDni)

  const patient = await prisma.patient.findUnique({
    where: { dni },
    include: {
      defaultObraSocial: true,
      orders: {
        include: {
          branch: true,
          dentist: true,
          obraSocial: true,
          osVariant: true,
          items: { include: { procedure: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!patient) redirect('/admin/pacientes')

  return <PacienteTimelineClient patient={patient as any} />
}
