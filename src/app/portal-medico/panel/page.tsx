import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getDentistSession } from "@/lib/session"
import PanelMedicoClient from "./panel-client"

export default async function PanelMedicoPage() {
  const session = await getDentistSession()
  const dentistId = session?.dentistId

  if (!dentistId) {
    redirect("/portal-medico")
  }

  const [dentist, tickets] = await Promise.all([
    prisma.dentist.findUnique({
      where: { id: dentistId },
      include: {
        orders: {
          include: { patient: true, items: { include: { procedure: true } } },
          orderBy: { createdAt: 'desc' }
        },
        tickets: { orderBy: { createdAt: 'desc' }, take: 20 }
      }
    }),
    Promise.resolve([]) // ya incluido en dentist.tickets
  ])

  if (!dentist) {
    redirect("/portal-medico")
  }

  return <PanelMedicoClient dentist={dentist} />
}