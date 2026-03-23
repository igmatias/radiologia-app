"use client"

import { useState, useEffect } from "react"
import OrderForm from "@/components/orders/order-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label" // 👉 IMPORTACIÓN CORREGIDA
import { toast } from "sonner"
import { cobrarSaldoPendiente } from "@/actions/admin-stats"
import {
  getEstadoCaja,
  abrirCajaDiaria,
  registrarMovimientoRecepcion,
  eliminarMovimientoRecepcion,
  cerrarCajaDiaria,
} from "@/actions/caja"
import { getCurrentSession } from "@/actions/auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { 
  UserPlus, Wallet, Clock, Lock, ShieldCheck, 
  Banknote, Vault, MinusCircle, Trash2, Calculator, LayoutGrid,
  Send, RefreshCw, Plus 
} from "lucide-react"

export default function RecepcionClient({ branches, dentists, obrasSociales, procedures, saldos }: any) {
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<"NUEVA_ORDEN" | "ORDENES" | "CAJA" | "SALDOS">("NUEVA_ORDEN")
  const [resetTrigger, setResetTrigger] = useState(0)

  const [branchId, setBranchId] = useState<string | null>(null)
  const [userName, setUserName] = useState("Recepcionista")
  const [loading, setLoading] = useState(false)

  const [saldoSeleccionado, setSaldoSeleccionado] = useState<any>(null)
  const [metodoPago, setMetodoPago] = useState<string>("EFECTIVO")

  const [estadoCaja, setEstadoCaja] = useState<any>(null)
  const [cargandoCaja, setCargandoCaja] = useState(true)
  const [movimientoModal, setMovimientoModal] = useState(false)
  const [nuevoMovimiento, setNuevoMovimiento] = useState({ type: "GASTO", amount: "", description: "" })

  const [efectivoFisico, setEfectivoFisico] = useState<string>("")
  const [cierreModal, setCierreModal] = useState(false)
  const [totalEfectivoCierre, setTotalEfectivoCierre] = useState(0)
  const [notasCierre, setNotasCierre] = useState("")

  useEffect(() => {
    async function init() {
      const session = await getCurrentSession()
      if (session?.name) setUserName(session.name)
      const savedBranch = localStorage.getItem("radiologia-branch")
      if (savedBranch) { 
        setBranchId(savedBranch); 
        cargarCaja(savedBranch); 
      } 
      else { setCargandoCaja(false); }
    }
    init()
  }, [])

  // 👉 AUTO-ACTUALIZACIÓN DE CAJA CADA 30 SEGUNDOS
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === "CAJA" && branchId) {
      interval = setInterval(() => {
        cargarCaja(branchId);
      }, 30000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeTab, branchId]);

  const cargarCaja = async (idSede: string) => {
    setCargandoCaja(true)
    const res = await getEstadoCaja(idSede)
    if (res.success) setEstadoCaja(res)
    setCargandoCaja(false)
  }

  const saldosFiltrados = branchId ? saldos.filter((s: any) => s.order?.branchId === branchId) : []
  const nombreSedeActual = branches.find((b: any) => b.id === branchId)?.name || "Sin sede"

  const handleAbrirCaja = async () => {
    if (!branchId) return toast.error("Seleccioná una sede primero")
    setLoading(true)
    const res = await abrirCajaDiaria(branchId, userName)
    if (res.success) { toast.success("¡Caja Abierta!"); cargarCaja(branchId); } 
    else toast.error(res.error)
    setLoading(false)
  }

  const handleGuardarMovimiento = async () => {
    if (!nuevoMovimiento.amount || !nuevoMovimiento.description || !branchId) return toast.error("Completá todos los campos")
    setLoading(true)
    const res = await registrarMovimientoRecepcion(branchId, nuevoMovimiento.type as any, parseFloat(nuevoMovimiento.amount), nuevoMovimiento.description)
    if (res.success) {
      toast.success("Operación registrada ✓")
      setMovimientoModal(false)
      setNuevoMovimiento({ type: "GASTO", amount: "", description: "" })
      cargarCaja(branchId)
    } else toast.error(res.error)
    setLoading(false)
  }

  const handleBorrarMovimiento = async (id: string) => {
    if (!confirm("¿Eliminar este registro?")) return
    setLoading(true)
    const res = await eliminarMovimientoRecepcion(id, branchId!)
    if (res.success) { toast.success("Registro eliminado ✓"); cargarCaja(branchId!); } 
    else toast.error(res.error)
    setLoading(false)
  }

  const handleCerrarCaja = async () => {
    const monto = parseFloat(efectivoFisico) || 0
    setLoading(true)
    const res = await cerrarCajaDiaria(branchId!, userName, monto, notasCierre)
    if (res.success) {
      toast.success("Turno cerrado correctamente")
      setCierreModal(false)
      cargarCaja(branchId!)
    } else toast.error(res.error)
    setLoading(false)
  }

  const handleCobrarSaldo = async () => {
    setLoading(true)
    const res = await cobrarSaldoPendiente(saldoSeleccionado.id, metodoPago)
    if (res.success) {
      toast.success("¡Cobro realizado!")
      setSaldoSeleccionado(null)
      if (branchId) cargarCaja(branchId)
      router.refresh()
    } else toast.error((res as any).error || "Ocurrió un error en la caja")
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto hide-on-print">
      
      {/* MENU SUPERIOR UNIFICADO */}
      <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-3xl md:rounded-full w-full max-w-5xl border border-slate-200 gap-1 mx-auto md:mx-0 shadow-sm">
        <button onClick={() => { setActiveTab("NUEVA_ORDEN"); setResetTrigger(prev=>prev+1); }} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-black uppercase text-[10px] md:text-xs transition-all ${activeTab === "NUEVA_ORDEN" ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
          <UserPlus size={16}/> NUEVA ORDEN
        </button>
        <button onClick={() => setActiveTab("ORDENES")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-black uppercase text-[10px] md:text-xs transition-all ${activeTab === "ORDENES" ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
          <LayoutGrid size={16}/> ÓRDENES
        </button>
        <button onClick={() => setActiveTab("CAJA")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-black uppercase text-[10px] md:text-xs transition-all ${activeTab === "CAJA" ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-700'}`}>
          <Banknote size={16}/> MI CAJA
        </button>
        <button onClick={() => setActiveTab("SALDOS")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-black uppercase text-[10px] md:text-xs transition-all ${activeTab === "SALDOS" ? 'bg-red-700 text-white shadow-sm' : 'text-slate-500 hover:text-red-700'}`}>
          <Wallet size={16}/> SALDOS {saldosFiltrados.length > 0 && <span className="bg-red-900 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1">{saldosFiltrados.length}</span>}
        </button>
        
        <button 
          onClick={() => router.push("/entregas")} 
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-black uppercase text-[10px] md:text-xs transition-all bg-slate-700 text-white hover:bg-slate-800 shadow-md border-b-[3px] border-slate-950 active:border-b-0 active:translate-y-px"
        >
          <Send size={16}/> ENTREGAS
        </button>
      </div>

      {(activeTab === "NUEVA_ORDEN" || activeTab === "ORDENES") && (
        <div className="animate-in fade-in duration-500">
          <OrderForm branches={branches} dentists={dentists} obrasSociales={obrasSociales} procedures={procedures} activeTab={activeTab} setActiveTab={setActiveTab} resetTrigger={resetTrigger} />
        </div>
      )}

      {activeTab === "SALDOS" && (
        <div className="max-w-4xl animate-in fade-in duration-300">
           <Card className="border-none shadow-lg rounded-[2.5rem] bg-white border-t-8 border-red-700 p-8">
              <h3 className="text-3xl font-black uppercase italic text-slate-900 mb-8 flex items-center gap-3"><Clock size={32} className="text-red-700"/> Saldos Pendientes</h3>
              <div className="space-y-4">
                {saldosFiltrados.length === 0 ? <p className="text-center py-10 text-slate-400 font-bold uppercase">No hay deudas en esta sede</p> : 
                  saldosFiltrados.map((s: any) => (
                    <div key={s.id} className="bg-slate-50 p-5 rounded-2xl flex justify-between items-center border border-slate-200">
                       <div><p className="text-lg font-black uppercase text-slate-800">{s.order?.patient?.lastName}, {s.order?.patient?.firstName}</p><p className="text-xs font-bold text-slate-500 uppercase">DNI: {s.order?.patient?.dni}</p></div>
                       <div className="text-right"><p className="text-3xl font-black text-red-600 italic">${s.amount.toLocaleString('es-AR')}</p><Button onClick={() => setSaldoSeleccionado(s)} className="mt-2 bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs h-10 px-6 rounded-xl">Ingresar Pago</Button></div>
                    </div>
                  ))
                }
              </div>
           </Card>
        </div>
      )}

      {activeTab === "CAJA" && (
        <div className="animate-in fade-in duration-300">
          {cargandoCaja && !estadoCaja ? (
            <div className="text-center py-20 font-black uppercase text-slate-400 italic tracking-widest animate-pulse">Iniciando Bóveda...</div>
          ) : !estadoCaja?.cajaAbierta ? (
            <div className="flex justify-center mt-10">
              <Card className="border-none shadow-2xl rounded-[3rem] bg-white border border-slate-100 overflow-hidden text-center py-20 px-10 max-w-lg w-full relative">
                <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
                <Lock size={80} className="mx-auto text-slate-200 mb-8" />
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-slate-800">Caja Inactiva</h2>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-10">Sede: {nombreSedeActual}</p>
                <Button onClick={handleAbrirCaja} disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase h-16 rounded-full shadow-xl">Abrir Turno de Hoy</Button>
              </Card>
            </div>
          ) : estadoCaja.caja.status === 'CERRADA' ? (
            <div className="flex justify-center mt-10 text-center">
              <Card className="border-none shadow-xl rounded-[3rem] bg-emerald-950 text-white p-16 max-w-xl w-full">
                <ShieldCheck size={96} className="mx-auto text-emerald-500 mb-6 opacity-80" />
                <h2 className="text-4xl font-black uppercase italic mb-6">Turno Cerrado</h2>
                <div className="bg-emerald-900/50 p-8 rounded-[2rem] border border-emerald-800/50">
                  <p className="text-xs font-black uppercase text-emerald-500 mb-1">Efectivo Final</p>
                  <p className="text-5xl font-black italic">${estadoCaja.caja.endBalance?.toLocaleString('es-AR')}</p>
                </div>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-8 items-start">
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <Card className="border-none shadow-lg rounded-[2.5rem] bg-white border border-slate-100 p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                      <div className="flex items-center gap-4">
                        <h2 className="text-4xl font-black tracking-tighter text-slate-900 flex items-center gap-3"><Banknote className="text-emerald-500" size={40}/> Mi Caja Diaria</h2>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => cargarCaja(branchId!)} 
                          className="rounded-full h-10 w-10 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-90"
                          title="Actualizar montos"
                        >
                          <RefreshCw size={20} className={cargandoCaja ? "animate-spin" : ""} />
                        </Button>
                      </div>
                      <div className="flex gap-3 mt-3">
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black uppercase italic">Turno Abierto</span>
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Apertura: {new Date(estadoCaja.caja.createdAt).toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'})}hs</span>
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase italic animate-pulse">Auto-Update ON</span>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                       <Button onClick={() => { setNuevoMovimiento({type: "GASTO", amount: "", description: ""}); setMovimientoModal(true); }} className="flex-1 bg-white border-2 border-slate-200 text-slate-900 font-black uppercase text-xs h-14 px-6 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors">Nuevo Gasto</Button>
                       <Button onClick={() => { setNuevoMovimiento({type: "A_CAJA_FUERTE", amount: "", description: ""}); setMovimientoModal(true); }} className="flex-1 bg-slate-900 text-white font-black uppercase text-xs h-14 px-6 rounded-2xl shadow-lg hover:bg-slate-800 transition-transform active:scale-95">A Bóveda</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { t: "Inicio", v: estadoCaja.caja.startBalance, c: "text-slate-500" },
                      { t: "Cobros", v: estadoCaja.ingresosEfectivo, c: "text-emerald-600" },
                      { t: "Salidas", v: estadoCaja.salidasEfectivo, c: "text-red-600" },
                      { t: "En Sistema", v: estadoCaja.totalEnCajon, v_raw: estadoCaja.totalEnCajon, c: "text-slate-900 font-black", bg: "bg-emerald-50 border-emerald-200 shadow-inner" }
                    ].map((item, i) => (
                      <div key={i} className={`p-5 rounded-3xl border border-slate-100 bg-slate-50/50 ${item.bg}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70 italic">{item.t}</p>
                        <p className={`text-2xl font-bold ${item.c}`}>${item.v.toLocaleString('es-AR')}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 border-b border-slate-50 pb-2">Operaciones de Hoy</h4>
                  <div className="space-y-3">
                    {estadoCaja.movimientos.length === 0 ? <p className="text-center py-10 text-slate-300 font-bold uppercase text-xs">Sin movimientos manuales</p> : 
                      estadoCaja.movimientos.map((m: any) => (
                        <div key={m.id} className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${m.type === 'A_CAJA_FUERTE' ? 'bg-amber-100 text-amber-600' : m.type === 'INGRESO' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                              {m.type === 'A_CAJA_FUERTE' ? <Vault size={20}/> : m.type === 'INGRESO' ? <Plus size={20}/> : <MinusCircle size={20}/>}
                            </div>
                            <div>
                              <p className="text-lg font-black uppercase text-slate-800 leading-none">{m.description}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{m.type.replace(/_/g, ' ')} • {new Date(m.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className={`text-2xl font-black ${m.type === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {m.type === 'INGRESO' ? '+' : '-'}${m.amount.toLocaleString('es-AR')}
                            </p>
                            <button onClick={() => handleBorrarMovimiento(m.id)} className="text-slate-300 hover:text-red-600 transition-colors p-2 opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </Card>
              </div>

              <div className="col-span-12 lg:col-span-4 sticky top-6">
                <Card className="border-none shadow-xl rounded-[3rem] bg-white border-2 border-slate-100 p-8 space-y-8">
                  <div>
                    <h3 className="text-xl font-black uppercase italic text-slate-900 flex items-center gap-2 mb-2"><Calculator className="text-emerald-500"/> Arqueo Físico</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed">Contá el efectivo real que tenés en el cajón y cargalo aquí debajo.</p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black uppercase text-slate-500 ml-2 mb-2 block">Total Efectivo Contado ($)</label>
                      <Input 
                        type="number" 
                        placeholder="Ej: 45800" 
                        value={efectivoFisico} 
                        onChange={e => setEfectivoFisico(e.target.value)} 
                        className="h-20 rounded-[1.5rem] border-4 border-slate-100 bg-slate-50 text-center font-black text-4xl text-slate-900 focus-visible:border-emerald-500 transition-all shadow-inner" 
                      />
                    </div>
                    {efectivoFisico && (
                      <div className={`p-6 rounded-[2rem] border-2 text-center shadow-sm animate-in fade-in slide-in-from-top-4 ${parseFloat(efectivoFisico) === estadoCaja.totalEnCajon ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                        <p className="text-[10px] font-black uppercase mb-1 opacity-70">Diferencia con Sistema</p>
                        {(() => {
                          const dif = parseFloat(efectivoFisico) - estadoCaja.totalEnCajon;
                          if (dif === 0) return <p className="text-2xl font-black italic">CAJA CUADRADA ✓</p>;
                          return <p className="text-2xl font-black italic">{dif > 0 ? `SOBRA: $${dif.toLocaleString()}` : `FALTA: $${Math.abs(dif).toLocaleString()}`}</p>;
                        })()}
                      </div>
                    )}
                    <div className="pt-6 border-t border-slate-100">
                      <Button 
                        onClick={() => { if (!efectivoFisico) return toast.error("Ingresá el monto contado."); setCierreModal(true); }} 
                        className="w-full h-20 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base rounded-[1.5rem] shadow-xl shadow-red-500/20 transition-transform active:scale-95"
                      >
                        <Lock size={20} className="mr-3"/> Cierre de Turno
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALES */}
      <Dialog open={movimientoModal} onOpenChange={setMovimientoModal}>
        <DialogContent className="sm:max-w-[450px] bg-white rounded-[3rem] border-none shadow-2xl p-8 outline-none">
          <DialogHeader><DialogTitle className="text-3xl font-black italic uppercase">{nuevoMovimiento.type === 'GASTO' ? "Registrar Gasto" : "Pase a Bóveda"}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Monto del Movimiento</Label>
              <Input type="number" placeholder="0.00" value={nuevoMovimiento.amount} onChange={e => setNuevoMovimiento({...nuevoMovimiento, amount: e.target.value})} className="h-16 rounded-2xl border-2 font-black text-2xl px-6"/>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Descripción / Concepto</Label>
              <Input placeholder="Ej: Pago de limpieza, artículos oficina..." value={nuevoMovimiento.description} onChange={e => setNuevoMovimiento({...nuevoMovimiento, description: e.target.value})} className="h-14 rounded-2xl border-2 font-bold text-lg px-6"/>
            </div>
            <Button onClick={handleGuardarMovimiento} disabled={loading} className="w-full h-16 bg-slate-900 text-white font-black uppercase rounded-2xl shadow-lg transition-all hover:bg-black active:scale-95">Confirmar Operación</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cierreModal} onOpenChange={setCierreModal}>
        <DialogContent className="sm:max-w-[450px] bg-white rounded-[3rem] border-none shadow-2xl p-8 outline-none">
          <DialogHeader><DialogTitle className="text-3xl font-black italic uppercase text-red-600">Finalizar Turno</DialogTitle></DialogHeader>
          <div className="py-2 space-y-6">
            <div className="bg-slate-50 p-8 rounded-3xl text-center border-2 border-slate-100">
              <p className="text-xs font-black uppercase text-slate-400 mb-2 italic">Efectivo Físico a Resguardar</p>
              <p className="text-5xl font-black italic text-slate-900 tracking-tighter">${parseFloat(efectivoFisico || "0").toLocaleString('es-AR')}</p>
            </div>
            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Observaciones de Cierre</Label>
               <Input placeholder="Opcional..." value={notasCierre} onChange={e => setNotasCierre(e.target.value)} className="h-14 rounded-2xl border-2 font-bold px-6"/>
            </div>
            <Button onClick={handleCerrarCaja} disabled={loading} className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black uppercase rounded-2xl shadow-xl transition-all active:scale-95">Confirmar Cierre Final</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!saldoSeleccionado} onOpenChange={(open) => !open && setSaldoSeleccionado(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white rounded-[2.5rem] p-8 outline-none shadow-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Cobrar Saldo Pendiente</DialogTitle></DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 shadow-inner">
              <p className="text-xs font-black uppercase text-slate-400 mb-1">Paciente</p>
              <p className="text-xl font-black uppercase text-slate-800 leading-tight">{saldoSeleccionado?.order?.patient?.lastName}, {saldoSeleccionado?.order?.patient?.firstName}</p>
              <p className="text-4xl font-black text-emerald-600 italic mt-4 tracking-tighter">${saldoSeleccionado?.amount.toLocaleString('es-AR')}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Método de Cobro</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger className="h-14 font-black uppercase rounded-2xl border-2 px-6"><SelectValue placeholder="Seleccionar método" /></SelectTrigger>
                <SelectContent className="rounded-xl border-2 font-black uppercase italic">
                  <SelectItem value="EFECTIVO">💵 Efectivo</SelectItem>
                  <SelectItem value="MERCADOPAGO">📱 MercadoPago</SelectItem>
                  <SelectItem value="TARJETA_DEBITO">💳 Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCobrarSaldo} disabled={loading} className="w-full h-16 bg-emerald-600 text-white font-black uppercase rounded-2xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95">Confirmar Cobro ✓</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}