"use client"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Clock, Play, CheckCircle, RefreshCw, LogOut,
  Phone, Cake, Send, Hash, Calendar, MapPin, Mail,
  MessageCircle, AlertCircle, Copy, UploadCloud, Image as ImageIcon, Loader2, Search, Trash2, AlertTriangle, Timer, Printer, Bell, X, UserCog, Plus, Pencil
} from "lucide-react"
import ToothIcon from "@/components/icons/tooth-icon"
import RadiationIcon from "@/components/icons/radiation-icon"
import { logoutUser, getCurrentSession } from "@/actions/auth"
import { updateOrderStatusAction } from "@/actions/orders"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getPresignedUrl, saveImageToOrder, deleteImageFromOrder, saveExternalLinkToOrder, updateImageLabel } from "@/actions/storage"
import { getTickets, replyTicket } from "@/actions/tickets"
import { assignTechnicianToOrder, saveTechnicianProfile, deleteTechnicianProfile } from "@/actions/technicians"
import { Input } from "@/components/ui/input"

export default function TecnicoClient({ initialOrders, branches = [], technicianProfiles = [] }: any) {
  const [orders, setOrders] = useState(initialOrders)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [session, setSession] = useState<{ userName: string, branchId: string } | null>(null)
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [prevOrderIds, setPrevOrderIds] = useState<string[]>([])
  const router = useRouter()

  const [activeFilter, setActiveFilter] = useState<'TODOS' | 'EN_ESPERA' | 'ATENDIENDO' | 'REPETIR'>('TODOS')
  const [currentTime, setCurrentTime] = useState(new Date())

  const [uploadingOrder, setUploadingOrder] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [pendingUpload, setPendingUpload] = useState<{orderId: string, items: {file: File, label: string}[]} | null>(null)
  const [editingLabel, setEditingLabel] = useState<{orderId: string, url: string, value: string} | null>(null)

  // Mensajes / Tickets
  const [showTicketsModal, setShowTicketsModal] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])
  const [ticketFilter, setTicketFilter] = useState<'ABIERTO' | 'RESPONDIDO' | 'CERRADO'>('ABIERTO')
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [openTicketCount, setOpenTicketCount] = useState(0)
  const [externalLinks, setExternalLinks] = useState<Record<string, string>>({})

  // Técnicos
  const [technicians, setTechnicians] = useState<any[]>(technicianProfiles)
  const [showTechModal, setShowTechModal] = useState(false)
  const [newTechName, setNewTechName] = useState("")
  const [savingTech, setSavingTech] = useState(false)

  useEffect(() => {
    async function initSession() {
      try {
        const userSession = await getCurrentSession();
        const savedBranch = localStorage.getItem("radiologia-branch");
        
        if (userSession) {
          setSession({
            userName: userSession.name || userSession.username || "OPERADOR",
            branchId: savedBranch || ""
          });

          if (!savedBranch) setShowBranchModal(true);
        }
      } catch (error) { console.error("Error cargando sesión:", error); }
    }
    initSession();
  }, []);

  useEffect(() => {
    const dataInterval = setInterval(() => router.refresh(), 30000)
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000) 
    return () => { clearInterval(dataInterval); clearInterval(timeInterval); }
  }, [router])

  useEffect(() => {
    const currentBranchOrders = initialOrders.filter((o: any) => o.branchId === session?.branchId);
    const currentIds = currentBranchOrders.map((o: any) => o.id);

    if (prevOrderIds.length > 0) {
      const hasNewOrder = currentIds.some((id: string) => !prevOrderIds.includes(id));
      if (hasNewOrder) {
        const audio = new Audio('/campana.mp3');
        audio.play().catch(e => console.log("El navegador bloqueó el autoplay", e));
        toast.info("¡Nuevo paciente en sala de espera!", { icon: "🔔" });
      }
    }

    setPrevOrderIds(currentIds);
    setOrders(initialOrders);
  }, [initialOrders, session?.branchId]);

  const handleAssignTechnician = async (orderId: string, techId: string) => {
    const val = techId === "NONE" ? null : techId
    await assignTechnicianToOrder(orderId, val)
    setOrders((prev: any[]) => prev.map(o => o.id === orderId ? { ...o, technicianId: val, technician: technicians.find(t => t.id === val) || null } : o))
  }

  const handleSaveTech = async () => {
    if (!newTechName.trim()) return
    setSavingTech(true)
    const res = await saveTechnicianProfile({ name: newTechName.trim(), branchId: session?.branchId || "" })
    if (res.success) {
      setNewTechName("")
      router.refresh()
      toast.success("Técnico agregado ✓")
    } else toast.error("Error al guardar")
    setSavingTech(false)
  }

  const handleDeleteTech = async (id: string) => {
    await deleteTechnicianProfile(id)
    setTechnicians(prev => prev.filter(t => t.id !== id))
    toast.success("Técnico eliminado")
  }

  const handleSelectBranch = (branchId: string) => {
    localStorage.setItem("radiologia-branch", branchId);
    setShowBranchModal(false);
    window.location.reload();
  };

  const handleLogout = async () => {
    if (confirm("¿Cerrar sesión y volver al inicio?")) {
      localStorage.removeItem("radiologia-branch");
      await logoutUser();
      router.push("/login");
    }
  }

  const handleStatus = async (orderId: string, status: any) => {
    setLoadingId(orderId)
    const res = await updateOrderStatusAction(orderId, status)
    
    if (res.success) {
      if (status === 'LISTO_PARA_ENTREGA') toast.success("Estudio finalizado y enviado a entrega");
      if (status === 'EN_ATENCION') toast.info("Paciente en sala");
      if (status === 'PARA_REPETIR') toast.error("Marcado para repetición");
      
      if (status === 'LISTO_PARA_ENTREGA') {
        setOrders(orders.filter((o: any) => o.id !== orderId))
      }
      router.refresh()
    } else {
      toast.error("Error al actualizar el estado")
    }
    setLoadingId(null)
  }

  // Cargar contador de tickets al inicio
  useEffect(() => {
    getTickets('ABIERTO').then(res => {
      if (res.success) setOpenTicketCount((res.data as any[]).length)
    })
  }, [])

  useEffect(() => {
    if (showTicketsModal) cargarTickets(ticketFilter)
  }, [showTicketsModal, ticketFilter])

  const cargarTickets = async (status: 'ABIERTO' | 'RESPONDIDO' | 'CERRADO' = 'ABIERTO') => {
    setLoadingTickets(true)
    const res = await getTickets(status)
    if (res.success) {
      setTickets(res.data as any[])
      if (status === 'ABIERTO') setOpenTicketCount((res.data as any[]).length)
    }
    setLoadingTickets(false)
  }

  const handleReplyTicket = async (ticketId: string) => {
    const reply = replyText[ticketId]?.trim()
    if (!reply) return toast.error("Escribí una respuesta")
    setReplyingId(ticketId)
    const res = await replyTicket(ticketId, reply, session?.userName || 'Técnico')
    if (res.success) {
      toast.success("Respuesta enviada ✓")
      setReplyText(prev => ({ ...prev, [ticketId]: "" }))
      cargarTickets(ticketFilter)
    } else toast.error("Error al responder")
    setReplyingId(null)
  }

  const handleCopy = (text: string, label: string) => {
    if (!text || text === 'S/D') return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado ✓`);
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, orderId: string, procedures: string[]) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    // Pre-label: si hay un solo procedimiento, lo usamos como label por defecto
    const defaultLabel = procedures.length === 1 ? procedures[0] : ""
    setPendingUpload({ orderId, items: files.map(f => ({ file: f, label: defaultLabel })) })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleConfirmUpload = async () => {
    if (!pendingUpload) return
    const { orderId, items } = pendingUpload
    setUploadingOrder(orderId)
    setPendingUpload(null)
    let ok = 0, fail = 0
    for (const { file, label } of items) {
      try {
        const res = await getPresignedUrl(file.name, file.type, orderId)
        if (!res.success) throw new Error(res.error)
        const uploadRes = await fetch(res.signedUrl as string, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
        if (!uploadRes.ok) throw new Error("Fallo al subir")
        await saveImageToOrder(orderId, res.publicUrl as string, label || undefined)
        ok++
      } catch { fail++ }
    }
    setUploadingOrder(null)
    if (ok > 0) toast.success(`${ok} archivo${ok > 1 ? 's' : ''} subido${ok > 1 ? 's' : ''} ✓`)
    if (fail > 0) toast.error(`${fail} archivo${fail > 1 ? 's' : ''} fallaron`)
    router.refresh()
  }

  const handleSaveLabelEdit = async () => {
    if (!editingLabel) return
    await updateImageLabel(editingLabel.orderId, editingLabel.url, editingLabel.value)
    setEditingLabel(null)
    router.refresh()
  }

  const handleSaveLink = async (orderId: string) => {
    const link = externalLinks[orderId];
    if (!link) return;
    toast.loading("Guardando enlace...", { id: `link-${orderId}` });
    const res = await saveExternalLinkToOrder(orderId, link);
    if (res.success) toast.success("Enlace guardado correctamente", { id: `link-${orderId}` });
    else toast.error("Error al guardar el enlace", { id: `link-${orderId}` });
  };

  const getWaitTime = (createdAt: string) => {
    const diffMs = currentTime.getTime() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 0) return { text: "0 min", color: "text-emerald-500", bg: "bg-emerald-50" };
    if (diffMins <= 15) return { text: `${diffMins} min`, color: "text-emerald-600", bg: "bg-emerald-100" };
    if (diffMins <= 30) return { text: `${diffMins} min`, color: "text-amber-600", bg: "bg-amber-100 animate-pulse" };
    return { text: `${diffMins} min`, color: "text-white", bg: "bg-brand-600 animate-pulse" };
  }

  const filteredOrders = orders.filter((o: any) => {
    if (o.branchId !== session?.branchId) return false;
    if (activeFilter === 'EN_ESPERA') return o.status === 'CREADA' || o.status === 'EN_ESPERA';
    if (activeFilter === 'ATENDIENDO') return o.status === 'EN_ATENCION';
    if (activeFilter === 'REPETIR') return o.status === 'PARA_REPETIR';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      
      {/* MODAL SUBIDA MÚLTIPLE */}
      <Dialog open={!!pendingUpload} onOpenChange={open => { if (!open) setPendingUpload(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-sm flex items-center gap-2">
              <UploadCloud size={16} className="text-brand-600"/> Subir {pendingUpload?.items.length} archivo{(pendingUpload?.items.length ?? 0) > 1 ? 's' : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {pendingUpload?.items.map((item, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl border border-slate-200 p-2.5 space-y-1.5">
                <p className="text-[10px] font-black uppercase text-slate-500 truncate">{item.file.name}</p>
                <input
                  value={item.label}
                  onChange={e => setPendingUpload(p => p ? { ...p, items: p.items.map((it, i) => i === idx ? { ...it, label: e.target.value } : it) } : p)}
                  placeholder="Etiqueta (ej: Periapical Pza 14)..."
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 focus:border-brand-400 outline-none font-medium"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setPendingUpload(null)} className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-xs font-black uppercase text-slate-500 hover:bg-slate-50">Cancelar</button>
            <button onClick={handleConfirmUpload} className="flex-1 h-10 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black uppercase flex items-center justify-center gap-1.5">
              <UploadCloud size={13}/> Subir
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR ETIQUETA */}
      <Dialog open={!!editingLabel} onOpenChange={open => { if (!open) setEditingLabel(null) }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-sm">Editar etiqueta</DialogTitle>
          </DialogHeader>
          <input
            value={editingLabel?.value || ""}
            onChange={e => setEditingLabel(l => l ? { ...l, value: e.target.value } : l)}
            onKeyDown={e => e.key === "Enter" && handleSaveLabelEdit()}
            placeholder="Ej: Periapical Pza 14, Panorámica..."
            className="w-full text-sm px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none font-medium"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={() => setEditingLabel(null)} className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-xs font-black uppercase text-slate-500">Cancelar</button>
            <button onClick={handleSaveLabelEdit} className="flex-1 h-10 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black uppercase">Guardar</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL TÉCNICOS */}
      <Dialog open={showTechModal} onOpenChange={setShowTechModal}>
        <DialogContent className="sm:max-w-[400px] bg-white rounded-2xl border-t-8 border-slate-900 p-0 outline-none overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
            <DialogTitle className="text-lg font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
              <UserCog className="text-slate-700" size={20}/> Técnicos — {branches.find((b: any) => b.id === session?.branchId)?.name || "Sede"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-5 space-y-4">
            {/* Lista */}
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {technicians.filter((t: any) => t.branchId === session?.branchId).length === 0 ? (
                <p className="text-center text-xs font-bold text-slate-400 uppercase py-4">No hay técnicos cargados para esta sede</p>
              ) : technicians.filter((t: any) => t.branchId === session?.branchId).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                  <span className="text-sm font-bold uppercase text-slate-800">{t.name}</span>
                  <button onClick={() => handleDeleteTech(t.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-3">
                    <Trash2 size={15}/>
                  </button>
                </div>
              ))}
            </div>
            {/* Agregar */}
            <div className="flex gap-2 pt-1 border-t border-slate-100">
              <Input
                placeholder="Nombre del técnico..."
                value={newTechName}
                onChange={e => setNewTechName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveTech()}
                className="h-10 flex-1 font-bold border-2 uppercase"
              />
              <button onClick={handleSaveTech} disabled={savingTech || !newTechName.trim()}
                className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase disabled:opacity-40 transition-all flex items-center gap-1.5">
                <Plus size={14}/> Agregar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBranchModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[450px] bg-white rounded-3xl border-t-8 border-brand-700 p-8 outline-none">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic uppercase text-center tracking-tighter text-slate-900">Configurar Sede</DialogTitle>
            <p className="text-center text-xs font-bold uppercase text-slate-500 tracking-[0.2em] mt-2">Hola, {session?.userName} • Seleccioná tu puesto de hoy</p>
          </DialogHeader>
          <div className="grid gap-3 py-6">
            {branches.map((branch: any) => (
              <Button key={branch.id} onClick={() => handleSelectBranch(branch.id)} className="h-14 text-base font-black italic uppercase bg-slate-900 hover:bg-brand-700 text-white rounded-2xl transition-all shadow-lg group">
                <MapPin className="mr-3 group-hover:animate-bounce" size={18} /> {branch.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL MENSAJES ODONTÓLOGOS */}
      <Dialog open={showTicketsModal} onOpenChange={setShowTicketsModal}>
        <DialogContent className="sm:max-w-[580px] bg-white rounded-3xl border-t-8 border-brand-700 p-0 outline-none overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
            <DialogTitle className="text-lg font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
              <Bell className="text-brand-700" size={20}/> Mensajes de Odontólogos
            </DialogTitle>
          </DialogHeader>

          {/* Filtros */}
          <div className="flex gap-1.5 px-5 pt-4">
            {(['ABIERTO', 'RESPONDIDO', 'CERRADO'] as const).map(s => {
              const labels = { ABIERTO: 'Pendientes', RESPONDIDO: 'Respondidos', CERRADO: 'Cerrados' }
              return (
                <button key={s} onClick={() => setTicketFilter(s)}
                  className={`flex-1 py-2 rounded-xl font-black uppercase text-[10px] transition-all ${ticketFilter === s ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {labels[s]}
                  {s === 'ABIERTO' && openTicketCount > 0 && <span className="ml-1.5 bg-brand-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{openTicketCount}</span>}
                </button>
              )
            })}
          </div>

          <div className="p-5 max-h-[55vh] overflow-y-auto space-y-3">
            {loadingTickets ? (
              <div className="text-center py-16 font-bold uppercase text-slate-500 animate-pulse text-xs tracking-widest">Cargando...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-16">
                <Bell size={36} className="mx-auto text-slate-200 mb-3"/>
                <p className="font-bold uppercase text-slate-500 text-xs">No hay mensajes {ticketFilter === 'ABIERTO' ? 'pendientes' : ticketFilter === 'RESPONDIDO' ? 'respondidos' : 'cerrados'}</p>
              </div>
            ) : tickets.map((ticket: any) => {
              const subjectLabels: Record<string, string> = {
                ESTUDIO_FALTANTE: '📁 Falta subir estudio',
                ERROR_DATOS: '✏️ Error en datos',
                CONSULTA_TECNICA: '🔧 Consulta técnica',
                OTROS: '💬 Otra consulta'
              }
              return (
                <div key={ticket.id} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
                    <div>
                      <p className="text-xs font-black uppercase text-slate-800">Dr. {ticket.dentist?.lastName}, {ticket.dentist?.firstName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{subjectLabels[ticket.subject] || ticket.subject}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(ticket.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-sm text-slate-700 leading-relaxed">{ticket.message}</p>
                    {ticket.reply && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                        <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Respondido por {ticket.repliedBy}</p>
                        <p className="text-sm text-emerald-900">{ticket.reply}</p>
                      </div>
                    )}
                    {ticket.status !== 'CERRADO' && (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Escribir respuesta..."
                          value={replyText[ticket.id] || ""}
                          onChange={e => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleReplyTicket(ticket.id) }}
                          className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
                        />
                        <button
                          onClick={() => handleReplyTicket(ticket.id)}
                          disabled={replyingId === ticket.id}
                          className="h-10 px-4 bg-brand-700 hover:bg-brand-800 text-white font-black uppercase text-[10px] rounded-xl disabled:opacity-50 flex items-center gap-1.5 transition-all"
                        >
                          <Send size={12}/>{replyingId === ticket.id ? '...' : 'Enviar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl shadow-sm border-t-8 border-t-brand-700 gap-4 border border-slate-200">
        <div>
          <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter flex items-center gap-2">
            <RadiationIcon className="text-brand-700" size={28} /> Sala de Rayos
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black uppercase text-white bg-brand-700 px-3 py-1 rounded-md tracking-widest italic shadow-sm">
              SEDE: {branches.find((b:any) => b.id === session?.branchId)?.name || "---"}
            </span>
            <span className="text-xs font-bold uppercase text-slate-500 tracking-widest ml-1">• Op: {session?.userName}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button onClick={() => router.push('/entregas')} className="flex-1 md:flex-none h-9 px-6 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-black uppercase italic text-xs shadow-md border-b-[3px] border-brand-900 active:border-b-0 active:translate-y-px transition-all">
            <Send size={16} className="mr-2"/> Panel Entregas
          </Button>
          <Button variant="outline" onClick={() => setShowBranchModal(true)} className="flex-1 md:flex-none h-9 px-4 rounded-xl border-2 border-slate-200 font-black uppercase italic hover:bg-slate-900 hover:text-white transition-all text-xs">
            <MapPin size={16} className="mr-2 text-brand-700"/> Sede
          </Button>
          <button
            onClick={() => setShowTechModal(true)}
            className="relative flex-none h-9 w-10 flex items-center justify-center rounded-xl border-2 border-slate-200 text-slate-500 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all"
            title="Gestionar técnicos"
          >
            <UserCog size={18}/>
          </button>
          <button
            onClick={() => setShowTicketsModal(true)}
            className="relative flex-none h-9 w-10 flex items-center justify-center rounded-xl border-2 border-slate-200 text-slate-500 hover:bg-brand-700 hover:text-white hover:border-brand-700 transition-all"
            title="Mensajes de odontólogos"
          >
            <Bell size={18}/>
            {openTicketCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                {openTicketCount}
              </span>
            )}
          </button>
          <Button onClick={handleLogout} variant="ghost" className="text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-all h-9 w-10 p-0" title="Cerrar sesión"><LogOut size={20} /></Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-full max-w-2xl">
        <Button onClick={() => setActiveFilter('TODOS')} className={`flex-1 rounded-xl h-9 font-black uppercase text-[10px] md:text-xs transition-all ${activeFilter === 'TODOS' ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}>Todos</Button>
        <Button onClick={() => setActiveFilter('EN_ESPERA')} className={`flex-1 rounded-xl h-9 font-black uppercase text-[10px] md:text-xs transition-all ${activeFilter === 'EN_ESPERA' ? 'bg-emerald-600 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}>En Espera</Button>
        <Button onClick={() => setActiveFilter('ATENDIENDO')} className={`flex-1 rounded-xl h-9 font-black uppercase text-[10px] md:text-xs transition-all ${activeFilter === 'ATENDIENDO' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}>En Sala</Button>
        <Button onClick={() => setActiveFilter('REPETIR')} className={`flex-1 rounded-xl h-9 font-black uppercase text-[10px] md:text-xs transition-all ${activeFilter === 'REPETIR' ? 'bg-amber-500 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}>Repeticiones</Button>
      </div>

      <input type="file" accept="image/jpeg,image/png,application/pdf" multiple className="hidden" ref={fileInputRef}
        onChange={(e) => {
          if (!activeOrderId) return
          const order = orders.find((o: any) => o.id === activeOrderId)
          const procs = order?.items?.map((i: any) => i.procedure?.name).filter(Boolean) || []
          handleFileSelect(e, activeOrderId, procs)
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order: any) => {
            const waitData = getWaitTime(order.createdAt);
            const isRepetir = order.status === 'PARA_REPETIR';
            
            return (
            <Card key={order.id} className={`shadow-lg rounded-3xl overflow-hidden bg-white transition-all duration-300 flex flex-col border-t-8 ${order.status === 'EN_ATENCION' ? 'border-t-blue-600 scale-[1.02] shadow-blue-100' : isRepetir ? 'border-t-amber-500 shadow-amber-100' : 'border-t-emerald-500 hover:scale-[1.01] hover:shadow-xl'}`}>
              <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between w-full">
                       
                       <div className="flex gap-2 items-center">
                         <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest border flex items-center gap-1 ${order.status === 'EN_ATENCION' ? 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse' : isRepetir ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                          {order.status === 'EN_ATENCION' ? '● EN SALA' : isRepetir ? '⚠ REPETIR' : '● EN ESPERA'}
                         </span>
                         
                         {/* 👉 AQUÍ ESTÁ LA CORRECCIÓN EXACTA LEYENDO CODE o DAILYID */}
                         <span className="text-[10px] font-black px-2 py-1 rounded-md uppercase bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-0.5 tracking-widest" title="Número de Orden">
                           <Hash size={10} className="text-slate-400"/> {order.code || order.dailyId || order.id.slice(-5)}
                         </span>
                       </div>
                      
                      {order.status !== 'EN_ATENCION' && !isRepetir && (
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase flex items-center gap-1 ${waitData.bg} ${waitData.color}`}>
                          <Timer size={12}/> {waitData.text}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black uppercase italic text-slate-900 leading-none pt-2 tracking-tighter truncate" title={`${order.patient.lastName}, ${order.patient.firstName}`}>
                      {order.patient.lastName}, <span className="text-brand-700">{order.patient.firstName}</span>
                    </h3>
                  </div>
                </div>

                {/* INFO DEL PACIENTE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                   <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 group/copy">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <div className="flex justify-between items-center w-full overflow-hidden">
                        <span className="text-xs font-bold leading-none truncate">{order.patient.phone || 'S/D'}</span>
                        {order.patient.phone && <button onClick={() => handleCopy(order.patient.phone, 'Teléfono')} className="text-slate-300 hover:text-brand-700 transition-colors opacity-0 group-hover/copy:opacity-100"><Copy size={12} /></button>}
                      </div>
                   </div>
                   <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 group/copy">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <div className="flex justify-between items-center w-full overflow-hidden">
                        <span className="text-[10px] font-bold leading-none truncate lowercase">{order.patient.email || 'S/D'}</span>
                        {order.patient.email && <button onClick={() => handleCopy(order.patient.email, 'E-mail')} className="text-slate-300 hover:text-brand-700 transition-colors opacity-0 group-hover/copy:opacity-100"><Copy size={12} /></button>}
                      </div>
                   </div>
                </div>

                {/* OBSERVACIONES */}
                {order.notes && order.notes.trim() !== "" && (
                  <div className="bg-amber-50 p-3 rounded-xl border-l-4 border-amber-500 flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-amber-900 uppercase leading-tight">{order.notes}</p>
                  </div>
                )}

                {/* ESTUDIOS Y ARCHIVOS */}
                <div className="bg-slate-900 p-4 rounded-[1.5rem] shadow-inner text-white flex-1 flex flex-col">
                   <div className="space-y-2 mb-4">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="bg-slate-800 p-3 rounded-xl border-l-4 border-brand-700">
                          <p className="font-black uppercase text-sm tracking-tight leading-tight">{item.metadata?.customName || item.procedure.name}</p>
                          {(item.metadata?.teeth || item.teeth)?.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase">Piezas:</span>
                              {(item.metadata?.teeth || item.teeth).map((tooth: any) => <span key={tooth} className="bg-brand-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">{tooth}</span>)}
                            </div>
                          )}
                          {item.metadata?.photos?.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              <span className="text-[10px] font-black text-slate-400 uppercase block">
                                {item.metadata.photos.length} foto{item.metadata.photos.length !== 1 ? 's' : ''}
                                {item.metadata.photos.length > (item.metadata.basePhotoCount ?? 5) && (
                                  <span className="text-brand-400 ml-1">· {item.metadata.photos.length - (item.metadata.basePhotoCount ?? 5)} adicional{item.metadata.photos.length - (item.metadata.basePhotoCount ?? 5) > 1 ? 'es' : ''}</span>
                                )}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {item.metadata.photos.map((photo: string, pi: number) => (
                                  <span key={pi} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${pi >= (item.metadata.basePhotoCount ?? 5) ? 'bg-brand-700/50 text-brand-200 border border-brand-600/50' : 'bg-slate-700 text-slate-300'}`}>
                                    {photo}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                   </div>

                   <div className="mt-auto bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                     <div className="flex justify-between items-center mb-3">
                       <h4 className="font-black uppercase text-slate-300 flex items-center gap-1.5 text-[10px] tracking-widest"><ImageIcon size={12} className="text-brand-500"/> Archivos</h4>
                       <Button variant="ghost" size="sm" onClick={() => { setActiveOrderId(order.id); fileInputRef.current?.click(); }} disabled={uploadingOrder === order.id} className="h-6 text-[10px] px-2 bg-brand-700/20 text-brand-400 hover:bg-brand-700 hover:text-white font-black uppercase rounded-md">
                         {uploadingOrder === order.id ? <Loader2 size={10} className="mr-1 animate-spin"/> : <UploadCloud size={10} className="mr-1"/>} Subir
                       </Button>
                     </div>

                     {order.images && order.images.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {(order.images || []).map((imgUrl: string, idx: number) => {
                            const meta = order.imageMetadata as Record<string,string> | null
                            const label = meta?.[imgUrl]
                            const isPDF = imgUrl.toLowerCase().includes('.pdf')
                            return (
                              <div key={`img-${idx}`} className="flex flex-col gap-0.5">
                                <div className="relative group rounded-md overflow-hidden border border-slate-600 aspect-square bg-slate-900">
                                  {isPDF ? (
                                    <div className="flex items-center justify-center w-full h-full bg-slate-800 text-slate-400"><span className="font-black text-[10px]">PDF</span></div>
                                  ) : (
                                    <img src={imgUrl} alt="Placa" className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity" />
                                  )}
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                    <a href={imgUrl} target="_blank" rel="noreferrer" className="p-1 bg-white/20 rounded-full hover:bg-white text-slate-900 transition-colors"><Search size={12}/></a>
                                    <button onClick={() => setEditingLabel({orderId: order.id, url: imgUrl, value: label || ""})} className="p-1 bg-blue-600 rounded-full hover:bg-blue-700 text-white transition-colors"><Pencil size={10}/></button>
                                    <button onClick={async () => { if(confirm("¿Eliminar archivo?")) { await deleteImageFromOrder(order.id, imgUrl); router.refresh(); } }} className="p-1 bg-brand-600 rounded-full hover:bg-brand-700 text-white transition-colors"><Trash2 size={12}/></button>
                                  </div>
                                </div>
                                {label && <span className="text-[8px] font-black uppercase text-slate-400 truncate text-center leading-tight">{label}</span>}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] font-black text-slate-500 uppercase italic text-center py-2">Sin archivos subidos</p>
                      )}

                     <div className="mt-3 pt-3 border-t border-slate-700 flex flex-col gap-2">
                       <div className="flex gap-2">
                         <input type="url" placeholder="Link de WeTransfer o Drive..." className="flex-1 text-[10px] px-2 py-1 rounded border border-slate-600 bg-slate-900 text-white focus:border-blue-500 outline-none" value={externalLinks[order.id] !== undefined ? externalLinks[order.id] : (order.externalLink || '')} onChange={(e) => setExternalLinks({ ...externalLinks, [order.id]: e.target.value })}/>
                         <Button size="sm" onClick={() => handleSaveLink(order.id)} className="h-auto py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase rounded">Guardar</Button>
                       </div>
                     </div>
                   </div>
                </div>

                {/* 👉 CHIPS DINÁMICOS INTELIGENTES (Cruce de Columnas) */}
                <div className="bg-slate-50 p-3 rounded-[1rem] border border-slate-100">
                   <div className="flex items-start gap-2">
                     <ToothIcon size={14} className="text-slate-400 mt-0.5 shrink-0"/> 
                     <div className="flex flex-col w-full overflow-hidden">
                        <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Odontólogo Derivante</span>
                        
                        <div className="flex justify-between items-center w-full gap-2">
                          <p className="text-xs font-black text-slate-800 uppercase italic truncate">
                            {order.dentist ? `${order.dentist.lastName}, ${order.dentist.firstName}` : 'PARTICULAR'}
                          </p>
                          
                          {/* ESCANER INTELIGENTE DE PREFERENCIAS */}
                          {order.dentist && (() => {
                            const m = (order.dentist.deliveryMethod || "").trim().toUpperCase();
                            const p = (order.dentist.resultPreference || "").trim().toUpperCase();
                            
                            const showImpresa = m === "IMPRESA" || m === "AMBAS" || p === "IMPRESA" || p === "AMBAS";
                            const showDigital = m === "DIGITAL" || m === "AMBAS" || p === "DIGITAL" || p === "AMBAS";
                            const showWp = m === "WHATSAPP" || p === "WHATSAPP";
                            const showMail = m === "E-MAIL" || p === "E-MAIL" || m === "EMAIL" || p === "EMAIL";

                            return (
                              <div className="flex gap-1 shrink-0">
                                {/* 1. SI ESTÁ VACÍO */}
                                {(!m && !p) && (
                                  <span className="text-[8px] font-black px-2 py-1 rounded-md uppercase flex items-center gap-1 bg-slate-200 text-slate-600 border border-slate-300">
                                    S/D PREF.
                                  </span>
                                )}

                                {/* 2. IMPRESA */}
                                {showImpresa && (
                                  <span className="text-[8px] font-black px-2 py-1 rounded-md uppercase flex items-center gap-1 bg-orange-100 text-orange-700 border border-orange-200">
                                    <Printer size={10} /> IMPRESA
                                  </span>
                                )}

                                {/* 3. DIGITAL */}
                                {showDigital && (
                                  <span className="text-[8px] font-black px-2 py-1 rounded-md uppercase flex items-center gap-1 bg-blue-100 text-blue-700 border border-blue-200">
                                    {showWp ? <MessageCircle size={10}/> : showMail ? <Mail size={10}/> : <Send size={10}/>}
                                    {showWp ? "WHATSAPP" : showMail ? "E-MAIL" : "DIGITAL"}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                     </div>
                   </div>
                </div>

                {/* SELECTOR DE TÉCNICO */}
                {technicians.filter((t: any) => t.branchId === session?.branchId).length > 0 && (
                  <div className="flex items-center gap-2 pt-1 pb-1">
                    <select
                      value={order.technicianId || "NONE"}
                      onChange={e => handleAssignTechnician(order.id, e.target.value)}
                      className="flex-1 h-9 px-2 rounded-xl border-2 border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 uppercase focus:border-brand-400 focus:outline-none"
                    >
                      <option value="NONE">— Técnico —</option>
                      {technicians.filter((t: any) => t.branchId === session?.branchId).map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2 pt-1 mt-auto">
                  {order.status === 'EN_ATENCION' ? (
                    <>
                      <Button disabled={loadingId === order.id} onClick={() => handleStatus(order.id, 'PARA_REPETIR')} className="w-12 bg-amber-100 hover:bg-amber-200 text-amber-700 h-11 rounded-xl shadow-sm border border-amber-200 p-0" title="Marcar para repetición">
                        <AlertTriangle size={18} />
                      </Button>
                      <Button disabled={loadingId === order.id} onClick={() => handleStatus(order.id, 'LISTO_PARA_ENTREGA')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl font-black uppercase italic shadow-sm text-xs border-b-[3px] border-emerald-800 active:border-b-0 active:translate-y-px transition-all">
                        <CheckCircle className="mr-2 h-4 w-4" /> Finalizar Estudio
                      </Button>
                    </>
                  ) : (
                    <Button disabled={loadingId === order.id} onClick={() => handleStatus(order.id, 'EN_ATENCION')} className="flex-1 h-11 rounded-xl font-black uppercase italic shadow-sm transition-all text-xs bg-slate-900 text-white hover:bg-slate-800 border-b-[3px] border-slate-950 active:border-b-0 active:translate-y-px">
                      <Play className="mr-2 h-4 w-4 fill-white" /> Llamar a Sala
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )})
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="bg-white shadow-xl h-24 w-24 rounded-3xl flex items-center justify-center mx-auto text-slate-200 border-2 border-slate-50"><CheckCircle size={48} className="text-emerald-500 opacity-50" /></div>
            <div className="space-y-1"><p className="text-slate-900 font-black uppercase italic text-2xl tracking-tighter">Sala Despejada</p><p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">No hay pacientes {activeFilter !== 'TODOS' ? 'en este estado' : 'en esta sede'}</p></div>
          </div>
        )}
      </div>
    </div>
  )
}