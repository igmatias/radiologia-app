export const dynamic = 'force-dynamic'

export default function AuditoriaPage() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <p className="text-xs font-black uppercase text-brand-700 tracking-[0.3em] mb-1">Módulo de Administración</p>
        <h1 className="text-3xl font-black italic text-slate-800 tracking-tighter uppercase">Log de Auditoría</h1>
        <p className="text-slate-500 text-sm">Registro de todas las acciones realizadas sobre las órdenes</p>
      </div>
      <AuditoriaClient />
    </div>
  )
}

import AuditoriaClient from "./auditoria-client"
