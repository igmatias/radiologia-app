import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import CajaConsolidadaClient from "./caja-consolidada-client"

export const dynamic = 'force-dynamic'

export default async function CajaConsolidadaPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN') redirect('/recepcion')
  return <CajaConsolidadaClient />
}
