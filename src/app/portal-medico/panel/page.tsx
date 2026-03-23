import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PanelMedicoClient from "./panel-client"

export default async function PanelMedicoPage() {
  // 🔥 SOLUCIÓN: Agregamos await acá también
  const cookieStore = await cookies()
  const dentistId = cookieStore.get("dentist_session")?.value

  if (!dentistId) {
    redirect("/portal-medico")
  }

  const dentist = await prisma.dentist.findUnique({
    where: { id: dentistId },
    include: {
      orders: {
        include: {
          patient: true,
          items: { include: { procedure: true } }
        },
        orderBy: { createdAt: 'desc' } 
      }
    }
  })

  if (!dentist) {
    redirect("/portal-medico")
  }

  return <PanelMedicoClient dentist={dentist} />
}