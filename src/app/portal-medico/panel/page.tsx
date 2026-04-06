import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getDentistSession } from "@/lib/session"
import PanelMedicoClient from "./panel-client"
import { isDoctorPortalEnabled } from "@/actions/settings"

export default async function PanelMedicoPage() {
  const [session, portalEnabled] = await Promise.all([
    getDentistSession(),
    isDoctorPortalEnabled()
  ])
  const dentistId = session?.dentistId

  if (!dentistId) {
    redirect("/portal-medico")
  }

  if (!portalEnabled) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔧</div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight mb-2">Portal temporalmente no disponible</h1>
          <p className="text-neutral-400 text-sm">Estamos realizando tareas de mantenimiento. Por favor intentá más tarde.</p>
          <p className="text-brand-400 font-bold text-sm mt-4">0810 333 4507</p>
        </div>
      </div>
    )
  }

  const [dentist, procedures] = await Promise.all([
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
    prisma.procedure.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, category: true, requiresTooth: true, options: true },
      orderBy: { code: 'asc' }
    })
  ])

  if (!dentist) {
    redirect("/portal-medico")
  }

  // Serializar Decimals de Prisma antes de pasar al Client Component
  const serialize = (obj: any): any => JSON.parse(JSON.stringify(obj, (_k, v) =>
    v?.constructor?.name === 'Decimal' ? Number(v) : v
  ))

  return <PanelMedicoClient dentist={serialize(dentist)} procedures={serialize(procedures)} />
}