"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  LayoutGrid, ClipboardCheck, Search, Check, Filter, ArrowUpDown,
  AlertTriangle, RefreshCw, Trash2, Edit, Printer, FileText, Calendar, GraduationCap, CalendarRange
} from "lucide-react"
import { getOrdersForRecipeCheck, toggleRecipeCheck } from "@/actions/orders"
import { getBillingPeriodsForOS } from "@/actions/reports"

export default function OrderesView({ dailyOrders, orderSearch, setOrderSearch, refreshOrders, handleReimprimir, handleImprimirComprobante, handleEditarOrden, toggleOrderActivation, obrasSociales, session }: any) {
  const [subTab, setSubTab] = useState<'ORDENES_DIA' | 'CONTROL_RECETAS'>('ORDENES_DIA');
  const [rcOrders, setRcOrders] = useState<any[]>([]);
  const [rcLoading, setRcLoading] = useState(false);
  const [rcDate, setRcDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [rcEndDate, setRcEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [rcOS, setRcOS] = useState("ALL");
  const [rcVariant, setRcVariant] = useState("ALL");
  const [rcSort, setRcSort] = useState<'ALFA' | 'FECHA'>('ALFA');
  const [rcFilterChecked, setRcFilterChecked] = useState<'ALL' | 'PENDING' | 'CHECKED'>('ALL');
  const [rcPeriods, setRcPeriods] = useState<any[]>([]);
  const [rcSelectedPeriod, setRcSelectedPeriod] = useState<string>("LIBRE");

  const handleRcOSChange = async (v: string) => {
    setRcOS(v);
    setRcVariant("ALL");
    setRcSelectedPeriod("LIBRE");
    setRcPeriods([]);
    if (v && v !== "ALL") {
      const res = await getBillingPeriodsForOS(v);
      if (res.success) setRcPeriods(res.periods);
    }
  };

  const loadRecipeOrders = async () => {
    if (!session?.branchId) return;
    setRcLoading(true);
    const res = await getOrdersForRecipeCheck(session.branchId, rcDate, rcEndDate, rcOS !== 'ALL' ? rcOS : undefined, rcVariant !== 'ALL' ? rcVariant : undefined);
    if (res.success) setRcOrders(res.data || []);
    setRcLoading(false);
  };

  const handleToggleCheck = async (orderId: string, currentChecked: boolean) => {
    const res = await toggleRecipeCheck(orderId, !currentChecked, session?.userName);
    if (res.success) {
      setRcOrders(prev => prev.map(o => o.id === orderId ? { ...o, recipeChecked: !currentChecked, recipeCheckedAt: !currentChecked ? new Date().toISOString() : null, recipeCheckedBy: !currentChecked ? session?.userName : null } : o));
    }
  };

  const sortedFiltered = useMemo(() => {
    let list = [...rcOrders];
    if (rcFilterChecked === 'PENDING') list = list.filter(o => !o.recipeChecked);
    if (rcFilterChecked === 'CHECKED') list = list.filter(o => o.recipeChecked);
    if (rcSort === 'ALFA') list.sort((a, b) => (a.patient?.lastName || '').localeCompare(b.patient?.lastName || ''));
    else list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return list;
  }, [rcOrders, rcSort, rcFilterChecked]);

  const checkedCount = rcOrders.filter(o => o.recipeChecked).length;
  const totalCount = rcOrders.length;
  const progressPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <Button onClick={() => setSubTab('ORDENES_DIA')} className={`h-11 rounded-xl font-black uppercase text-xs px-6 ${subTab === 'ORDENES_DIA' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50'}`}>
          <LayoutGrid size={16} className="mr-2" /> Órdenes del Día
        </Button>
        <Button onClick={() => setSubTab('CONTROL_RECETAS')} className={`h-11 rounded-xl font-black uppercase text-xs px-6 ${subTab === 'CONTROL_RECETAS' ? 'bg-emerald-700 text-white shadow-lg' : 'bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50'}`}>
          <ClipboardCheck size={16} className="mr-2" /> Control de Recetas
        </Button>
      </div>

      {subTab === 'ORDENES_DIA' && (
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white border-t-8 border-slate-900 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
            <div>
              <h3 className="text-3xl font-black uppercase italic text-slate-900 flex items-center gap-3">
                <LayoutGrid className="text-brand-700" size={32}/> Órdenes de Hoy
              </h3>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input placeholder="BUSCAR..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="pl-10 h-12 text-xs font-bold border-2 rounded-xl uppercase" /></div>
              <Button onClick={refreshOrders} variant="outline" className="border-2 rounded-xl font-black text-[10px] h-12">Actualizar</Button>
            </div>
          </div>
          <div className="space-y-4">
            {dailyOrders
              .filter((o: any) => {
                const term = orderSearch.toLowerCase();
                if (!term) return true;
                return o.patient?.lastName?.toLowerCase().includes(term) || o.patient?.dni?.includes(term) || (o.code && o.code.toLowerCase().includes(term));
              })
              .map((orden: any) => {
                const isAnulada = orden.status === 'ANULADA';
                return (
                  <div key={orden.id} className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between md:items-center gap-6 group ${isAnulada ? 'bg-slate-50 border-slate-200 opacity-70 grayscale' : 'bg-slate-50 border-slate-200 hover:border-slate-400 shadow-sm'}`}>
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`${isAnulada ? 'bg-slate-400' : 'bg-brand-700'} text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest`}>Nº {orden.code || orden.dailyId}</span>
                        {isAnulada && <span className="bg-brand-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-sm italic flex items-center gap-1 animate-pulse"><AlertTriangle size={10} /> ANULADA</span>}
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(orden.createdAt).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}hs</span>
                      </div>
                      <p className={`text-xl font-black uppercase leading-tight mb-1 ${isAnulada ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{orden.patient?.lastName}, {orden.patient?.firstName}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{orden.items.length} Estudio(s) • {orden.dentist ? `Dr. ${orden.dentist.lastName}` : "Particular"}</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 items-center">
                      {!isAnulada && <div className="text-right mr-4 hidden md:block"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Abonado</p><p className="text-2xl font-black italic text-emerald-600 leading-none">${(orden.patientAmount || 0).toLocaleString()}</p></div>}
                      {!isAnulada ? (
                        <>
                          <Button onClick={() => handleReimprimir(orden)} variant="outline" className="h-12 border-2 border-slate-200 text-slate-700 font-black uppercase text-xs rounded-xl shadow-sm hover:bg-white"><Printer size={16} className="mr-2"/> Etiqueta</Button>
                          <Button onClick={() => handleImprimirComprobante(orden)} variant="outline" className="h-12 border-2 border-brand-200 text-brand-700 font-black uppercase text-xs rounded-xl shadow-sm hover:bg-brand-50"><FileText size={16} className="mr-2"/> Comprobante</Button>
                          <Button onClick={() => handleEditarOrden(orden)} className="h-12 bg-slate-900 text-white font-black uppercase text-xs rounded-xl shadow-md"><Edit size={16} className="mr-2"/> Editar</Button>
                          <Button variant="ghost" className="h-12 text-brand-500 hover:bg-brand-50 font-black uppercase text-[10px]" onClick={async () => { if(confirm("¿Estás seguro de ANULAR esta orden?")) { const res = await toggleOrderActivation(orden.id, orden.status); if(res.success) { toast.success("Orden Anulada ✓"); await refreshOrders(); } } }}><Trash2 size={16} className="mr-2"/> Anular</Button>
                        </>
                      ) : (
                        <Button variant="outline" className="h-12 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-black uppercase text-xs rounded-xl shadow-sm" onClick={async () => { if(confirm("¿Deseas REACTIVAR esta orden?")) { const res = await toggleOrderActivation(orden.id, orden.status); if(res.success) { toast.success("Orden Reactivada ✓"); await refreshOrders(); } else { toast.error("Error al reactivar"); } } }}><RefreshCw size={16} className="mr-2"/> Reactivar Orden</Button>
                      )}
                    </div>
                  </div>
                )
              })
            }
          </div>
        </Card>
      )}

      {subTab === 'CONTROL_RECETAS' && (
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white border-t-8 border-emerald-700 p-8">
          <div className="mb-6">
            <h3 className="text-3xl font-black uppercase italic text-slate-900 flex items-center gap-3 mb-6">
              <ClipboardCheck className="text-emerald-600" size={32}/> Control de Recetas
            </h3>

            {/* Filtros */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Desde</label>
                <Input type="date" value={rcDate} onChange={e => { setRcDate(e.target.value); setRcSelectedPeriod("LIBRE"); }} className="h-10 font-bold border-2 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Hasta</label>
                <Input type="date" value={rcEndDate} onChange={e => { setRcEndDate(e.target.value); setRcSelectedPeriod("LIBRE"); }} className="h-10 font-bold border-2 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Obra Social</label>
                <Select value={rcOS} onValueChange={handleRcOSChange}>
                  <SelectTrigger className="h-10 font-bold border-2 uppercase text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="font-bold uppercase">
                    <SelectItem value="ALL">Todas</SelectItem>
                    {obrasSociales.map((os: any) => <SelectItem key={os.id} value={os.id}>{os.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {(() => {
                  const os = obrasSociales.find((o: any) => o.id === rcOS);
                  if (!os?.variants?.length) return null;
                  return (
                    <Select value={rcVariant} onValueChange={setRcVariant}>
                      <SelectTrigger className="h-9 font-bold uppercase border-2 border-violet-300 bg-violet-50 text-[10px] mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent className="font-black uppercase">
                        <SelectItem value="ALL">— Todas —</SelectItem>
                        {os.variants.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><CalendarRange size={9} /> Período</label>
                <Select
                  value={rcSelectedPeriod}
                  onValueChange={(v) => {
                    setRcSelectedPeriod(v);
                    if (v !== "LIBRE") {
                      const p = rcPeriods.find((x: any) => x.id === v);
                      if (p) {
                        setRcDate(new Date(p.startDate).toISOString().split('T')[0]);
                        setRcEndDate(new Date(p.endDate).toISOString().split('T')[0]);
                      }
                    }
                  }}
                >
                  <SelectTrigger className={`h-10 font-bold border-2 uppercase text-xs ${rcSelectedPeriod !== "LIBRE" ? "border-cyan-400 bg-cyan-50 text-cyan-800" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-bold uppercase">
                    <SelectItem value="LIBRE">— Libre —</SelectItem>
                    {rcPeriods.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({new Date(p.startDate).toLocaleDateString('es-AR')} — {new Date(p.endDate).toLocaleDateString('es-AR')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Ordenar</label>
                <Select value={rcSort} onValueChange={(v: any) => setRcSort(v)}>
                  <SelectTrigger className="h-10 font-bold border-2 uppercase text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="font-bold uppercase">
                    <SelectItem value="ALFA">Alfabético</SelectItem>
                    <SelectItem value="FECHA">Por Fecha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={loadRecipeOrders} disabled={rcLoading} className="h-10 bg-emerald-700 hover:bg-emerald-800 text-white font-black uppercase text-xs rounded-xl">
                <Search size={14} className="mr-2" /> {rcLoading ? "Cargando..." : "Buscar"}
              </Button>
            </div>
          </div>

          {rcOrders.length > 0 && (
            <>
              {/* Barra de progreso */}
              <div className="mb-6 bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-black uppercase text-slate-600">Progreso de Control</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-emerald-700">{checkedCount} / {totalCount}</span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${progressPct === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{progressPct}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant={rcFilterChecked === 'ALL' ? 'default' : 'outline'} size="sm" className={`h-7 text-[10px] font-black uppercase rounded-lg ${rcFilterChecked === 'ALL' ? 'bg-slate-800' : ''}`} onClick={() => setRcFilterChecked('ALL')}>Todas ({totalCount})</Button>
                  <Button variant={rcFilterChecked === 'PENDING' ? 'default' : 'outline'} size="sm" className={`h-7 text-[10px] font-black uppercase rounded-lg ${rcFilterChecked === 'PENDING' ? 'bg-amber-600' : ''}`} onClick={() => setRcFilterChecked('PENDING')}>Pendientes ({totalCount - checkedCount})</Button>
                  <Button variant={rcFilterChecked === 'CHECKED' ? 'default' : 'outline'} size="sm" className={`h-7 text-[10px] font-black uppercase rounded-lg ${rcFilterChecked === 'CHECKED' ? 'bg-emerald-700' : ''}`} onClick={() => setRcFilterChecked('CHECKED')}>Controladas ({checkedCount})</Button>
                </div>
              </div>

              {/* Tabla */}
              <div className="rounded-2xl border-2 border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-3 py-3 w-10 text-center">#</th>
                      <th className="px-3 py-3 w-12 text-center">✓</th>
                      <th className="px-4 py-3">Paciente</th>
                      <th className="px-3 py-3">DNI</th>
                      <th className="px-3 py-3">Odontólogo</th>
                      <th className="px-3 py-3">O.S.</th>
                      <th className="px-3 py-3">Prácticas</th>
                      <th className="px-3 py-3">Nº Orden</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedFiltered.map((orden: any, idx: number) => (
                      <tr
                        key={orden.id}
                        className={`transition-all cursor-pointer ${orden.recipeChecked ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-white hover:bg-slate-50'}`}
                        onClick={() => handleToggleCheck(orden.id, orden.recipeChecked)}
                      >
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${orden.recipeChecked ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{idx + 1}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${orden.recipeChecked ? 'bg-emerald-500 border-emerald-500 text-white scale-110' : 'border-slate-300 bg-white'}`}>
                            {orden.recipeChecked && <Check size={16} />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`text-sm font-black uppercase ${orden.recipeChecked ? 'text-emerald-800' : 'text-slate-800'}`}>{orden.patient?.lastName}, {orden.patient?.firstName}</p>
                        </td>
                        <td className="px-3 py-3 text-xs font-bold text-slate-500">{orden.patient?.dni}</td>
                        <td className="px-3 py-3 text-xs font-bold text-slate-600 uppercase">{orden.dentist ? `${orden.dentist.lastName}` : <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-3">
                          <p className="text-xs font-bold text-slate-600 uppercase">{orden.obraSocial?.name || 'Particular'}</p>
                          {orden.osVariant?.name && <p className="text-[9px] font-bold text-violet-600">{orden.osVariant.name}</p>}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {orden.items?.map((it: any, i: number) => (
                              <span key={i} className="text-[9px] font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded uppercase">{it.metadata?.customName || it.procedure?.name}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs font-black text-slate-500">{orden.code || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {sortedFiltered.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <ClipboardCheck size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="font-black uppercase text-sm">{rcFilterChecked === 'PENDING' ? 'Todas las recetas fueron controladas' : 'No hay recetas controladas'}</p>
                </div>
              )}
            </>
          )}

          {rcOrders.length === 0 && !rcLoading && (
            <div className="text-center py-16 text-slate-400">
              <ClipboardCheck size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-black uppercase text-sm">Usá los filtros para cargar las órdenes a controlar</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
