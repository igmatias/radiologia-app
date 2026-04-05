import { prisma } from "@/lib/prisma"
import OrdenesAdminClient from "./ordenes-admin-client"
import { getCurrentSession } from "@/actions/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function OrdenesAdminPage() {
  // Fix — verificar sesion y rol antes de consultar la DB
  const session = await getCurrentSession()
  if (!session) redirect('/login')
  if (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN') redirect('/recepcion')
  const [branches, procedures, obrasSociales, dentists] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.procedure.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.obraSocial.findMany({ orderBy: { name: 'asc' }, include: { variants: { orderBy: { name: 'asc' } } } }),
    prisma.dentist.findMany({ where: { isActive: true }, orderBy: { lastName: 'asc' }, select: { id: true, firstName: true, lastName: true, matriculaProv: true } }),
  ])

  return <OrdenesAdminClient branches={branches} procedures={procedures} obrasSociales={obrasSociales} dentists={dentists} />
}
