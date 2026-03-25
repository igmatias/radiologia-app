import Link from "next/link"
import { Monitor, Activity, Send, Settings } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* HEADER SUPERIOR GLOBAL */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex items-center justify-between shrink-0 shadow-lg z-50">
        {/* Logo + branding */}
        <div className="flex items-center gap-3">
          <img src="/logo.png?v=1" alt="I-R Dental" className="h-8" />
          <div className="hidden sm:block h-5 w-px bg-neutral-700" />
          <span className="hidden sm:block text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Sistema de Gestión</span>
        </div>

        {/* Navegación */}
        <nav className="flex items-center gap-1">
          <Link href="/recepcion">
            <span className="flex items-center gap-1.5 px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer">
              <Monitor size={13} /> Recepción
            </span>
          </Link>
          <Link href="/tecnico">
            <span className="flex items-center gap-1.5 px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer">
              <Activity size={13} /> Técnico
            </span>
          </Link>
          <Link href="/entregas">
            <span className="flex items-center gap-1.5 px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer">
              <Send size={13} /> Entregas
            </span>
          </Link>
          <Link href="/admin">
            <span className="flex items-center gap-1.5 px-3 py-2 ml-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer shadow-md">
              <Settings size={13} /> Admin
            </span>
          </Link>
        </nav>
      </header>

      {/* Contenido principal con scroll habilitado */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
