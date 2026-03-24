"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LogOut, Building2 } from "lucide-react"

function StatCard({ title, value }: any) {
  return (
    <Card className="border-none shadow-md bg-white/60 backdrop-blur-md rounded-2xl h-full">
      <CardContent className="p-6"><p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1 italic">{title}</p><p className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase truncate">{value}</p></CardContent>
    </Card>
  )
}

interface OrderHeaderProps {
  orderNumber: string | null
  editingOrderId: string | null
  saldoDiferencia: number
  patientAmount: number
  session: { branchId: string; userName: string } | null
  branches: any[]
  onLogout: () => void
  onChangeBranch: () => void
}

export function OrderHeader({
  orderNumber,
  editingOrderId,
  saldoDiferencia,
  patientAmount,
  session,
  branches,
  onLogout,
  onChangeBranch,
}: OrderHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in">
      <StatCard title="N° ORDEN" value={orderNumber || "---"} />
      <Card className="border-none shadow-md bg-white/60 backdrop-blur-md rounded-2xl h-full border-l-4 border-l-red-700 relative">
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1 italic">
              {editingOrderId ? "DIFERENCIA A COBRAR" : "A COBRAR EN CAJA"}
            </p>
            <p className={`text-3xl font-black italic uppercase ${editingOrderId && saldoDiferencia <= 0 ? 'text-emerald-600' : 'text-red-700'}`}>
              ${editingOrderId ? saldoDiferencia : patientAmount}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-none shadow-md bg-white/60 backdrop-blur-md rounded-2xl relative group">
        <CardContent className="p-6 flex justify-between items-start">
          <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1 italic">OPERADOR</p><p className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase truncate pr-1">{session?.userName?.split(' ')[0] || "OPERADOR"}</p></div>
          <button onClick={onLogout} className="bg-red-100 text-red-700 p-2 rounded-xl hover:bg-red-200 shrink-0"><LogOut size={16} /></button>
        </CardContent>
      </Card>
      <Card className="border-none shadow-md bg-white/60 backdrop-blur-md rounded-2xl relative group">
        <CardContent className="p-6 flex justify-between items-start">
          <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1 italic">SEDE</p><p className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase truncate pr-2">{branches.find((b: any) => b.id === session?.branchId)?.name || "---"}</p></div>
          <button onClick={onChangeBranch} className="bg-slate-200 text-slate-700 p-2 rounded-xl hover:bg-slate-300 transition-colors shrink-0"><Building2 size={16} /></button>
        </CardContent>
      </Card>
    </div>
  )
}
