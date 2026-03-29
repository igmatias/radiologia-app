import { prisma } from "@/lib/prisma"
import AdminClient from "./admin-client"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== "SUPERADMIN") redirect("/admin/reportes")

  const branches = await prisma.branch.findMany({ where: { isActive: true } });
  return <AdminClient branches={branches} />
}