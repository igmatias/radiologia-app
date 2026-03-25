"use client"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Clock, Play, CheckCircle, RefreshCw, LogOut,
  Phone, Cake, Send, Hash, Calendar, MapPin, Mail,
  MessageCircle, AlertCircle, Copy, UploadCloud, Image as ImageIcon, Loader2, Search, Trash2, AlertTriangle, Timer, Printer
} from "lucide-react"
import ToothIcon from "@/components/icons/tooth-icon"
import RadiationIcon from "@/components/icons/radiation-icon"
import { logoutUser, getCurrentSession } from "@/actions/auth"
import { updateOrderStatusAction } from "@/actions/orders"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getPresignedUrl, saveImageToOrder, deleteImageFromOrder, saveExternalLinkToOrder } from "@/actions/storage"

export default function TecnicoClient({ initialOrders, branches = [] }: any) {
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
  const [externalLinks, setExternalLinks] = useState<Record<string, string>>({})

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

  const handleSelectBranch = (branchId: string) => {
    localStorage.setItem("radiologia-branch", branchId);
    setSession(prev => prev ? { ...prev, branchId } : null);
    setShowBranchModal(false);
    router.refresh();
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

  const handleCopy = (text: string, label: string) => {
    if (!text || text === 'S/D') return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado ✓`);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingOrder(orderId);
    toast.loading("Subiendo archivo...", { id: `upload-${orderId}` });

    try {
      const res = await getPresignedUrl(file.name, file.type, orderId);
      if (!res.success) throw new Error(res.error);

      const uploadRes = await fetch(res.signedUrl as string, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });

      if (!uploadRes.ok) throw new Error("Fallo al subir archivo a la nube");

      await saveImageToOrder(orderId, res.publicUrl as string);
      toast.success("¡Archivo subido con éxito! ✓", { id: `upload-${orderId}` });
      
    } catch (error: any) {
      toast.error(error.message || "Error al subir el archivo", { id: `upload-${orderId}` });
    } finally {
      setUploadingOrder(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
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
      
      <Dialog open={showBranchModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[450px] bg-white rounded-[2.5rem] border-t-8 border-brand-700 p-8 outline-none">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic uppercase text-center tracking-tighter text-slate-900">Configurar Sede</DialogTitle>
            <p className="text-center text-xs font-black uppercase text-slate-400 tracking-[0.2em] mt-2">Hola, {session?.userName} • Seleccioná tu puesto de hoy</p>
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl shadow-sm border-t-8 border-t-brand-700 gap-4 border border-slate-200">
        <div>
          <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter flex items-center gap-2">
            <RadiationIcon className="text-brand-700" size={28} /> Sala de Rayos
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black uppercase text-white bg-brand-700 px-3 py-1 rounded-md tracking-widest italic shadow-sm">
              SEDE: {branches.find((b:any) => b.id === session?.branchId)?.name || "---"}
            </span>
            <span className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">• Op: {session?.userName}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button onClick={() => router.push('/entregas')} className="flex-1 md:flex-none h-10 px-6 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-black uppercase italic text-xs shadow-md border-b-[3px] border-brand-900 active:border-b-0 active:translate-y-px transition-all">
            <Send size={16} className="mr-2"/> Panel Entregas
          </Button>
          <Button variant="outline" onClick={() => setShowBranchModal(true)} className="flex-1 md:flex-none h-10 px-4 rounded-xl border-2 border-slate-200 font-black uppercase italic hover:bg-slate-900 hover:text-white transition-all text-xs">
            <MapPin size={16} className="mr-2 text-brand-700"/> Sede
          </Button>
          <Button onClick={handleLogout} variant="ghost" className="text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-all h-10 w-10 p-0" title="Cerrar sesión"><LogOut size={20} /></Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-full max-w-2xl">
        <Button onClick={() => setActiveFilter('TODOS')} className={`flex-1 rounded-xl h-10 font-black uppercase text-[10px] md:text-xs transition-all ${activeFilter === 'TODOS' ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}>Todos</Button>
        <Button onClick={() => setActiveFilter('EN_ESPERA')} className={`flex-1 rounded-xl h-10 font-black uppercase text-[10px] md:text-xs transition-all ${activeFilter === 'EN_ESPERA' ? 'bg-emerald-600 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}>En Espera</Button>
        <Button onClick={() => setActiveFilter('ATENDIENDO')} className={`flex-1 rounded-xl h-10 font-black uppercase text-[10px] md:text-xs transition-all ${activeFilter === 'ATENDIENDO' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}>En Sala</Button>
        <Button onClick={() => setActiveFilter('REPETIR')} className={`flex-1 rounded-xl h-10 font-black uppercase text-[10px] md:text-xs transition-all ${activeFilter === 'REPETIR' ? 'bg-amber-500 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}>Repeticiones</Button>
      </div>

      <input type="file" accept="image/jpeg, image/png, application/dicom, application/pdf" className="hidden" ref={fileInputRef} onChange={(e) => { if (activeOrderId) handleFileUpload(e, activeOrderId); }} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order: any) => {
            const waitData = getWaitTime(order.createdAt);
            const isRepetir = order.status === 'PARA_REPETIR';
            
            return (
            <Card key={order.id} className={`shadow-lg rounded-[2rem] overflow-hidden bg-white transition-all duration-300 flex flex-col border-t-8 ${order.status === 'EN_ATENCION' ? 'border-t-blue-600 scale-[1.02] shadow-blue-100' : isRepetir ? 'border-t-amber-500 shadow-amber-100' : 'border-t-emerald-500 hover:scale-[1.01] hover:shadow-xl'}`}>
              <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between w-full">
                       
                       <div className="flex gap-2 items-center">
                         <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border flex items-center gap-1 ${order.status === 'EN_ATENCION' ? 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse' : isRepetir ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
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
                    <p className="text-[11px] font-bold text-amber-900 uppercase leading-tight">{order.notes}</p>
                  </div>
                )}

                {/* ESTUDIOS Y ARCHIVOS */}
                <div className="bg-slate-900 p-4 rounded-[1.5rem] shadow-inner text-white flex-1 flex flex-col">
                   <div className="space-y-2 mb-4">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="bg-slate-800 p-3 rounded-xl border-l-4 border-brand-700">
                          <p className="font-black uppercase text-sm tracking-tight leading-tight">{item.procedure.name}</p>
                          {(item.metadata?.teeth || item.teeth)?.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                              <span className="text-[9px] font-black text-slate-400 uppercase">Piezas:</span>
                              {(item.metadata?.teeth || item.teeth).map((tooth: any) => <span key={tooth} className="bg-brand-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">{tooth}</span>)}
                            </div>
                          )}
                        </div>
                      ))}
                   </div>

                   <div className="mt-auto bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                     <div className="flex justify-between items-center mb-3">
                       <h4 className="font-black uppercase text-slate-300 flex items-center gap-1.5 text-[9px] tracking-widest"><ImageIcon size={12} className="text-brand-500"/> Archivos</h4>
                       <Button variant="ghost" size="sm" onClick={() => { setActiveOrderId(order.id); fileInputRef.current?.click(); }} disabled={uploadingOrder === order.id} className="h-6 text-[9px] px-2 bg-brand-700/20 text-brand-400 hover:bg-brand-700 hover:text-white font-black uppercase rounded-md">
                         {uploadingOrder === order.id ? <Loader2 size={10} className="mr-1 animate-spin"/> : <UploadCloud size={10} className="mr-1"/>} Subir
                       </Button>
                     </div>

                     {order.items.some((i:any) => i.metadata?.images?.length > 0) || (order.images && order.images.length > 0) ? (
                        <div className="grid grid-cols-4 gap-2">
                          {(order.images || []).map((imgUrl: string, idx: number) => (
                            <div key={`img-${idx}`} className="relative group rounded-md overflow-hidden border border-slate-600 aspect-square bg-slate-900">
                              {imgUrl.toLowerCase().includes('.pdf') ? (
                                <div className="flex items-center justify-center w-full h-full bg-slate-800 text-slate-400"><span className="font-black text-[10px]">PDF</span></div>
                              ) : (
                                <img src={imgUrl} alt="Placa" className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity" />
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                <a href={imgUrl} target="_blank" rel="noreferrer" className="p-1 bg-white/20 rounded-full hover:bg-white text-slate-900 transition-colors"><Search size={12}/></a>
                                <button onClick={async () => { if(confirm("¿Eliminar archivo?")) { await deleteImageFromOrder(order.id, imgUrl); router.refresh(); } }} className="p-1 bg-brand-600 rounded-full hover:bg-brand-700 text-white transition-colors"><Trash2 size={12}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[9px] font-black text-slate-500 uppercase italic text-center py-2">Sin archivos subidos</p>
                      )}

                     <div className="mt-3 pt-3 border-t border-slate-700 flex flex-col gap-2">
                       <div className="flex gap-2">
                         <input type="url" placeholder="Link de WeTransfer o Drive..." className="flex-1 text-[10px] px-2 py-1 rounded border border-slate-600 bg-slate-900 text-white focus:border-blue-500 outline-none" value={externalLinks[order.id] !== undefined ? externalLinks[order.id] : (order.externalLink || '')} onChange={(e) => setExternalLinks({ ...externalLinks, [order.id]: e.target.value })}/>
                         <Button size="sm" onClick={() => handleSaveLink(order.id)} className="h-auto py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase rounded">Guardar</Button>
                       </div>
                     </div>
                   </div>
                </div>

                {/* 👉 CHIPS DINÁMICOS INTELIGENTES (Cruce de Columnas) */}
                <div className="bg-slate-50 p-3 rounded-[1rem] border border-slate-100">
                   <div className="flex items-start gap-2">
                     <ToothIcon size={14} className="text-slate-400 mt-0.5 shrink-0"/> 
                     <div className="flex flex-col w-full overflow-hidden">
                        <span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Odontólogo Derivante</span>
                        
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

                <div className="flex gap-2 pt-1 mt-auto">
                  {order.status === 'EN_ATENCION' ? (
                    <>
                      <Button disabled={loadingId === order.id} onClick={() => handleStatus(order.id, 'PARA_REPETIR')} className="w-12 bg-amber-100 hover:bg-amber-200 text-amber-700 h-12 rounded-xl shadow-sm border border-amber-200 p-0" title="Marcar para repetición">
                        <AlertTriangle size={18} />
                      </Button>
                      <Button disabled={loadingId === order.id} onClick={() => handleStatus(order.id, 'LISTO_PARA_ENTREGA')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-black uppercase italic shadow-sm text-xs border-b-[3px] border-emerald-800 active:border-b-0 active:translate-y-px transition-all">
                        <CheckCircle className="mr-2 h-4 w-4" /> Finalizar Estudio
                      </Button>
                    </>
                  ) : (
                    <Button disabled={loadingId === order.id} onClick={() => handleStatus(order.id, 'EN_ATENCION')} className="flex-1 h-12 rounded-xl font-black uppercase italic shadow-sm transition-all text-xs bg-slate-900 text-white hover:bg-slate-800 border-b-[3px] border-slate-950 active:border-b-0 active:translate-y-px">
                      <Play className="mr-2 h-4 w-4 fill-white" /> Llamar a Sala
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )})
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="bg-white shadow-xl h-24 w-24 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200 border-2 border-slate-50"><CheckCircle size={48} className="text-emerald-500 opacity-50" /></div>
            <div className="space-y-1"><p className="text-slate-900 font-black uppercase italic text-2xl tracking-tighter">Sala Despejada</p><p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">No hay pacientes {activeFilter !== 'TODOS' ? 'en este estado' : 'en esta sede'}</p></div>
          </div>
        )}
      </div>
    </div>
  )
}