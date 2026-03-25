import { prisma } from "@/lib/prisma"
import UsuariosClient from "./usuarios-client"

export default async function UsuariosPage() {
  // Traemos todo el personal, los odontólogos y las sedes de una sola vez
  const [users, dentists, branches] = await Promise.all([
    prisma.user.findMany({ 
      include: { branch: true },
      orderBy: { role: 'asc' } 
    }),
    prisma.dentist.findMany({ 
      orderBy: { lastName: 'asc' } 
    }),
    prisma.branch.findMany({
      where: { isActive: true }
    })
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <p className="text-xs font-black uppercase text-brand-700 tracking-[0.3em] mb-1">Configuración del Sistema</p>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Gestión de Accesos</h1>
      </div>
      
      <UsuariosClient 
        initialUsers={users} 
        initialDentists={dentists} 
        branches={branches} 
      />
    </div>
  );
}