"use client"

import { useState } from "react"
import { Building2, TrendingUp, TrendingDown, DollarSign, Download, Search, ChevronDown, ChevronUp } from "lucide-react"
import { getCashConsolidated } from "@/actions/cash"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const METHOD_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo', TARJETA_DEBITO: 'Débito', TARJETA_CREDITO: 'Crédito',
  TRANSFERENCIA: 'Transferencia', MERCADOPAGO: 'MercadoPago',
  CUENTA_CORRIENTE: 'Cta. Cte.', OTRO: 'Otro', SALDO: 'Saldo',
}
const MOVEMENT_LABELS: Record<string, string> = {
  GASTO: 'Gasto', RETIRO: 'Retiro', INGRESO_EXTRA: 'Ingreso extra',
  A_CAJA_FUERTE: 'A caja fuerte', RETIRO_DUENO: 'Retiro dueño',
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

type BranchData = {
  branch: { id: string; name: string; code: string }
  payments: { id: string; amount: number; method: string; createdAt: string; order: { code: string | null; patient: { firstName: string | null; lastName: string | null } | null } | null }[]
  movements: { id: string; amount: number; type: string; method: string; description: string; createdAt: string }[]
  totalIngresos: number
  totalEgresos: number
  totalIngresosExtra: number
  balance: number
  byMethod: Record<string, number>
}

function exportToExcel(data: BranchData[], dateStr: string) {
  const rows: string[] = []
  rows.push(`<html><head><meta charset="UTF-8"></head><body>`)
  rows.push(`<h2>Caja Consolidada — ${dateStr}</h2>`)

  // Summary table
  rows.push(`<h3>Resumen por Sucursal</h3>`)
  rows.push(`<table border="1" cellpadding="4" style="border-collapse:collapse">`)
  rows.push(`<tr style="background:#1e293b;color:white"><th>Sucursal</th><th>Ingresos</th><th>Ingresos Extra</th><th>Egresos</th><th>Balance</th>${Object.keys(METHOD_LABELS).filter(m => m !== 'SALDO' && m !== 'CUENTA_CORRIENTE').map(m => `<th>${METHOD_LABELS[m]}</th>`).join('')}</tr>`)
  for (const d of data) {
    rows.push(`<tr><td><b>${d.branch.name}</b></td><td>${fmt(d.totalIngresos)}</td><td>${fmt(d.totalIngresosExtra)}</td><td>${fmt(d.totalEgresos)}</td><td><b>${fmt(d.balance)}</b></td>${Object.keys(METHOD_LABELS).filter(m => m !== 'SALDO' && m !== 'CUENTA_CORRIENTE').map(m => `<td>${fmt(d.byMethod[m] ?? 0)}</td>`).join('')}</tr>`)
  }
  const totals = data.reduce((acc, d) => ({
    ingresos: acc.ingresos + d.totalIngresos,
    extra: acc.extra + d.totalIngresosExtra,
    egresos: acc.egresos + d.totalEgresos,
    balance: acc.balance + d.balance,
  }), { ingresos: 0, extra: 0, egresos: 0, balance: 0 })
  rows.push(`<tr style="background:#f1f5f9;font-weight:bold"><td>TOTAL</td><td>${fmt(totals.ingresos)}</td><td>${fmt(totals.extra)}</td><td>${fmt(totals.egresos)}</td><td>${fmt(totals.balance)}</td>${Object.keys(METHOD_LABELS).filter(m => m !== 'SALDO' && m !== 'CUENTA_CORRIENTE').map(() => '<td></td>').join('')}</tr>`)
  rows.push(`</table><br/>`)

  // Payments detail
  rows.push(`<h3>Detalle de Pagos</h3>`)
  rows.push(`<table border="1" cellpadding="4" style="border-collapse:collapse">`)
  rows.push(`<tr style="background:#1e293b;color:white"><th>Sucursal</th><th>Hora</th><th>Orden</th><th>Paciente</th><th>Método</th><th>Importe</th></tr>`)
  for (const d of data) {
    for (const p of d.payments) {
      if (p.method === 'SALDO' || p.method === 'CUENTA_CORRIENTE') continue
      rows.push(`<tr><td>${d.branch.name}</td><td>${new Date(p.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td><td>${p.order?.code ?? '-'}</td><td>${p.order?.patient ? `${p.order.patient.lastName}, ${p.order.patient.firstName}` : '-'}</td><td>${METHOD_LABELS[p.method] ?? p.method}</td><td>${fmt(Number(p.amount))}</td></tr>`)
    }
  }
  rows.push(`</table><br/>`)

  // Movements detail
  rows.push(`<h3>Movimientos de Caja</h3>`)
  rows.push(`<table border="1" cellpadding="4" style="border-collapse:collapse">`)
  rows.push(`<tr style="background:#1e293b;color:white"><th>Sucursal</th><th>Hora</th><th>Tipo</th><th>Descripción</th><th>Método</th><th>Importe</th></tr>`)
  for (const d of data) {
    for (const m of d.movements) {
      rows.push(`<tr><td>${d.branch.name}</td><td>${new Date(m.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td><td>${MOVEMENT_LABELS[m.type] ?? m.type}</td><td>${m.description}</td><td>${METHOD_LABELS[m.method] ?? m.method}</td><td>${fmt(Number(m.amount))}</td></tr>`)
    }
  }
  rows.push(`</table></body></html>`)

  const blob = new Blob([rows.join('\n')], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `Caja_Consolidada_${dateStr}.xls`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function CajaConsolidadaClient() {
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local
  const [date, setDate] = useState(today)
  const [data, setData] = useState<BranchData[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const handleSearch = async () => {
    setLoading(true)
    const res = await getCashConsolidated(date)
    if (res.success) setData(res.data as unknown as BranchData[])
    setLoading(false)
  }

  const totals = data ? data.reduce((acc, d) => ({
    ingresos: acc.ingresos + d.totalIngresos,
    extra: acc.extra + d.totalIngresosExtra,
    egresos: acc.egresos + d.totalEgresos,
    balance: acc.balance + d.balance,
  }), { ingresos: 0, extra: 0, egresos: 0, balance: 0 }) : null

  const allMethods = data
    ? [...new Set(data.flatMap(d => Object.keys(d.byMethod)))]
    : []

  return (
    <div className="min-h-full bg-slate-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <DollarSign size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase text-slate-900 tracking-tight leading-none">Caja Consolidada</h1>
            <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">Resumen de todas las sucursales</p>
          </div>
        </div>
        {data && data.length > 0 && (
          <Button onClick={() => exportToExcel(data, date)} variant="outline"
            className="flex items-center gap-2 border-2 font-black uppercase text-xs">
            <Download size={14} /> Exportar Excel
          </Button>
        )}
      </div>

      {/* Date picker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-400">Fecha</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="h-11 font-bold border-2 w-48" />
        </div>
        <Button onClick={handleSearch} disabled={loading}
          className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase">
          <Search size={14} className="mr-2" />{loading ? 'Cargando...' : 'Consultar'}
        </Button>
      </div>

      {data && (
        <>
          {/* Totals row */}
          {totals && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Ingresos', value: fmt(totals.ingresos), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Ingresos Extra', value: fmt(totals.extra), icon: TrendingUp, color: 'text-sky-600', bg: 'bg-sky-50' },
                { label: 'Total Egresos', value: fmt(totals.egresos), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
                { label: 'Balance Total', value: fmt(totals.balance), icon: DollarSign, color: totals.balance >= 0 ? 'text-emerald-700' : 'text-red-600', bg: totals.balance >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                    <s.icon size={18} className={s.color} />
                  </div>
                  <div>
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Per-branch table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">Sucursal</th>
                    <th className="text-right px-4 py-3 font-black uppercase text-[10px] tracking-wider">Ingresos</th>
                    {allMethods.map(m => (
                      <th key={m} className="text-right px-3 py-3 font-black uppercase text-[10px] tracking-wider">{METHOD_LABELS[m] ?? m}</th>
                    ))}
                    <th className="text-right px-4 py-3 font-black uppercase text-[10px] tracking-wider">Egresos</th>
                    <th className="text-right px-4 py-3 font-black uppercase text-[10px] tracking-wider">Balance</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map(d => (
                    <>
                      <tr key={d.branch.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 size={13} className="text-slate-400 shrink-0" />
                            <span className="font-black text-slate-900 uppercase">{d.branch.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5 pl-5">
                            {d.payments.length} pago{d.payments.length !== 1 ? 's' : ''} · {d.movements.length} movimiento{d.movements.length !== 1 ? 's' : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-emerald-700">{fmt(d.totalIngresos)}</td>
                        {allMethods.map(m => (
                          <td key={m} className="px-3 py-3 text-right font-bold text-slate-600">
                            {d.byMethod[m] ? fmt(d.byMethod[m]) : <span className="text-slate-200">—</span>}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right font-black text-red-500">{fmt(d.totalEgresos)}</td>
                        <td className={`px-4 py-3 text-right font-black text-lg ${d.balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {fmt(d.balance)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpanded(prev => ({ ...prev, [d.branch.id]: !prev[d.branch.id] }))}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            {expanded[d.branch.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded detail */}
                      {expanded[d.branch.id] && (
                        <tr key={`${d.branch.id}-detail`}>
                          <td colSpan={4 + allMethods.length + 2} className="px-6 py-4 bg-slate-50">
                            <div className="grid md:grid-cols-2 gap-4">
                              {/* Pagos */}
                              <div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Pagos recibidos</p>
                                {d.payments.length === 0 ? (
                                  <p className="text-xs text-slate-400 font-bold">Sin pagos</p>
                                ) : (
                                  <div className="space-y-1">
                                    {d.payments.map(p => (
                                      <div key={p.id} className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-700 truncate max-w-[160px]">
                                          {p.order?.patient ? `${p.order.patient.lastName}, ${p.order.patient.firstName}` : '—'}
                                          {p.order?.code && <span className="text-slate-400 ml-1">#{p.order.code}</span>}
                                        </span>
                                        <span className="flex items-center gap-2 shrink-0">
                                          <span className="text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase">{METHOD_LABELS[p.method] ?? p.method}</span>
                                          <span className="font-black text-emerald-700">{fmt(Number(p.amount))}</span>
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {/* Movimientos */}
                              <div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Movimientos</p>
                                {d.movements.length === 0 ? (
                                  <p className="text-xs text-slate-400 font-bold">Sin movimientos</p>
                                ) : (
                                  <div className="space-y-1">
                                    {d.movements.map(m => (
                                      <div key={m.id} className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-700 truncate max-w-[160px]">
                                          {m.description}
                                          <span className="text-slate-400 ml-1 text-[9px]">({MOVEMENT_LABELS[m.type] ?? m.type})</span>
                                        </span>
                                        <span className={`font-black shrink-0 ${m.type === 'INGRESO_EXTRA' ? 'text-sky-600' : 'text-red-500'}`}>
                                          {m.type === 'INGRESO_EXTRA' ? '+' : '-'}{fmt(Number(m.amount))}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}

                  {/* Totals */}
                  {totals && (
                    <tr className="bg-slate-900 text-white">
                      <td className="px-4 py-3 font-black uppercase text-[11px]">TOTAL GENERAL</td>
                      <td className="px-4 py-3 text-right font-black">{fmt(totals.ingresos)}</td>
                      {allMethods.map(m => (
                        <td key={m} className="px-3 py-3 text-right font-black">
                          {fmt(data.reduce((acc, d) => acc + (d.byMethod[m] ?? 0), 0))}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right font-black">{fmt(totals.egresos)}</td>
                      <td className={`px-4 py-3 text-right font-black text-lg ${totals.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(totals.balance)}</td>
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {data.every(d => d.payments.length === 0 && d.movements.length === 0) && (
            <div className="bg-white rounded-2xl border border-slate-200 py-14 text-center">
              <DollarSign size={36} className="mx-auto text-slate-200 mb-3" />
              <p className="font-black uppercase text-slate-400 text-sm">Sin movimientos en esta fecha</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
