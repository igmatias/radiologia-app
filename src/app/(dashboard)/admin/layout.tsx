"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Building2, ShieldCheck, CreditCard,
  LayoutDashboard, Receipt, ClipboardList, LogOut, ClipboardCheck, History, WifiOff, Users, Landmark, ScanLine
} from "lucide-react"
import ToothIcon from "@/components/icons/tooth-icon"
import { logoutUser, getCurrentSession } from "@/actions/auth"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    getCurrentSession().then(s => setUserRole(s?.role ?? null))
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    router.push("/login")
  }

  const allMenuItems = [
    { name: "Resumen",       icon: LayoutDashboard, href: "/admin",               superAdminOnly: true },
    { name: "Órdenes",        icon: ClipboardCheck,  href: "/admin/ordenes" },
    { name: "Pacientes",      icon: Users,           href: "/admin/pacientes" },
    { name: "Facturación",   icon: Receipt,         href: "/admin/reportes" },
    { name: "Caja Global",   icon: Landmark,        href: "/admin/caja-consolidada" },
    { name: "Prácticas",     icon: ClipboardList,   href: "/admin/estudios" },
    { name: "Usuarios",      icon: ShieldCheck,     href: "/admin/usuarios",       superAdminOnly: true },
    { name: "Odontólogos",   icon: ToothIcon,       href: "/admin/dentistas" },
    { name: "Obras Sociales",icon: CreditCard,      href: "/admin/obras-sociales" },
    { name: "Auditoría",     icon: History,         href: "/admin/auditoria" },
    { name: "Sedes",         icon: Building2,       href: "/admin/sedes",          superAdminOnly: true },
    { name: "Modo Emergencia", icon: WifiOff,       href: "/admin/importar-offline" },
    { name: "Template TC3D",   icon: ScanLine,      href: "/admin/tomografia-template" },
  ]

  const menuItems = allMenuItems.filter(item =>
    !item.superAdminOnly || userRole === "SUPERADMIN"
  )

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">

      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className="w-64 bg-neutral-900 text-slate-300 flex flex-col hidden md:flex shrink-0">
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center shrink-0 shadow-lg shadow-brand-900/40">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] leading-none mb-0.5">Módulo</p>
            <h2 className="text-sm font-black text-white uppercase tracking-tight leading-none">Panel Admin</h2>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item: any) => {
            const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/admin');
            
            return (
              <Link key={item.name} href={item.href}>
                <span className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase text-sm transition-all ${isActive ? 'bg-brand-700 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
                  <item.icon size={18} />
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Footer del sidebar - Logout */}
        <div className="p-4 border-t border-neutral-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase text-sm text-slate-400 hover:bg-brand-900/50 hover:text-brand-400 transition-all"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
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