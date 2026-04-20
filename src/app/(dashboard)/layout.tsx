import Link from "next/link"
import { Monitor, Send, Settings, AlertTriangle } from "lucide-react"
import RadiationIcon from "@/components/icons/radiation-icon"
import { isMaintenanceModeEnabled } from "@/actions/settings"
import { prisma } from "@/lib/prisma"
import ChatNavItem from "@/components/chat-nav-item"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [maintenance, lastMessage] = await Promise.all([
    isMaintenanceModeEnabled(),
    prisma.chatMessage.findFirst({ orderBy: { createdAt: 'desc' }, select: { id: true } }),
  ])

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50">
      {/* HEADER SUPERIOR GLOBAL */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-3 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-lg z-50">
        {/* Logo + branding */}
        <div className="flex items-center gap-3 shrink-0">
          <img src="/logo.png?v=1" alt="I-R Dental" className="h-7 sm:h-8" />
          <div className="hidden sm:block h-5 w-px bg-neutral-700" />
          <span className="hidden sm:block text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Sistema de Gestión</span>
        </div>

        {/* Navegación — solo íconos en mobile, ícono+texto en sm+ */}
        <nav className="flex items-center gap-0.5 sm:gap-1">
          <Link href="/recepcion">
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer">
              <Monitor size={14} /> <span className="hidden sm:inline">Recepción</span>
            </span>
          </Link>
          <Link href="/tecnico">
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer">
              <RadiationIcon size={14} /> <span className="hidden sm:inline">Técnico</span>
            </span>
          </Link>
          <Link href="/entregas">
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer">
              <Send size={14} /> <span className="hidden sm:inline">Entregas</span>
            </span>
          </Link>
          <ChatNavItem lastMessageId={lastMessage?.id ?? null} />
          <Link href="/admin">
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 ml-0.5 sm:ml-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer shadow-md">
              <Settings size={14} /> <span className="hidden sm:inline">Admin</span>
            </span>
          </Link>
        </nav>
      </header>

      {/* Banner de mantenimiento */}
      {maintenance && (
        <div className="bg-amber-400 text-amber-950 px-4 py-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider shrink-0">
          <AlertTriangle size={13} />
          Modo mantenimiento activo — el sistema puede presentar interrupciones temporales
          <AlertTriangle size={13} />
        </div>
      )}

      {/* Contenido principal con scroll habilitado */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
