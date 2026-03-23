"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ClipboardList, UserPlus, Activity } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/ordenes",
      label: "Lista de Espera",
      icon: ClipboardList,
      active: pathname === "/ordenes",
    },
    {
      href: "/recepcion",
      label: "Nueva Orden",
      icon: UserPlus,
      active: pathname === "/recepcion",
    },
  ]

  return (
    <nav className="flex flex-col space-y-2 p-4 w-64 border-r h-screen bg-slate-50">
      <div className="flex items-center gap-2 px-2 mb-8">
        <Activity className="h-6 w-6 text-blue-600" />
        <span className="font-bold text-xl">Radiología App</span>
      </div>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            route.active 
              ? "bg-blue-100 text-blue-700" 
              : "text-slate-600 hover:bg-slate-200"
          )}
        >
          <route.icon className="h-4 w-4" />
          {route.label}
        </Link>
      ))}
    </nav>
  )
}