import { prisma } from "@/lib/prisma"
import EntregasClient from "./entregas-client"

export default async function EntregasPage() {
  const branches = await prisma.branch.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      <EntregasClient branches={branches} />
    </div>
  )
}