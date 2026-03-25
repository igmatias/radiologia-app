"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
// 🔥 IMPORTANTE: Agregamos updatePatientPaymentMethod
import { getDailyCash, createCashMovement, updateCashMovement, deleteCashMovement, updatePatientPaymentMethod } from "@/actions/cash"
import { getCurrentSession } from "@/actions/auth"
import { 
  Wallet, CreditCard, ArrowDownCircle, ArrowUpCircle, Lock, 
  Receipt, Building2, Calendar, Smartphone, RefreshCw, Calculator, Pencil, Trash2
} from "lucide-react"

export default function CajaClient({ branches }: any) {
  const [session, setSession] = useState<{ branchId: string, userName: string } | null>(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [payments, setPayments] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Arqueo
  const [efectivoEnCajon, setEfectivoEnCajon] = useState<string>("")

  // Modal Gastos
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [movData, setMovData] = useState({ type: "GASTO", amount: "", description: "", method: "EFECTIVO" })

  // Modal Edición Pago Paciente
  const [isPatientPaymentModalOpen, setIsPatientPaymentModalOpen] = useState(false)
  const [editingPatientPayment, setEditingPatientPayment] = useState<any>(null)

  useEffect(() => {
    async function initSession() {
      const userSession = await getCurrentSession();
      if (userSession) {
        const savedBranch = localStorage.getItem("radiologia-branch");
        setSession({ userName: userSession.name || "OPERADOR", branchId: savedBranch || "" });
      }
    }
    initSession();
  }, []);

  const loadData = async () => {
    if (!session?.branchId) return;
    setLoading(true);
    const res = await getDailyCash(session.branchId, date);
    if (res.success) { setPayments(res.payments); setMovements(res.movements); }
    setLoading(false);
  };

  useEffect(() => { loadData(); setEfectivoEnCajon(""); }, [session?.branchId, date]);

  // --- LÓGICA GASTOS ---
  const resetModal = () => { setIsModalOpen(false); setEditingId(null); setMovData({ type: "GASTO", amount: "", description: "", method: "EFECTIVO" }); }
  const openEditModal = (m: any) => { setEditingId(m.id); setMovData({ type: m.type, amount: m.amount.toString(), description: m.description, method: m.method }); setIsModalOpen(true); }

  const handleSaveMovement = async () => {
    if (!movData.amount || !movData.description) return toast.error("Completá monto y descripción");
    if (editingId) {
      const res = await updateCashMovement(editingId, { type: movData.type as any, amount: parseFloat(movData.amount), description: movData.description, method: movData.method as any });
      if (res.success) { toast.success("Editado ✓"); resetModal(); loadData(); } else toast.error(res.error);
    } else {
      const res = await createCashMovement({ branchId: session!.branchId, type: movData.type as any, amount: parseFloat(movData.amount), description: movData.description, method: movData.method as any });
      if (res.success) { toast.success("Registrado ✓"); resetModal(); loadData(); } else toast.error(res.error);
    }
  }

  const handleDeleteMovement = async (id: string) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    const res = await deleteCashMovement(id);
    if (res.success) { toast.success("Eliminado"); loadData(); } else toast.error(res.error);
  }

  // --- LÓGICA EDITAR PAGO PACIENTE ---
  const openPatientPaymentModal = (p: any) => {
    setEditingPatientPayment({ id: p.id, method: p.method, patientName: `${p.order.patient.lastName}, ${p.order.patient.firstName}`, amount: p.amount });
    setIsPatientPaymentModalOpen(true);
  }

  const handleUpdatePatientPayment = async () => {
    if (!editingPatientPayment) return;
    const res = await updatePatientPaymentMethod(editingPatientPayment.id, editingPatientPayment.method);
    if (res.success) {
      toast.success("Medio de pago corregido ✓");
      setIsPatientPaymentModalOpen(false);
      loadData(); // Recarga y recalcula la caja fuerte vs digital
    } else toast.error(res.error);
  }


  // --- CÁLCULOS MATEMÁTICOS ---
  const ingresosEfectivo = payments.filter(p => p.method === 'EFECTIVO').reduce((acc, curr) => acc + curr.amount, 0);
  const totalDigital = payments.filter(p => p.method !== 'EFECTIVO').reduce((acc, curr) => acc + curr.amount, 0);
  const gastosEfectivo = movements.filter(m => m.type === 'GASTO' && m.method === 'EFECTIVO').reduce((acc, curr) => acc + curr.amount, 0);
  const retirosFuerte = movements.filter(m => m.type === 'RETIRO').reduce((acc, curr) => acc + curr.amount, 0);
  const cajaFisicaTeorica = ingresosEfectivo - gastosEfectivo - retirosFuerte;
  const diferenciaArqueo = efectivoEnCajon ? parseFloat(efectivoEnCajon) - cajaFisicaTeorica : null;

  if (!session?.branchId) return <div className="p-10 text-center font-bold uppercase">Configurá una sede en Recepción primero.</div>;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto min-h-screen">
      
      {/* HEADER Y FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border-t-8 border-brand-700">
        <div>
          <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter flex items-center gap-3"><Wallet className="text-brand-700" size={32} /> Caja Diaria</h1>
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest mt-1">SEDE: {branches.find((b:any) => b.id === session.branchId)?.name} • OPERADOR: {session.userName}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 w-48 font-black border-2 bg-slate-50" />
          <Button variant="outline" onClick={loadData} className="h-12 border-2 hover:bg-slate-100" title="Actualizar"><RefreshCw size={18}/></Button>
          
          <Dialog open={isModalOpen} onOpenChange={(open) => { if(!open) resetModal(); else setIsModalOpen(true); }}>
            <DialogTrigger asChild><Button className="h-12 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic rounded-xl px-6 shadow-lg">+ Gastos / Retiros</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white rounded-3xl border-t-8 border-slate-900 p-8 outline-none">
              <DialogHeader><DialogTitle className="text-2xl font-black italic uppercase">{editingId ? "Editar Movimiento" : "Registrar Movimiento"}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <Select value={movData.type} onValueChange={v => setMovData({...movData, type: v})}><SelectTrigger className="h-12 border-2 font-bold uppercase"><SelectValue /></SelectTrigger><SelectContent className="font-bold uppercase"><SelectItem value="GASTO">📉 Gasto</SelectItem><SelectItem value="RETIRO">🔒 Retiro Fuerte</SelectItem><SelectItem value="INGRESO_EXTRA">📈 Ingreso Extra</SelectItem></SelectContent></Select>
                <div className="relative"><span className="absolute left-4 top-3.5 text-slate-400 font-bold">$</span><Input type="number" placeholder="MONTO" className="pl-8 h-12 font-black text-lg border-2" value={movData.amount} onChange={e => setMovData({...movData, amount: e.target.value})} /></div>
                <Input placeholder="DESCRIPCIÓN (Ej: Resmas)" className="h-12 font-bold uppercase border-2" value={movData.description} onChange={e => setMovData({...movData, description: e.target.value.toUpperCase()})} />
                <Select value={movData.method} onValueChange={v => setMovData({...movData, method: v})}><SelectTrigger className="h-12 border-2 font-bold uppercase text-slate-500"><SelectValue /></SelectTrigger><SelectContent className="font-bold uppercase"><SelectItem value="EFECTIVO">💵 EFECTIVO (Cajón)</SelectItem><SelectItem value="MERCADOPAGO">📱 MERCADOPAGO</SelectItem><SelectItem value="TRANSFERENCIA">🏛️ TRANSFERENCIA</SelectItem></SelectContent></Select>
                <Button className="w-full h-14 text-lg bg-brand-700 hover:bg-brand-800 text-white font-black uppercase italic rounded-2xl shadow-xl mt-4" onClick={handleSaveMovement}>{editingId ? "ACTUALIZAR ✓" : "GUARDAR ✓"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* MODAL EDITAR MEDIO DE PAGO PACIENTE */}
      <Dialog open={isPatientPaymentModalOpen} onOpenChange={setIsPatientPaymentModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white rounded-3xl border-t-8 border-emerald-500 p-8 outline-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase">Corregir Pago</DialogTitle>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{editingPatientPayment?.patientName} • ${editingPatientPayment?.amount}</p>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Select value={editingPatientPayment?.method} onValueChange={v => setEditingPatientPayment({...editingPatientPayment, method: v})}>
              <SelectTrigger className="h-12 border-2 font-bold uppercase"><SelectValue /></SelectTrigger>
              <SelectContent className="font-bold uppercase">
                <SelectItem value="EFECTIVO">💵 EFECTIVO</SelectItem>
                <SelectItem value="MERCADOPAGO">📱 MERCADOPAGO</SelectItem>
                <SelectItem value="TARJETA_DEBITO">💳 DÉBITO</SelectItem>
                <SelectItem value="TARJETA_CREDITO">💳 CRÉDITO</SelectItem>
                <SelectItem value="TRANSFERENCIA">🏛️ TRANSFERENCIA</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic rounded-2xl shadow-xl mt-2" onClick={handleUpdatePatientPayment}>GUARDAR CAMBIO ✓</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-none shadow-xl bg-emerald-600 text-white rounded-3xl overflow-hidden relative group lg:col-span-2">
          <div className="absolute right-[-20px] top-[-20px] opacity-20"><Wallet size={120} /></div>
          <CardContent className="p-6 relative flex flex-col h-full justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 mb-1 flex items-center gap-1.5"><Calculator size={14}/> Efectivo Teórico (Sistema)</p><h2 className="text-5xl font-black tracking-tighter italic">${cajaFisicaTeorica}</h2></div>
            <div className="mt-5 bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
               <div className="flex justify-between items-center mb-1"><span className="text-xs font-black uppercase tracking-widest text-emerald-100">Efectivo Real en Cajón:</span><div className="relative w-36"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span><Input type="number" value={efectivoEnCajon} onChange={e => setEfectivoEnCajon(e.target.value)} className="h-10 pl-7 font-black text-lg text-slate-900 bg-white border-0 rounded-xl focus-visible:ring-emerald-300" placeholder="0.00" /></div></div>
               {diferenciaArqueo !== null && (<div className={`flex justify-between items-center p-2.5 rounded-xl mt-3 transition-colors shadow-inner ${diferenciaArqueo < 0 ? 'bg-brand-500 text-white' : diferenciaArqueo > 0 ? 'bg-amber-400 text-amber-950' : 'bg-emerald-400 text-emerald-950'}`}><span className="text-[10px] font-black uppercase tracking-widest">{diferenciaArqueo < 0 ? '⚠️ FALTANTE:' : diferenciaArqueo > 0 ? '💡 SOBRANTE:' : '✓ CAJA CUADRADA:'}</span><span className="text-xl font-black italic">{diferenciaArqueo > 0 ? '+' : ''}${diferenciaArqueo}</span></div>)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white rounded-3xl border-t-4 border-t-blue-600 flex flex-col justify-center">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2"><Smartphone size={16} className="text-blue-600" /><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Digital</p></div>
            <h2 className="text-3xl font-black tracking-tighter italic text-slate-800">${totalDigital}</h2>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white rounded-3xl border-t-4 border-t-amber-500 flex flex-col justify-center">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2"><ArrowDownCircle size={16} className="text-amber-500" /><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gastos del Día</p></div>
            <h2 className="text-3xl font-black tracking-tighter italic text-amber-600">${gastosEfectivo}</h2>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-slate-900 text-white rounded-3xl border-t-4 border-t-brand-500 flex flex-col justify-center">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2"><Lock size={16} className="text-brand-400" /><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">A Caja Fuerte</p></div>
            <h2 className="text-3xl font-black tracking-tighter italic text-white">${retirosFuerte}</h2>
          </CardContent>
        </Card>
      </div>

      {/* DETALLE DE MOVIMIENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMNA INGRESOS PACIENTES (AHORA SE PUEDE EDITAR EL PAGO) */}
        <Card className="border-none shadow-lg rounded-3xl bg-white overflow-hidden">
          <div className="bg-slate-50 p-4 border-b font-black uppercase italic text-sm text-slate-700 flex items-center gap-2">
            <ArrowUpCircle className="text-emerald-500"/> Ingresos de Pacientes ({payments.length})
          </div>
          <CardContent className="p-0 max-h-[500px] overflow-y-auto">
            {loading ? <p className="p-6 text-center text-slate-400 italic font-bold">Cargando...</p> : 
              payments.length === 0 ? <p className="p-6 text-center text-slate-400 italic font-bold">No hay ingresos registrados hoy.</p> : (
              <div className="divide-y divide-slate-100">
                {payments.map(p => (
                  <div key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                    <div>
                      <p className="font-black uppercase text-sm text-slate-800">{p.order?.patient?.lastName}, {p.order?.patient?.firstName}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Orden #{p.order?.code} • {new Date(p.createdAt).toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-lg italic text-slate-900">${p.amount}</p>
                        <p className={`text-[9px] font-black uppercase px-2 py-0.5 rounded text-white inline-block mt-1 ${p.method === 'EFECTIVO' ? 'bg-emerald-500' : p.method === 'MERCADOPAGO' ? 'bg-sky-500' : 'bg-slate-500'}`}>
                          {p.method}
                        </p>
                      </div>
                      {/* BOTÓN EDITAR MEDIO DE PAGO */}
                      <button onClick={() => openPatientPaymentModal(p)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border shadow-sm rounded-md transition-all opacity-20 group-hover:opacity-100" title="Corregir medio de pago">
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* COLUMNA GASTOS Y RETIROS */}
        <Card className="border-none shadow-lg rounded-3xl bg-white overflow-hidden">
          <div className="bg-slate-50 p-4 border-b font-black uppercase italic text-sm text-slate-700 flex items-center gap-2">
            <Receipt className="text-amber-500"/> Gastos y Otros Movimientos ({movements.length})
          </div>
          <CardContent className="p-0 max-h-[500px] overflow-y-auto">
            {loading ? <p className="p-6 text-center text-slate-400 italic font-bold">Cargando...</p> : 
              movements.length === 0 ? <p className="p-6 text-center text-slate-400 italic font-bold">No hay gastos ni retiros hoy.</p> : (
              <div className="divide-y divide-slate-100">
                {movements.map(m => (
                  <div key={m.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded text-white inline-block ${m.type === 'GASTO' ? 'bg-amber-500' : m.type === 'RETIRO' ? 'bg-slate-900' : 'bg-emerald-500'}`}>{m.type}</span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(m.createdAt).toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="font-black uppercase text-sm text-slate-800 mt-1 truncate">{m.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-black text-lg italic ${m.type === 'INGRESO_EXTRA' ? 'text-emerald-600' : 'text-brand-600'}`}>{m.type === 'INGRESO_EXTRA' ? '+' : '-'}${m.amount}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-0.5">{m.method}</p>
                      </div>
                      <div className="flex flex-col gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(m)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border shadow-sm rounded-md transition-colors" title="Editar"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteMovement(m.id)} className="p-1.5 text-slate-400 hover:text-brand-600 bg-white border shadow-sm rounded-md transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}