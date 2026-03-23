import { prisma } from "@/lib/prisma"
import SedesClient from "./sedes-client"

export default async function SedesPage() {
  // Traemos las sedes y todos sus equipos asociados
  const branches = await prisma.branch.findMany({
    include: {
      equipments: {
        orderBy: { type: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Gestión de Sedes</h1>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Configuración de Sucursales, Salas y Equipamiento IT</p>
      </div>

      <SedesClient initialBranches={branches} />
    </div>
  )
}