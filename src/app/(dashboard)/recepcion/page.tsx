import { prisma } from "@/lib/prisma"
import RecepcionClient from "./recepcion-client"

export default async function RecepcionPage() {
  // Buscamos TODOS los datos de una sola vez, incluyendo los saldos pendientes
  const [branches, dentists, obrasSociales, procedures, saldos] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true } }),
    prisma.dentist.findMany({ where: { isActive: true } }),
    prisma.obraSocial.findMany({ where: { isActive: true } }),
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
      orderBy: { createdAt: 'desc' }
    })
  ])

  return (
    <div className="space-y-4 p-4 pt-6 pb-12 max-w-7xl mx-auto">
      {/* Le pasamos toda la info al nuevo controlador de pestañas */}
      <RecepcionClient 
        branches={branches}
        dentists={dentists}
        obrasSociales={obrasSociales}
        procedures={procedures}
        saldos={saldos}
      />
    </div>
  )
}