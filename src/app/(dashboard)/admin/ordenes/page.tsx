import { prisma } from "@/lib/prisma"
import OrdenesAdminClient from "./ordenes-admin-client"

export default async function OrdenesAdminPage() {
  const [branches, procedures, obrasSociales, dentists] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.procedure.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.obraSocial.findMany({ orderBy: { name: 'asc' } }),
    prisma.dentist.findMany({ where: { isActive: true }, orderBy: { lastName: 'asc' }, select: { id: true, firstName: true, lastName: true, matriculaProv: true } }),
  ])

  return <OrdenesAdminClient branches={branches} procedures={procedures} obrasSociales={obrasSociales} dentists={dentists} />
}
