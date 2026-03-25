"use client"

import { LogOut, Building2, Hash, Banknote, User } from "lucide-react"

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
  const amount = editingOrderId ? saldoDiferencia : patientAmount
  const amountLabel = editingOrderId ? "DIFERENCIA" : "A COBRAR"
  const amountColor = editingOrderId && saldoDiferencia <= 0 ? "text-emerald-600" : "text-red-600"
  const branchName = branches.find((b: any) => b.id === session?.branchId)?.name || "---"
  const operatorName = session?.userName?.split(' ')[0] || "OPERADOR"

  return (
    <div className="flex items-stretch bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4 hide-on-print">

      {/* N° Orden */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-r border-slate-100">
        <Hash size={14} className="text-slate-400 shrink-0" />
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">N° Orden</p>
          <p className="text-base font-black text-slate-900 leading-none">{orderNumber || "---"}</p>
        </div>
      </div>

      {/* A Cobrar */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-r border-slate-100 flex-1">
        <Banknote size={14} className={`${amountColor} shrink-0`} />
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">{amountLabel}</p>
          <p className={`text-base font-black leading-none ${amountColor}`}>${amount.toLocaleString('es-AR')}</p>
        </div>
      </div>

      {/* Operador */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-r border-slate-100">
        <User size={14} className="text-slate-400 shrink-0" />
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Operador</p>
          <p className="text-base font-black text-slate-900 leading-none uppercase">{operatorName}</p>
        </div>
        <button
          onClick={onLogout}
          title="Cerrar sesión"
          className="ml-2 text-slate-300 hover:text-red-500 transition-colors"
        >
          <LogOut size={14} />
        </button>
      </div>

      {/* Sede */}
      <div className="flex items-center gap-2.5 px-5 py-3">
        <Building2 size={14} className="text-slate-400 shrink-0" />
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Sede</p>
          <p className="text-base font-black text-slate-900 leading-none uppercase">{branchName}</p>
        </div>
        <button
          onClick={onChangeBranch}
          title="Cambiar sede"
          className="ml-2 text-slate-300 hover:text-slate-600 transition-colors"
        >
          <Building2 size={14} />
        </button>
      </div>
    </div>
  )
}
