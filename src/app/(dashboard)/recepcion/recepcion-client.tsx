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
  registrarArqueoParcial,
} from "@/actions/caja"
import { getCurrentSession } from "@/actions/auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import {
  UserPlus, Wallet, Clock, Lock, ShieldCheck,
  Banknote, Vault, MinusCircle, Trash2, Calculator, LayoutGrid,
  Send, RefreshCw, Plus, ChevronRight, ChevronDown, MessageSquare, CheckCircle, X,
  Search, FileInput, Stethoscope
} from "lucide-react"
import { getTickets, replyTicket, closeTicket } from "@/actions/tickets"
import { findDerivacion, markDerivacionCargada } from "@/actions/derivaciones"

export default function RecepcionClient({ branches, dentists, obrasSociales, procedures, saldos }: any) {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"NUEVA_ORDEN" | "ORDENES" | "CAJA" | "SALDOS" | "MENSAJES">("NUEVA_ORDEN")
  const [resetTrigger, setResetTrigger] = useState(0)

  // Búsqueda de derivaciones médicas
  const [derivSearch, setDerivSearch] = useState("")
  const [derivResult, setDerivResult] = useState<any>(null)
  const [loadingDeriv, setLoadingDeriv] = useState(false)
  const [prefillData, setPrefillData] = useState<any>(null)

  // Tickets
  const [tickets, setTickets] = useState<any[]>([])
  const [ticketFilter, setTicketFilter] = useState<"ABIERTO" | "RESPONDIDO" | "CERRADO">("ABIERTO")
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [openTicketCount, setOpenTicketCount] = useState(0)

  const [branchId, setBranchId] = useState<string | null>(null)
  const [userName, setUserName] = useState("Recepcionista")
  const [loading, setLoading] = useState(false)

  const [saldoSeleccionado, setSaldoSeleccionado] = useState<any>(null)
  const [metodoPago, setMetodoPago] = useState<string>("EFECTIVO")

  const [dailyOrderCount, setDailyOrderCount] = useState(0)
  const [estadoCaja, setEstadoCaja] = useState<any>(null)
  const [cargandoCaja, setCargandoCaja] = useState(true)
  const [movimientoModal, setMovimientoModal] = useState(false)
  const [nuevoMovimiento, setNuevoMovimiento] = useState({ type: "GASTO", amount: "", description: "" })

  const [efectivoFisico, setEfectivoFisico] = useState<string>("")
  const [cierreModal, setCierreModal] = useState(false)
  const [totalEfectivoCierre, setTotalEfectivoCierre] = useState(0)
  const [notasCierre, setNotasCierre] = useState("")
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null)
  const [guardandoParcial, setGuardandoParcial] = useState(false)

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

  // Cargar contador de tickets abiertos al inicio
  useEffect(() => {
    getTickets("ABIERTO").then(res => {
      if (res.success) setOpenTicketCount((res.data as any[]).length)
    })
  }, [])

  // Cargar tickets al entrar al tab
  useEffect(() => {
    if (activeTab === "MENSAJES") cargarTickets(ticketFilter)
  }, [activeTab, ticketFilter])

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

  const cargarTickets = async (status: "ABIERTO" | "RESPONDIDO" | "CERRADO" = "ABIERTO") => {
    setLoadingTickets(true)
    const res = await getTickets(status)
    if (res.success) {
      setTickets(res.data as any[])
      if (status === "ABIERTO") setOpenTicketCount((res.data as any[]).length)
    }
    setLoadingTickets(false)
  }

  const handleReply = async (ticketId: string) => {
    const reply = replyText[ticketId]?.trim()
    if (!reply) return toast.error("Escribí una respuesta")
    setReplyingId(ticketId)
    const res = await replyTicket(ticketId, reply, userName)
    if (res.success) {
      toast.success("Respuesta enviada ✓")
      setReplyText(prev => ({ ...prev, [ticketId]: "" }))
      cargarTickets(ticketFilter)
    } else toast.error("Error al responder")
    setReplyingId(null)
  }

  const handleCloseTicket = async (ticketId: string) => {
    await closeTicket(ticketId)
    cargarTickets(ticketFilter)
  }

  const handleBuscarDerivacion = async () => {
    if (!derivSearch || derivSearch.length !== 6) return toast.error("El código de derivación tiene 6 dígitos")
    setLoadingDeriv(true)
    setDerivResult(null)
    const res = await findDerivacion(derivSearch)
    if (res.success) {
      setDerivResult(res.data)
    } else {
      toast.error(res.error)
    }
    setLoadingDeriv(false)
  }

  const handleUsarDerivacion = async () => {
    if (!derivResult) return
    setPrefillData(derivResult)
    await markDerivacionCargada(derivResult.prescriptionCode)
    setDerivResult(null)
    setDerivSearch("")
    toast.success(`Derivación #${derivResult.prescriptionCode} cargada en el formulario`)
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

  // Helper para los botones del sidebar
  const navBtn = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    active: boolean,
    activeClass: string,
    badge?: number
  ) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
        active ? `${activeClass} text-white shadow-md` : 'text-slate-400 hover:bg-neutral-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="flex-1 uppercase tracking-wide text-xs">{label}</span>
      {badge ? (
        <span className="bg-brand-500 text-white text-xs font-black px-2.5 py-1 rounded-full min-w-[26px] text-center leading-none">{badge}</span>
      ) : active ? (
        <ChevronRight size={14} className="opacity-60" />
      ) : null}
    </button>
  )

  return (
    <div className="flex h-full min-h-screen">

      {/* ===== SIDEBAR IZQUIERDO ===== */}
      <aside className="w-52 shrink-0 bg-neutral-900 flex flex-col sticky top-0 h-screen overflow-hidden hide-on-print">

        {/* Branding */}
        <div className="px-5 py-5 border-b border-slate-800">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Módulo</p>
          <p className="text-base font-black text-white uppercase tracking-tight">Recepción</p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{nombreSedeActual}</p>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navBtn("Nueva Orden", <UserPlus size={16}/>, () => { setActiveTab("NUEVA_ORDEN"); setResetTrigger(prev=>prev+1); }, activeTab === "NUEVA_ORDEN", "bg-brand-700")}
          {navBtn("Órdenes", <LayoutGrid size={16}/>, () => setActiveTab("ORDENES"), activeTab === "ORDENES", "bg-slate-700", dailyOrderCount || undefined)}
          {navBtn("Caja", <Banknote size={16}/>, () => setActiveTab("CAJA"), activeTab === "CAJA", "bg-emerald-700")}
          {navBtn("Saldos", <Wallet size={16}/>, () => setActiveTab("SALDOS"), activeTab === "SALDOS", "bg-brand-800", saldosFiltrados.length || undefined)}
          {navBtn("Mensajes", <MessageSquare size={16}/>, () => setActiveTab("MENSAJES"), activeTab === "MENSAJES", "bg-brand-700", openTicketCount || undefined)}

          <div className="pt-2 border-t border-slate-800 mt-2">
            {navBtn("Entregas", <Send size={16}/>, () => router.push("/entregas"), false, "bg-slate-700")}
          </div>
        </nav>

        {/* Footer del sidebar */}
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Operador</p>
          <p className="text-sm font-black text-white uppercase mt-0.5 truncate">{userName}</p>
        </div>
      </aside>

      {/* ===== ÁREA DE CONTENIDO ===== */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-4 max-w-[1400px] mx-auto">

      {activeTab === "MENSAJES" && (
        <div className="max-w-4xl animate-in fade-in duration-300 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-2">
              <MessageSquare className="text-brand-600" size={24}/> Mensajes de Odontólogos
            </h2>
            <button onClick={() => cargarTickets(ticketFilter)} className="text-slate-400 hover:text-slate-700 transition-colors">
              <RefreshCw size={16}/>
            </button>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
            {(["ABIERTO", "RESPONDIDO", "CERRADO"] as const).map(s => {
              const labels = { ABIERTO: "Pendientes", RESPONDIDO: "Respondidos", CERRADO: "Cerrados" }
              return (
                <button key={s} onClick={() => setTicketFilter(s)}
                  className={`px-4 py-2 rounded-xl font-black uppercase text-xs transition-all ${ticketFilter === s ? 'bg-white text-slate-900 shadow-md border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                  {labels[s]}
                  {s === "ABIERTO" && openTicketCount > 0 && <span className="ml-1.5 bg-brand-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{openTicketCount}</span>}
                </button>
              )
            })}
          </div>

          {loadingTickets ? (
            <div className="text-center py-20 font-black uppercase text-slate-400 animate-pulse">Cargando...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
              <MessageSquare size={48} className="mx-auto text-slate-200 mb-4"/>
              <p className="font-black uppercase text-slate-400">No hay mensajes {ticketFilter === "ABIERTO" ? "pendientes" : ticketFilter === "RESPONDIDO" ? "respondidos" : "cerrados"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket: any) => {
                const subjectLabels: Record<string, string> = {
                  ESTUDIO_FALTANTE: '📁 Falta subir un estudio',
                  ERROR_DATOS: '✏️ Error en datos de paciente',
                  CONSULTA_TECNICA: '🔧 Consulta técnica',
                  OTROS: '💬 Otra consulta'
                }
                return (
                  <div key={ticket.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-md overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-slate-100">
                      <div>
                        <p className="font-black uppercase text-slate-900 text-sm">Dr. {ticket.dentist?.lastName}, {ticket.dentist?.firstName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{subjectLabels[ticket.subject] || ticket.subject}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{new Date(ticket.createdAt).toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                        {ticket.status === "RESPONDIDO" && (
                          <button onClick={() => handleCloseTicket(ticket.id)} title="Cerrar ticket" className="text-slate-300 hover:text-slate-500 transition-colors">
                            <X size={16}/>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mensaje */}
                    <div className="p-5 space-y-4">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1.5">Mensaje</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{ticket.message}</p>
                      </div>

                      {/* Respuesta existente */}
                      {ticket.reply && (
                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                          <p className="text-[10px] font-black uppercase text-emerald-600 mb-1.5">Tu respuesta · {ticket.repliedBy}</p>
                          <p className="text-sm text-emerald-900 leading-relaxed">{ticket.reply}</p>
                        </div>
                      )}

                      {/* Input de respuesta (solo tickets abiertos o para re-responder) */}
                      {ticket.status !== "CERRADO" && (
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Escribir respuesta..."
                            value={replyText[ticket.id] || ""}
                            onChange={e => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === "Enter") handleReply(ticket.id) }}
                            className="flex-1 h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 transition-all"
                          />
                          <button
                            onClick={() => handleReply(ticket.id)}
                            disabled={replyingId === ticket.id}
                            className="h-11 px-5 bg-brand-600 hover:bg-brand-700 text-white font-black uppercase text-xs rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Send size={14}/> {replyingId === ticket.id ? '...' : 'Enviar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {(activeTab === "NUEVA_ORDEN" || activeTab === "ORDENES") && (
        <div className="animate-in fade-in duration-500 space-y-4">

          {/* Banner búsqueda de derivación */}
          {activeTab === "NUEVA_ORDEN" && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileInput size={16} className="text-indigo-600 shrink-0" />
                <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Derivación Médica</p>
                <span className="text-[10px] text-indigo-400 font-semibold">— ¿El paciente trae un número de derivación?</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Código de 6 dígitos (ej: 482931)"
                  value={derivSearch}
                  onChange={e => { setDerivSearch(e.target.value.replace(/\D/g, "")); setDerivResult(null) }}
                  onKeyDown={e => e.key === "Enter" && handleBuscarDerivacion()}
                  className="h-9 text-sm max-w-xs font-mono tracking-widest"
                  maxLength={6}
                />
                <Button onClick={handleBuscarDerivacion} disabled={loadingDeriv} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  {loadingDeriv ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                  <span className="ml-1.5">Buscar</span>
                </Button>
              </div>

              {derivResult && (
                <div className="mt-3 bg-white rounded-xl border border-indigo-200 p-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">N° {derivResult.prescriptionCode}</span>
                        <span className="text-[10px] text-slate-400">{new Date(derivResult.createdAt).toLocaleDateString('es-AR')}</span>
                      </div>
                      <p className="font-black text-slate-800 text-sm mt-1">{derivResult.patientApellido}, {derivResult.patientNombre}</p>
                      {derivResult.patientDni && <p className="text-xs text-slate-500">DNI: {derivResult.patientDni}</p>}
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Stethoscope size={11} /> Dr/a. {derivResult.dentist.lastName}, {derivResult.dentist.firstName}
                        {derivResult.dentist.matriculaProv && ` — MP: ${derivResult.dentist.matriculaProv}`}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(derivResult.procedures as any[]).map((p: any, i: number) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">
                            {p.procName}{p.teeth?.length ? ` (${p.teeth.join(', ')})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button onClick={handleUsarDerivacion} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold whitespace-nowrap">
                        <CheckCircle size={13} className="mr-1" /> Usar datos
                      </Button>
                      <Button onClick={() => { setDerivResult(null); setDerivSearch("") }} size="sm" variant="ghost" className="text-slate-400 text-xs">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <OrderForm
            branches={branches}
            dentists={dentists}
            obrasSociales={obrasSociales}
            procedures={procedures}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            resetTrigger={resetTrigger}
            onOrderCountChange={setDailyOrderCount}
            prefillData={prefillData}
            onPrefillUsed={() => setPrefillData(null)}
          />
        </div>
      )}

      {activeTab === "SALDOS" && (
        <div className="max-w-4xl animate-in fade-in duration-300">
           <Card className="border-none shadow-lg rounded-[2.5rem] bg-white border-t-8 border-brand-700 p-8">
              <h3 className="text-3xl font-black uppercase italic text-slate-900 mb-8 flex items-center gap-3"><Clock size={32} className="text-brand-700"/> Saldos Pendientes</h3>
              <div className="space-y-4">
                {saldosFiltrados.length === 0 ? <p className="text-center py-10 text-slate-400 font-bold uppercase">No hay deudas en esta sede</p> : 
                  saldosFiltrados.map((s: any) => (
                    <div key={s.id} className="bg-slate-50 p-5 rounded-2xl flex justify-between items-center border border-slate-200">
                       <div><p className="text-lg font-black uppercase text-slate-800">{s.order?.patient?.lastName}, {s.order?.patient?.firstName}</p><p className="text-xs font-bold text-slate-500 uppercase">DNI: {s.order?.patient?.dni}</p></div>
                       <div className="text-right"><p className="text-3xl font-black text-brand-600 italic">${s.amount.toLocaleString('es-AR')}</p><Button onClick={() => setSaldoSeleccionado(s)} className="mt-2 bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs h-10 px-6 rounded-xl">Ingresar Pago</Button></div>
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
          ) : (() => {
            const methodConfig: Record<string, { label: string; color: string; icon: string }> = {
              EFECTIVO: { label: 'Efectivo', color: 'emerald', icon: '💵' },
              DEBITO: { label: 'Débito', color: 'blue', icon: '💳' },
              TARJETA_DEBITO: { label: 'Débito', color: 'blue', icon: '💳' },
              TARJETA_CREDITO: { label: 'Crédito', color: 'violet', icon: '💳' },
              TRANSFERENCIA: { label: 'Transferencia', color: 'purple', icon: '🏦' },
              MERCADOPAGO: { label: 'MercadoPago', color: 'sky', icon: '📱' },
            };
            const pagosPorMetodo = estadoCaja.pagosPorMetodo || {};
            const totalesPorMetodo = estadoCaja.totalesPorMetodo || {};
            const methodsWithPayments = Object.keys(pagosPorMetodo).filter(m => pagosPorMetodo[m]?.length > 0);
            return (
            <div className="grid grid-cols-12 gap-6 items-start">
              {/* ===== COLUMNA IZQUIERDA ===== */}
              <div className="col-span-12 lg:col-span-8 space-y-5">

                {/* Header de la caja */}
                <Card className="border-none shadow-lg rounded-[2.5rem] bg-white border border-slate-100 p-7">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-7">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-3"><Banknote className="text-emerald-500" size={34}/> Caja</h2>
                        <Button
                          onClick={() => cargarCaja(branchId!)}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-black uppercase text-xs h-10 px-4 rounded-xl gap-2 shadow-none border-0 transition-all active:scale-95"
                          title="Actualizar montos"
                        >
                          <RefreshCw size={15} className={cargandoCaja ? "animate-spin" : ""} /> Actualizar
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black uppercase italic">Turno Abierto</span>
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Apertura: {new Date(estadoCaja.caja.createdAt).toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'})}hs</span>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <Button onClick={() => { setNuevoMovimiento({type: "GASTO", amount: "", description: ""}); setMovimientoModal(true); }} className="flex-1 bg-white border-2 border-slate-200 text-slate-900 font-black uppercase text-xs h-12 px-5 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors">Nuevo Gasto</Button>
                      <Button onClick={() => { setNuevoMovimiento({type: "A_CAJA_FUERTE", amount: "", description: ""}); setMovimientoModal(true); }} className="flex-1 bg-slate-900 text-white font-black uppercase text-xs h-12 px-5 rounded-2xl shadow-lg hover:bg-slate-800 transition-transform active:scale-95">Retirar</Button>
                    </div>
                  </div>

                  {/* 4 cards de totales por método */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50">
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-emerald-700 opacity-80">Efectivo</p>
                      <p className="text-xl font-black text-emerald-700">${(totalesPorMetodo['EFECTIVO'] || 0).toLocaleString('es-AR')}</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50">
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-blue-700 opacity-80">Débito</p>
                      <p className="text-xl font-black text-blue-700">${((totalesPorMetodo['DEBITO'] || 0) + (totalesPorMetodo['TARJETA_DEBITO'] || 0)).toLocaleString('es-AR')}</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50">
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-purple-700 opacity-80">Transferencia</p>
                      <p className="text-xl font-black text-purple-700">${(totalesPorMetodo['TRANSFERENCIA'] || 0).toLocaleString('es-AR')}</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-sky-100 bg-sky-50">
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-sky-700 opacity-80">MercadoPago</p>
                      <p className="text-xl font-black text-sky-700">${(totalesPorMetodo['MERCADOPAGO'] || 0).toLocaleString('es-AR')}</p>
                    </div>
                  </div>

                  {/* Resumen efectivo físico */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { t: "Inicio", v: Number(estadoCaja.caja.startBalance), c: "text-slate-500" },
                      { t: "Cobros Efectivo", v: estadoCaja.ingresosEfectivo, c: "text-emerald-600" },
                      { t: "Salidas", v: estadoCaja.salidasEfectivo, c: "text-brand-600" },
                      { t: "EN CAJÓN", v: estadoCaja.totalEnCajon, c: "text-slate-900 font-black", bg: "bg-emerald-50 border-emerald-200 shadow-inner" }
                    ].map((item, i) => (
                      <div key={i} className={`p-4 rounded-2xl border border-slate-100 bg-slate-50/50 ${item.bg || ''}`}>
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70 italic">{item.t}</p>
                        <p className={`text-lg font-bold ${item.c}`}>${item.v.toLocaleString('es-AR')}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Cobros del día - acordeones por método */}
                {methodsWithPayments.length > 0 && (
                  <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-7">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 border-b border-slate-50 pb-2">Cobros del Día</h4>
                    <div className="space-y-2">
                      {methodsWithPayments.map((method) => {
                        const cfg = methodConfig[method] || { label: method, color: 'slate', icon: '💰' };
                        const pagos = pagosPorMetodo[method] || [];
                        const total = totalesPorMetodo[method] || 0;
                        const isExpanded = expandedMethod === method;
                        const colorMap: Record<string, string> = {
                          emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                          blue: 'bg-blue-50 border-blue-200 text-blue-800',
                          purple: 'bg-purple-50 border-purple-200 text-purple-800',
                          sky: 'bg-sky-50 border-sky-200 text-sky-800',
                          slate: 'bg-slate-50 border-slate-200 text-slate-800',
                        };
                        const rowClass = colorMap[cfg.color] || colorMap.slate;
                        return (
                          <div key={method} className={`rounded-2xl border overflow-hidden transition-all ${isExpanded ? rowClass : 'bg-slate-50 border-slate-100'}`}>
                            <button
                              onClick={() => setExpandedMethod(isExpanded ? null : method)}
                              className="w-full flex items-center gap-3 px-5 py-4 text-left"
                            >
                              <span className="text-xl">{cfg.icon}</span>
                              <span className="flex-1 font-black uppercase text-sm tracking-wide">{cfg.label}</span>
                              <span className="font-black text-base mr-3">${total.toLocaleString('es-AR')}</span>
                              <span className="text-[10px] font-bold bg-white/60 px-2 py-0.5 rounded-full mr-2">{pagos.length} cobro{pagos.length !== 1 ? 's' : ''}</span>
                              <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpanded && (
                              <div className="px-5 pb-4 space-y-2">
                                {pagos.map((p: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center bg-white/70 px-4 py-2.5 rounded-xl border border-white/80">
                                    <span className="font-bold text-sm uppercase">{p.patient}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="font-black text-base">${p.amount.toLocaleString('es-AR')}</span>
                                      <span className="text-[10px] font-bold opacity-60">{new Date(p.time).toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'})}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Movimientos manuales */}
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-7">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 border-b border-slate-50 pb-2">Operaciones de Hoy</h4>
                  <div className="space-y-2">
                    {estadoCaja.movimientos.length === 0 ? <p className="text-center py-8 text-slate-300 font-bold uppercase text-xs">Sin movimientos manuales</p> :
                      estadoCaja.movimientos.map((m: any) => (
                        <div key={m.id} className="flex justify-between items-center bg-slate-50 px-4 py-3.5 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${m.type === 'A_CAJA_FUERTE' ? 'bg-amber-100 text-amber-600' : m.type === 'INGRESO' ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-100 text-brand-600'}`}>
                              {m.type === 'A_CAJA_FUERTE' ? <Vault size={17}/> : m.type === 'INGRESO' ? <Plus size={17}/> : <MinusCircle size={17}/>}
                            </div>
                            <div>
                              <p className="text-sm font-black uppercase text-slate-800 leading-none">{m.description}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{m.type.replace(/_/g, ' ')} • {new Date(m.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className={`text-xl font-black ${m.type === 'INGRESO' ? 'text-emerald-600' : 'text-brand-600'}`}>
                              {m.type === 'INGRESO' ? '+' : '-'}${Number(m.amount).toLocaleString('es-AR')}
                            </p>
                            <button onClick={() => handleBorrarMovimiento(m.id)} className="text-slate-300 hover:text-brand-600 transition-colors p-1.5 opacity-0 group-hover:opacity-100"><Trash2 size={17}/></button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </Card>
              </div>

              {/* ===== COLUMNA DERECHA (arqueo y cierre) ===== */}
              <div className="col-span-12 lg:col-span-4 sticky top-6">
                <Card className="border-none shadow-xl rounded-[3rem] bg-white border-2 border-slate-100 overflow-hidden">

                  {/* Header del panel */}
                  <div className="bg-slate-900 px-7 py-5 flex items-center gap-3">
                    <Calculator size={20} className="text-emerald-400"/>
                    <h3 className="text-base font-black uppercase tracking-widest text-white">Arqueo Físico</h3>
                  </div>

                  <div className="p-7 space-y-5">
                    {/* Sistema vs cajón */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 px-5 py-4 flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-slate-400">Sistema dice</span>
                      <span className="text-2xl font-black text-slate-800">${estadoCaja.totalEnCajon.toLocaleString('es-AR')}</span>
                    </div>

                    {/* Input de conteo */}
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-1.5 block">Tu conteo ($)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={efectivoFisico}
                        onChange={e => setEfectivoFisico(e.target.value)}
                        className="h-16 rounded-2xl border-2 border-slate-200 bg-slate-50 text-center font-black text-3xl text-slate-900 focus-visible:border-emerald-500 transition-all"
                      />
                    </div>

                    {/* Diferencia */}
                    {efectivoFisico && (() => {
                      const dif = parseFloat(efectivoFisico) - estadoCaja.totalEnCajon;
                      const ok = dif === 0;
                      return (
                        <div className={`px-5 py-4 rounded-2xl border-2 text-center animate-in fade-in slide-in-from-top-2 ${ok ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                          <p className="text-[10px] font-black uppercase mb-1 opacity-60">{ok ? 'Estado' : 'Diferencia'}</p>
                          <p className={`text-xl font-black ${ok ? 'text-emerald-700' : 'text-amber-800'}`}>
                            {ok ? 'CUADRADA ✓' : dif > 0 ? `SOBRA $${Math.abs(dif).toLocaleString('es-AR')}` : `FALTA $${Math.abs(dif).toLocaleString('es-AR')}`}
                          </p>
                        </div>
                      );
                    })()}

                    {/* Botones */}
                    <div className="space-y-3 pt-2">
                      <Button
                        onClick={async () => {
                          if (!efectivoFisico) return toast.error("Ingresá el monto contado.");
                          setGuardandoParcial(true);
                          const res = await registrarArqueoParcial(branchId!, parseFloat(efectivoFisico), "");
                          if (res.success) toast.success("Arqueo guardado ✓");
                          else toast.error(res.error);
                          setGuardandoParcial(false);
                        }}
                        disabled={guardandoParcial || !efectivoFisico}
                        className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 disabled:opacity-40"
                      >
                        <Calculator size={15} className="mr-2"/> Guardado Parcial
                      </Button>
                      <Button
                        onClick={() => { if (!efectivoFisico) return toast.error("Ingresá el monto contado."); setCierreModal(true); }}
                        className="w-full h-16 bg-brand-600 hover:bg-brand-700 text-white font-black uppercase tracking-widest text-base rounded-2xl shadow-xl shadow-brand-500/20 transition-transform active:scale-95"
                      >
                        <Lock size={18} className="mr-2"/> Cierre de Turno
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            );
          })()}
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
          <DialogHeader><DialogTitle className="text-3xl font-black italic uppercase text-brand-600">Finalizar Turno</DialogTitle></DialogHeader>
          <div className="py-2 space-y-6">
            <div className="bg-slate-50 p-8 rounded-3xl text-center border-2 border-slate-100">
              <p className="text-xs font-black uppercase text-slate-400 mb-2 italic">Efectivo Físico a Resguardar</p>
              <p className="text-5xl font-black italic text-slate-900 tracking-tighter">${parseFloat(efectivoFisico || "0").toLocaleString('es-AR')}</p>
            </div>
            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Observaciones de Cierre</Label>
               <Input placeholder="Opcional..." value={notasCierre} onChange={e => setNotasCierre(e.target.value)} className="h-14 rounded-2xl border-2 font-bold px-6"/>
            </div>
            <Button onClick={handleCerrarCaja} disabled={loading} className="w-full h-16 bg-brand-600 hover:bg-brand-700 text-white font-black uppercase rounded-2xl shadow-xl transition-all active:scale-95">Confirmar Cierre Final</Button>
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

        </div>{/* /max-w container */}
      </div>{/* /content area */}
    </div> /* /flex layout */
  )
}