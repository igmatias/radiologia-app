"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Users, Stethoscope, Building2, ShieldCheck, CreditCard, 
  LayoutDashboard, Receipt, ClipboardList, Monitor, Activity, Send, Settings 
} from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const menuItems = [
    { name: "Resumen", icon: LayoutDashboard, href: "/admin" },
    { name: "Facturación", icon: Receipt, href: "/admin/reportes" }, 
    { name: "Prácticas", icon: ClipboardList, href: "/admin/estudios" },
    { name: "Usuarios", icon: ShieldCheck, href: "/admin/usuarios" },
    { name: "Odontólogos", icon: Stethoscope, href: "/admin/dentistas" },
    { name: "Obras Sociales", icon: CreditCard, href: "/admin/obras-sociales" },
    { name: "Sedes", icon: Building2, href: "/admin/sedes" },
  ]

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Panel Admin</h2>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Quilmes Radiología</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/admin');
            
            return (
              <Link key={item.name} href={item.href}>
                <span className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase text-sm transition-all ${isActive ? 'bg-red-700 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
                  <item.icon size={18} />
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* CONTENEDOR DERECHO (HEADER FIJO + CONTENIDO SCROLLEABLE) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* 🔥 BARRA SUPERIOR DE ACCESOS RÁPIDOS (SIEMPRE VISIBLE) */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap justify-between items-center shrink-0 shadow-sm z-10 gap-4">
          <div className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex-1">
             Módulos Globales
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
            <Link href="/admin">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-black uppercase text-[10px] hover:bg-slate-800 transition-colors shrink-0 shadow-sm">
                <Settings size={14} /> Admin
              </button>
            </Link>
            <Link href="/recepcion">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border-2 border-slate-200 rounded-lg font-black uppercase text-[10px] hover:bg-slate-50 transition-colors shrink-0 shadow-sm">
                <Monitor size={14} /> Recepción
              </button>
            </Link>
            <Link href="/tecnico">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border-2 border-slate-200 rounded-lg font-black uppercase text-[10px] hover:bg-slate-50 transition-colors shrink-0 shadow-sm">
                <Activity size={14} /> Técnico
              </button>
            </Link>
            <Link href="/entregas">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border-2 border-slate-200 rounded-lg font-black uppercase text-[10px] hover:bg-slate-50 transition-colors shrink-0 shadow-sm">
                <Send size={14} /> Entregas
              </button>
            </Link>
          </div>
        </header>

        {/* ÁREA CENTRAL DE LAS PESTAÑAS (SCROLL INDEPENDIENTE) */}
        <main className="flex-1 overflow-y-auto relative bg-slate-50">
          {children}
        </main>
        
      </div>
    </div>
  )
}