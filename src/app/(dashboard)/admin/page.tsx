import { prisma } from "@/lib/prisma"
import AdminClient from "./admin-client"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { isAiAnalysisEnabled } from "@/actions/settings"

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== "SUPERADMIN") redirect("/admin/reportes")

  const branches = await prisma.branch.findMany({ where: { isActive: true } });
  const aiEnabled = await isAiAnalysisEnabled()
  return <AdminClient branches={branches} aiEnabled={aiEnabled} />
}