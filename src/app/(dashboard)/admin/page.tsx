import { prisma } from "@/lib/prisma"
import AdminClient from "./admin-client"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { getAllSystemSettings } from "@/actions/settings"

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== "SUPERADMIN") redirect("/admin/reportes")

  const [branches, settings] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true } }),
    getAllSystemSettings()
  ])
  return <AdminClient branches={branches} settings={settings} />
}