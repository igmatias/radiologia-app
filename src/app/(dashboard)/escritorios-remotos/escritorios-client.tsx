"use client"

import { useState } from "react"
import { Monitor, Wifi, WifiOff, ExternalLink } from "lucide-react"

type Equipment = {
  id: string
  name: string
  room: string | null
  tailscaleIp: string | null
  ipAddress: string | null
  anydeskId: string | null
}

type Branch = {
  id: string
  name: string
  equipments: Equipment[]
}

function PCCard({ eq }: { eq: Equipment }) {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = () => {
    if (!eq.tailscaleIp) return
    setConnecting(true)
    window.open(`vnc://${eq.tailscaleIp}`, '_blank')
    setTimeout(() => setConnecting(false), 2000)
  }

  const hasVnc = !!eq.tailscaleIp

  return (
    <div className={`
      group relative bg-white rounded-2xl border-2 p-4 flex flex-col gap-3 transition-all shadow-sm
      ${hasVnc ? 'border-slate-200 hover:border-brand-400 hover:shadow-md' : 'border-slate-100 opacity-60'}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${hasVnc ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-400'}`}>
            <Monitor size={18} />
          </div>
          <div>
            <p className="font-black text-slate-800 uppercase text-sm leading-tight">{eq.name}</p>
            {eq.room && (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">
                {eq.room}
              </span>
            )}
          </div>
        </div>
        {/* Estado */}
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full shrink-0 ${hasVnc ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
          {hasVnc ? <Wifi size={10} /> : <WifiOff size={10} />}
          {hasVnc ? 'VNC' : 'Sin IP'}
        </div>
      </div>

      {/* IPs */}
      {eq.tailscaleIp && (
        <div className="flex items-center gap-2 bg-neutral-900 rounded-xl px-3 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
          <span className="font-mono text-xs font-bold text-white">{eq.tailscaleIp}</span>
          <span className="text-[10px] text-slate-400 font-bold ml-auto">TAILSCALE</span>
        </div>
      )}
      {eq.ipAddress && (
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          <span className="font-mono text-xs font-bold text-slate-600">{eq.ipAddress}</span>
          <span className="text-[10px] text-slate-400 font-bold ml-auto">LOCAL</span>
        </div>
      )}

      {/* Botón conectar */}
      <button
        onClick={handleConnect}
        disabled={!hasVnc || connecting}
        className={`
          w-full flex items-center justify-center gap-2 h-10 rounded-xl font-black uppercase text-xs tracking-wider transition-all
          ${hasVnc
            ? 'bg-brand-700 hover:bg-brand-800 text-white shadow-md hover:shadow-lg active:scale-95'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }
        `}
      >
        <ExternalLink size={13} />
        {connecting ? 'Conectando...' : hasVnc ? 'Conectar VNC' : 'Sin configurar'}
      </button>
    </div>
  )
}

export default function EscritoriosClient({ branches }: { branches: Branch[] }) {
  const totalPCs   = branches.reduce((acc, b) => acc + b.equipments.length, 0)
  const configured = branches.reduce((acc, b) => acc + b.equipments.filter(e => e.tailscaleIp).length, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black italic uppercase text-slate-900 flex items-center gap-3">
            <Monitor className="text-brand-700" size={32} />
            Escritorios Remotos
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-1">
            {configured} de {totalPCs} PCs configuradas con VNC
          </p>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md">
          <Wifi size={14} className="text-brand-400" />
          Tailscale + TightVNC
        </div>
      </div>

      {/* Sedes */}
      {branches.map(branch => (
        <div key={branch.id} className="space-y-4">
          {/* Nombre de sede */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <h2 className="font-black italic uppercase text-slate-700 text-sm tracking-widest px-3 py-1 bg-slate-900 text-white rounded-full">
              {branch.name}
            </h2>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              {branch.equipments.length} PC{branch.equipments.length !== 1 ? 's' : ''}
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Grid de PCs */}
          {branch.equipments.length === 0 ? (
            <div className="flex items-center justify-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold text-sm italic">No hay PCs registradas en esta sede</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {branch.equipments.map(eq => (
                <PCCard key={eq.id} eq={eq} />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Instrucciones */}
      <div className="bg-neutral-900 rounded-2xl p-4 text-xs text-slate-400 font-bold space-y-1">
        <p>⚠️ Para conectar necesitás tener <span className="text-white">TightVNC Viewer</span> instalado y <span className="text-white">Tailscale activo</span> en esta PC.</p>
        <p>💡 Configurá las IPs Tailscale de cada PC desde <span className="text-brand-400">Admin → Sedes → Computadoras (IT)</span>.</p>
      </div>
    </div>
  )
}
