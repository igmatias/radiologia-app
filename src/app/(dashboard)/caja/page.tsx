import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/actions/auth"
import { redirect } from "next/navigation"
import CajaClient from "./caja-client"

export default async function CajaPage() {
  const session = await getCurrentSession()
  if (!session) redirect('/login')
  if (session.role === 'TECHNICIAN') redirect('/tecnico')

  const branches = await prisma.branch.findMany({ where: { isActive: true } });
  return <CajaClient branches={branches} />
}
