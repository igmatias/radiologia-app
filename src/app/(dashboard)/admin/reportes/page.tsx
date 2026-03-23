import { prisma } from "@/lib/prisma"
import ReportesClient from "./reportes-client"

export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  // Traemos los datos básicos para que funcionen los selectores del cliente
  const dentists = await prisma.dentist.findMany({ 
    where: { isActive: true },
    orderBy: { lastName: 'asc' }
  })
  
  const obrasSociales = await prisma.obraSocial.findMany({ 
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
  
  const branches = await prisma.branch.findMany({ 
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col justify-between items-start gap-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <p className="text-xs font-black uppercase text-red-700 tracking-[0.3em] mb-1">Módulo de Auditoría</p>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Liquidación y Métricas</h1>
      </div>
      
      {/* Llamamos al cliente pasándole los datos */}
      <ReportesClient 
        dentists={dentists} 
        obrasSociales={obrasSociales} 
        branches={branches} 
      />
    </div>
  )
}