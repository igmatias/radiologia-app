"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAuditLog } from "@/actions/orders"
import { toast } from "sonner"
import {
  Search, History, FileText, Edit2, XCircle, RefreshCw,
  CheckCircle2, ClipboardCheck, ArrowRight
} from "lucide-react"

const ACTION_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  ORDEN_CREADA: { label: "Orden Creada", color: "bg-blue-100 text-blue-800 border-blue-200", icon: FileText },
  ORDEN_EDITADA: { label: "Orden Editada", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Edit2 },
  ORDEN_EDITADA_ADMIN: { label: "Editada (Admin)", color: "bg-orange-100 text-orange-800 border-orange-200", icon: Edit2 },
  ORDEN_ANULADA: { label: "Orden Anulada", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
  ORDEN_REACTIVADA: { label: "Orden Reactivada", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: RefreshCw },
  CAMBIO_ESTADO: { label: "Cambio de Estado", color: "bg-purple-100 text-purple-800 border-purple-200", icon: ArrowRight },
  RECETA_VERIFICADA: { label: "Receta Controlada", color: "bg-teal-100 text-teal-800 border-teal-200", icon: ClipboardCheck },
}

export default function AuditoriaClient() {
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0] })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState("")
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    const res = await getAuditLog(startDate, endDate, search || undefined)
    if (res.success) { setLogs(res.logs); setSearched(true) }
    else toast.error("Error al buscar logs")
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Filtros */}
      <Card className="border-none shadow-md rounded-2xl bg-white border-t-8 border-slate-900">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">Buscar (nº orden, paciente, acción)</Label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Ej: PEREZ, Q-2026-000001..."
                  className="pl-9 h-11 font-bold border-2"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">Desde</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-11 font-bold border-2" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">Hasta</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-11 font-bold border-2" />
            </div>
          </div>
          <Button onClick={handleSearch} disabled={loading} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase rounded-xl mt-4">
            <Search size={16} className="mr-2" /> {loading ? "Buscando..." : "Buscar Registros"}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {searched && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase text-slate-500 px-1">{logs.length} registro{logs.length !== 1 ? 's' : ''}</p>

          {logs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <History size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="font-black uppercase text-slate-400">Sin registros para el período seleccionado</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-900 text-white">
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">Fecha / Hora</th>
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">Acción</th>
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">Nº Orden</th>
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">Paciente</th>
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log: any) => {
                      const config = ACTION_CONFIG[log.action] || { label: log.action, color: "bg-slate-100 text-slate-700 border-slate-200", icon: History };
                      const Icon = config.icon;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="font-bold text-slate-800">{new Date(log.createdAt).toLocaleDateString('es-AR')}</p>
                            <p className="text-[10px] font-bold text-slate-400">{new Date(log.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${config.color}`}>
                              <Icon size={12} /> {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-black text-slate-800">{log.order?.code || '—'}</td>
                          <td className="px-4 py-3 font-bold text-slate-700 uppercase whitespace-nowrap">
                            {log.order?.patient ? `${log.order.patient.lastName}, ${log.order.patient.firstName}` : '—'}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-500 max-w-[300px] truncate" title={log.details || ''}>
                            {log.details || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
