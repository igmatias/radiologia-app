"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, LayoutGrid, Printer, Edit, Trash2, RefreshCw, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { toggleOrderActivation } from "@/actions/orders"

interface OrderListViewProps {
  dailyOrders: any[]
  orderSearch: string
  setOrderSearch: (v: string) => void
  onRefresh: () => void
  onEdit: (order: any) => void
  onReprint: (order: any) => void
}

export function OrderListView({ dailyOrders, orderSearch, setOrderSearch, onRefresh, onEdit, onReprint }: OrderListViewProps) {
  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-4">
      <Card className="border-none shadow-xl rounded-[2.5rem] bg-white border-t-8 border-slate-900 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
          <div>
            <h3 className="text-3xl font-black uppercase italic text-slate-900 flex items-center gap-3">
              <LayoutGrid className="text-red-700" size={32}/> Órdenes de Hoy
            </h3>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input placeholder="BUSCAR..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="pl-10 h-12 text-xs font-bold border-2 rounded-xl uppercase" />
            </div>
            <Button onClick={onRefresh} variant="outline" className="border-2 rounded-xl font-black text-[10px] h-12">Actualizar</Button>
          </div>
        </div>

        <div className="space-y-4">
          {dailyOrders
            .filter((o: any) => {
              const term = orderSearch.toLowerCase();
              if (!term) return true;
              return o.patient?.lastName?.toLowerCase().includes(term) ||
                     o.patient?.dni?.includes(term) ||
                     (o.code && o.code.toLowerCase().includes(term));
            })
            .map((orden: any) => {
              const isAnulada = orden.status === 'ANULADA';

              return (
                <div
                  key={orden.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between md:items-center gap-6 group
                    ${isAnulada
                      ? 'bg-slate-50 border-slate-200 opacity-70 grayscale'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-400 shadow-sm'
                    }`}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`${isAnulada ? 'bg-slate-400' : 'bg-red-700'} text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest`}>
                        Nº {orden.code || orden.dailyId}
                      </span>

                      {isAnulada && (
                        <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-sm italic flex items-center gap-1 animate-pulse">
                          <AlertTriangle size={10} /> ANULADA
                        </span>
                      )}

                      <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(orden.createdAt).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}hs</span>
                    </div>
                    <p className={`text-xl font-black uppercase leading-tight mb-1 ${isAnulada ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {orden.patient?.lastName}, {orden.patient?.firstName}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{orden.items.length} Estudio(s) • {orden.dentist ? `Dr. ${orden.dentist.lastName}` : "Particular"}</p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 items-center">
                    {!isAnulada && (
                      <div className="text-right mr-4 hidden md:block">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Abonado</p>
                        <p className="text-2xl font-black italic text-emerald-600 leading-none">${(orden.patientAmount || 0).toLocaleString()}</p>
                      </div>
                    )}

                    {!isAnulada ? (
                      <>
                        <Button onClick={() => onReprint(orden)} variant="outline" className="h-12 border-2 border-slate-200 text-slate-700 font-black uppercase text-xs rounded-xl shadow-sm hover:bg-white"><Printer size={16} className="mr-2"/> Etiqueta</Button>
                        <Button onClick={() => onEdit(orden)} className="h-12 bg-slate-900 text-white font-black uppercase text-xs rounded-xl shadow-md"><Edit size={16} className="mr-2"/> Editar</Button>
                        <Button
                          variant="ghost"
                          className="h-12 text-red-500 hover:bg-red-50 font-black uppercase text-[10px]"
                          onClick={async () => {
                            if(confirm("¿Estás seguro de ANULAR esta orden?")) {
                              const res = await toggleOrderActivation(orden.id, orden.status);
                              if(res.success) {
                                toast.success("Orden Anulada ✓");
                                onRefresh();
                              }
                            }
                          }}
                        >
                          <Trash2 size={16} className="mr-2"/> Anular
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        className="h-12 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-black uppercase text-xs rounded-xl shadow-sm"
                        onClick={async () => {
                          if(confirm("¿Deseas REACTIVAR esta orden? El dinero volverá a figurar en caja.")) {
                            const res = await toggleOrderActivation(orden.id, orden.status);
                            if(res.success) {
                              toast.success("Orden Reactivada ✓");
                              onRefresh();
                            } else {
                              toast.error("Error al reactivar");
                            }
                          }
                        }}
                      >
                        <RefreshCw size={16} className="mr-2"/> Reactivar Orden
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          }
        </div>
      </Card>
    </div>
  )
}
