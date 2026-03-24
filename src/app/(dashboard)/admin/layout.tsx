"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Stethoscope, Building2, ShieldCheck, CreditCard,
  LayoutDashboard, Receipt, ClipboardList, Settings
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
    <div className="flex h-full bg-slate-50 overflow-hidden">

      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className="w-64 bg-neutral-900 text-slate-300 flex flex-col hidden md:flex shrink-0">
        <div className="p-5 border-b border-neutral-800 flex items-center gap-3">
          <img src="/logo.png?v=1" alt="I-R Dental" className="h-6 brightness-0 invert opacity-80" />
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-widest">Panel Admin</h2>
            <p className="text-[9px] uppercase font-bold text-neutral-500 tracking-widest">Configuración</p>
          </div>
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

      {/* CONTENEDOR DERECHO */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ÁREA CENTRAL (SCROLL INDEPENDIENTE) */}
        <main className="flex-1 overflow-y-auto relative bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}