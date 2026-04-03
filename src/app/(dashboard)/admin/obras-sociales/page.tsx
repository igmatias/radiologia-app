import { prisma } from "@/lib/prisma"
import { PriceEditor } from "@/components/admin/price-editor"

export const dynamic = 'force-dynamic'

export default async function AdminOSPage() {
  const obrasSociales = await prisma.obraSocial.findMany({
    include: {
      priceList: {
        include: {
          prices: true
        }
      },
      variants: { orderBy: { name: 'asc' } }
    },
    orderBy: { name: 'asc' }
  })

  const procedures = await prisma.procedure.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' }
  })

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black italic text-slate-800 tracking-tighter">ADMINISTRACIÓN</h1>
          <p className="text-slate-500 text-sm">Gestión de Obras Sociales y Aranceles</p>
        </div>
      </div>

      <PriceEditor 
        obrasSociales={obrasSociales} 
        procedures={procedures} 
      />
    </div>
  )
}