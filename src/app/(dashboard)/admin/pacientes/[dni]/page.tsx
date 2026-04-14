import { getCurrentSession } from "@/actions/auth"
import { redirect } from "next/navigation"
import { getPatientTimeline } from "@/actions/orders"
import PacienteTimelineClient from "./paciente-timeline-client"

export const dynamic = 'force-dynamic'

export default async function PacienteTimelinePage({ params }: { params: { dni: string } }) {
  const session = await getCurrentSession()
  if (!session) redirect('/login')
  if (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN') redirect('/recepcion')

  const patient = await getPatientTimeline(decodeURIComponent(params.dni))
  if (!patient) redirect('/admin/ordenes')

  return <PacienteTimelineClient patient={patient as any} />
}
