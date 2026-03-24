"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Trash2 } from "lucide-react"

interface StepPaymentProps {
  form: any
  procedures: any[]
  editingOrderId: string | null
  yaPagado: number
  saldoDiferencia: number
  remainingBalance: number
  targetAmount: number
  onUpdateItemPrice: (idx: number, field: 'insuranceCoverage' | 'patientCopay', value: number) => void
  onAddPayment: () => void
  onRemovePayment: (idx: number) => void
  onUpdatePayment: (idx: number, field: string, value: any) => void
}

export function StepPayment({
  form,
  procedures,
  editingOrderId,
  yaPagado,
  saldoDiferencia,
  remainingBalance,
  targetAmount,
  onUpdateItemPrice,
  onAddPayment,
  onRemovePayment,
  onUpdatePayment,
}: StepPaymentProps) {
  return (
    <div className="space-y-8 animate-in slide-in-from-right">
      <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 italic">
            <tr>
              <th className="p-4 border-b-2 border-slate-200">Estudio</th>
              <th className="p-4 w-36 text-center border-b-2 border-slate-200">Mutual</th>
              <th className="p-4 w-36 text-center border-b-2 bg-red-50 text-red-800">Paciente</th>
              <th className="p-4 w-28 text-right border-b-2 border-slate-200">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold">
            {form.watch("items").map((item: any, index: number) => {
              const proc = procedures.find((p: any) => p.id === item.procedureId);
              return (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-black uppercase text-slate-800">{proc?.name}</p>
                    {(item.teeth?.length > 0) && <p className="text-[10px] font-bold text-red-600 uppercase italic">Piezas: {item.teeth.join(' - ')}</p>}
                    {(item.locations?.length > 0) && <p className="text-[10px] font-bold text-blue-600 uppercase italic">Pos: {item.locations.join(' - ')}</p>}
                  </td>
                  <td className="p-4">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute left-3 text-slate-400 text-sm">$</span>
                      <Input type="number" className="pl-6 h-9 w-full text-center font-bold text-slate-600 border-2" value={item.insuranceCoverage || 0} onChange={(e) => onUpdateItemPrice(index, 'insuranceCoverage', Number(e.target.value))}/>
                    </div>
                  </td>
                  <td className="p-4 bg-red-50/30">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute left-3 text-red-700 text-sm">$</span>
                      <Input type="number" className="pl-6 h-9 w-full text-center font-black text-red-700 border-2 border-red-200 focus-visible:ring-red-700 bg-white" value={item.patientCopay || 0} onChange={(e) => onUpdateItemPrice(index, 'patientCopay', Number(e.target.value))}/>
                    </div>
                  </td>
                  <td className="p-4 text-right text-lg font-black italic text-slate-900">${(Number(item.insuranceCoverage) || 0) + (Number(item.patientCopay) || 0)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-4">
          <div className="bg-slate-100 p-5 rounded-2xl border-2 border-slate-200 text-center flex flex-col justify-center shadow-inner">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">A Facturar O.S.</p>
            <p className="text-3xl font-black italic text-slate-700">${form.watch("insuranceAmount")}</p>
          </div>

          {editingOrderId && yaPagado > 0 && (
            <div className="bg-emerald-50 p-5 rounded-2xl border-2 border-emerald-200 text-center shadow-md animate-in zoom-in-95 duration-300">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Ya abonado anteriormente</p>
              <p className="text-3xl font-black italic text-emerald-700">-${yaPagado.toLocaleString('es-AR')}</p>
            </div>
          )}

          <div className="bg-slate-900 p-5 rounded-2xl border-t-8 border-red-700 flex flex-col justify-center shadow-xl text-center">
            <p className="text-[11px] font-black text-red-400 uppercase tracking-widest mb-1">{editingOrderId ? "DIFERENCIA A COBRAR" : "A COBRAR AL PACIENTE"}</p>
            <h3 className="text-5xl tracking-tighter text-white uppercase italic leading-none">${editingOrderId ? saldoDiferencia : form.watch("patientAmount")}</h3>
          </div>
        </div>

        <div className="md:col-span-2 bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h4 className="font-black italic uppercase text-slate-800 flex items-center gap-2"><CreditCard size={18} className="text-red-700"/> Medios de Pago</h4>
            {targetAmount > 0 && (
              <Button onClick={onAddPayment} variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase text-blue-600 border-blue-200 hover:bg-blue-50">+ Agregar Pago</Button>
            )}
          </div>

          {targetAmount <= 0 ? (
            <div className="text-center py-8 text-emerald-600 font-black uppercase italic bg-emerald-50 rounded-xl border border-emerald-100">La orden ya está cubierta o posee saldo a favor.</div>
          ) : (
            <div className="space-y-3">
              {form.watch("paymentsList").map((payment: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <Select value={payment.method} onValueChange={(v) => onUpdatePayment(index, 'method', v)}>
                    <SelectTrigger className="h-12 w-full font-black uppercase italic bg-slate-50 border-2"><SelectValue /></SelectTrigger>
                    <SelectContent className="font-black uppercase italic">
                      <SelectItem value="EFECTIVO">💵 EFECTIVO</SelectItem>
                      <SelectItem value="MERCADOPAGO">📱 MERCADOPAGO</SelectItem>
                      <SelectItem value="TARJETA_DEBITO">💳 DÉBITO</SelectItem>
                      <SelectItem value="TARJETA_CREDITO">💳 CRÉDITO</SelectItem>
                      <SelectItem value="TRANSFERENCIA">🏛️ TRANSFERENCIA</SelectItem>
                      <SelectItem value="SALDO" className="font-black text-red-600 uppercase">⏳ Deuda / Saldo Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative w-48 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <Input type="number" className="pl-8 h-12 font-black text-lg border-2" value={payment.amount} onChange={(e) => onUpdatePayment(index, 'amount', Number(e.target.value))} />
                  </div>
                  {form.watch("paymentsList").length > 1 && (
                    <Button variant="ghost" onClick={() => onRemovePayment(index)} className="text-slate-400 hover:text-red-600 shrink-0"><Trash2 size={18}/></Button>
                  )}
                </div>
              ))}
              <div className={`mt-4 p-3 rounded-xl flex justify-between items-center font-black uppercase italic transition-colors ${remainingBalance === 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <span className="text-xs">{remainingBalance === 0 ? '✓ Pagos cuadrados' : '⚠️ Saldo pendiente'}</span>
                <span className="text-xl">${Math.abs(remainingBalance)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
