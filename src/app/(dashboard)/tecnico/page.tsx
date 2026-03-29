// src/app/(dashboard)/tecnico/page.tsx
import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/actions/auth"
import { redirect } from "next/navigation"
import TecnicoClient from "./tecnico-client"

export default async function TecnicoPage() {
  const session = await getCurrentSession()
  
  if (!session || (session.role !== 'TECHNICIAN' && session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    redirect('/login')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Traemos las órdenes e incluimos a qué sucursal pertenecen
  const [orders, branches, technicianProfiles] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: today },
        status: { in: ['CREADA', 'EN_ESPERA', 'EN_ATENCION', 'PROCESANDO'] }
      },
      include: {
        patient: true,
        dentist: true,
        branch: true,
        technician: true,
        items: { include: { procedure: true } }
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.branch.findMany({ where: { isActive: true } }),
    prisma.technicianProfile.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ])

  return <TecnicoClient initialOrders={orders} branches={branches} technicianProfiles={technicianProfiles} />
}