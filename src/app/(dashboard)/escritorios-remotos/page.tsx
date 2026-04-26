import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/actions/auth"
import { redirect } from "next/navigation"
import EscritoriosClient from "./escritorios-client"

export default async function EscritoriosRemotosPage() {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    redirect('/')
  }

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      equipments: {
        where: { isActive: true, type: 'PC' },
        orderBy: { room: 'asc' },
      },
    },
  })

  return <EscritoriosClient branches={branches} />
}
