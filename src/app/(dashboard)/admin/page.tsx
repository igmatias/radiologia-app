import { prisma } from "@/lib/prisma"
import AdminClient from "./admin-client"

export default async function AdminPage() {
  // Traemos las sedes para armar los filtros
  const branches = await prisma.branch.findMany({ where: { isActive: true } });
  
  return <AdminClient branches={branches} />
}