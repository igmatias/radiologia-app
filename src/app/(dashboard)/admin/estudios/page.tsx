import { prisma } from "@/lib/prisma"
import EstudiosClient from "./estudios-client"

export default async function EstudiosPage() {
  // Traemos todos los estudios ordenados por código (09.01.01, 09.01.02, etc)
  const procedures = await prisma.procedure.findMany({
    orderBy: { code: 'asc' }
  });

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Catálogo de Estudios</h1>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Nomenclador de prácticas radiológicas</p>
      </div>

      <EstudiosClient initialProcedures={procedures} />
    </div>
  )
}