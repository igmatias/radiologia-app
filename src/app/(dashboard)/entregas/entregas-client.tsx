"use client"
import { deleteImageFromOrder, uploadDelayedImage, saveExternalLinkToOrder } from "@/actions/storage" 
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getDeliveries, markAsDelivered, markAsDelayed } from "@/actions/deliveries"
import { searchOrdersGlobal } from "@/actions/search"
import { getCurrentSession } from "@/actions/auth"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import QRCode from "react-qr-code"
import { useRouter } from "next/navigation"
import { 
  FileCheck, Clock, CheckCircle2, User, Stethoscope, Mail, 
  Smartphone, UserCheck, RefreshCw, Send, Printer, QrCode, Search, 
  UploadCloud, Link as LinkIcon, Copy, XCircle, FileText, ExternalLink,
  ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Package, PauseCircle
} from "lucide-react"

export default function EntregasClient({ branches }: { branches: any[] }) {
  const router = useRouter()
  const [session, setSession] = useState<{ branchId: string, userName: string } | null>(null)
  
  // 👉 AGREGADA PESTAÑA "DEMORADAS"
  const [activeTab, setActiveTab] = useState<"HOY" | "DEMORADAS" | "BUSCADOR">("HOY")
  
  const getLocalDate = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split('T')[0];
  };
  const [date, setDate] = useState(getLocalDate());
  
  const [pending, setPending] = useState<any[]>([])
  const [delivered, setDelivered] = useState<any[]>([])
  const [delayed, setDelayed] = useState<any[]>([]) // 👉 ESTADO PARA DEMORADAS
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [ticketOrder, setTicketOrder] = useState<any>(null)
  
  const [externalLinks, setExternalLinks] = useState<Record<string, string>>({})
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

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
    const res = await getDeliveries(session.branchId, date);
    if (res.success) {
      setPending(res.pending);
      setDelivered(res.delivered);
      setDelayed(res.delayed || []); // Guardamos las demoradas
    }
    setLoading(false);
  };

  useEffect(() => { 
    if(activeTab === "HOY" || activeTab === "DEMORADAS") loadData(); 
  }, [session?.branchId, date, activeTab]);

  const executeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.length < 2) return toast.error("Ingresá al menos 2 caracteres");
    setIsSearching(true);
    const res = await searchOrdersGlobal(searchQuery);
    if (res.success) {
      setSearchResults(res.orders);
    }
    setIsSearching(false);
  }

  const handleDelayedUpload = async (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Subiendo archivo...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orderId", orderId);
      const res = await uploadDelayedImage(formData);
      if (res.success) {
        toast.success("¡Archivo subido!", { id: toastId });
        if(activeTab === "BUSCADOR") executeSearch(); else loadData();
      } else toast.error(res.error, { id: toastId });
    } catch (error) { toast.error("Error de conexión", { id: toastId }); }
  }

  const handleSaveLink = async (orderId: string) => {
    const link = externalLinks[orderId];
    if (!link) return;
    const res = await saveExternalLinkToOrder(orderId, link);
    if (res.success) {
      toast.success("Enlace guardado");
      if(activeTab === "BUSCADOR") executeSearch(); else loadData();
    }
  };

  const copyLink = (accessCode: string) => {
    const link = `${window.location.origin}/resultados/${accessCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado ✓");
  }

  const getDebt = (order: any) => {
    const pagosReales = order.payments?.filter((p: any) => p.method !== 'SALDO') || [];
    const totalAbonado = pagosReales.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
    const totalPaciente = Number(order.patientAmount || 0);
    return Math.max(0, totalPaciente - totalAbonado);
  };

  const handleDeliver = async (order: any, method: string) => {
    if (!order.accessCode && (method === "WHATSAPP" || method === "EMAIL" || method === "QR")) {
      return toast.error("La orden no tiene placas o links cargados aún.");
    }
    
    const debt = getDebt(order);
    const linkPortal = `${window.location.origin}/resultados/${order.accessCode}`;
    
    if (method === "WHATSAPP") {
      const cleanPhone = order.patient?.phone?.replace(/\D/g, ''); 
      if (!cleanPhone) return toast.error("El paciente no tiene teléfono registrado.");

      let text = `¡Hola ${order.patient?.firstName || ''}! Te avisamos de *i-R Dental* que tus estudios ya están listos.`;
      
      if (order.accessCode) {
        text += `\n\nPodés verlos y descargarlos ingresando a este link:\n${linkPortal}`;
      }
      
      if (debt > 0) {
        text += `\n\n⚠️ Te recordamos que quedó un saldo pendiente de *$${debt.toLocaleString('es-AR')}* para abonar al retirar o vía transferencia.`;
      }
      
      text += `\n\n¡Que tengas un excelente día!`;

      const msj = encodeURIComponent(text);
      window.open(`https://wa.me/549${cleanPhone}?text=${msj}`, '_blank');
    }
    
    const res = await markAsDelivered(order.id, method);
    if (res.success) { 
      toast.success(`Marcado como entregado (${method}) ✓`); 
      loadData(); 
    } else {
      toast.error("Error al marcar como entregado");
    }
  }

  // 👉 ACCIÓN PARA PAUSAR/DEMORAR LA ORDEN
  const handleDelayOrder = async (orderId: string) => {
    const reason = window.prompt("Motivo de la demora (Ej: Debe saldo, falta firma):");
    if (reason === null) return; // Si cancela el prompt
    
    const res = await markAsDelayed(orderId, reason || "Sin especificar");
    if (res.success) {
      toast.success("Orden movida a Demoradas ⏸️");
      loadData();
    } else {
      toast.error("Error al demorar la orden");
    }
  }

  const getDeliveryPreference = (order: any) => {
    if (!order.dentist) return { type: 'DIGITAL', label: 'DIGITAL (PARTICULAR)' };
    
    const m = (order.dentist.deliveryMethod || "").trim().toUpperCase();
    const p = (order.dentist.resultPreference || "").trim().toUpperCase();
    
    const isPhysical = m === "IMPRESA" || m === "AMBAS" || p === "IMPRESA" || p === "AMBAS";
    return isPhysical ? { type: 'FISICO', label: '📦 RETIRO FÍSICO' } : { type: 'DIGITAL', label: '📱 ENVÍO DIGITAL' };
  };

  // COMPONENTE TARJETA DE ORDEN (Reutilizable para HOY y DEMORADAS)
  const OrderCard = ({ order, isDelayed = false }: { order: any, isDelayed?: boolean }) => {
    const debt = getDebt(order);
    const pref = getDeliveryPreference(order);

    return (
      <Card className={`border-none shadow-lg rounded-[2rem] border-t-8 transition-all ${isDelayed ? 'border-t-amber-500 bg-amber-50/20' : debt > 0 ? 'border-t-red-600 bg-red-50/30' : 'border-t-emerald-500 bg-white'}`}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Orden #{order.code || order.dailyId}</p>
            
            <div className="flex gap-2 items-center">
              {isDelayed && <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-sm border bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1"><PauseCircle size={10}/> DEMORADA</span>}
              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-sm border ${pref.type === 'FISICO' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                {pref.label}
              </span>
            </div>
          </div>
          
          <h3 className="text-2xl font-black uppercase text-slate-900 mb-1 truncate">
            {order.patient?.lastName}, <span className={debt > 0 ? "text-red-700" : "text-emerald-700"}>{order.patient?.firstName}</span>
          </h3>
          
          {debt > 0 ? (
            <div className="bg-red-100 border-2 border-red-200 text-red-800 p-3 rounded-xl mb-4 mt-2 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="animate-pulse"/>
                <span className="font-black uppercase text-xs">Saldo Pendiente</span>
              </div>
              <span className="font-black italic text-xl">${debt.toLocaleString('es-AR')}</span>
            </div>
          ) : (
            <div className="mb-4 mt-1">
              <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">✓ Saldo Abonado</span>
            </div>
          )}

          {order.notes && (
            <div className="bg-amber-50 p-3 rounded-xl border-l-4 border-amber-500 flex items-start gap-2 mb-3">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-amber-900 uppercase leading-tight">{order.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-6 gap-2 mt-2">
            <Button onClick={() => copyLink(order.accessCode)} variant="outline" className="h-12 border-2 px-0 hover:bg-slate-100" title="Copiar Link"><LinkIcon size={18}/></Button>
            <Button onClick={() => setTicketOrder(order)} variant="outline" className="h-12 border-2 px-0 hover:bg-slate-100" title="Imprimir Ticket QR"><QrCode size={18}/></Button>
            <Button onClick={() => handleDeliver(order, 'EMAIL')} variant="outline" className="h-12 border-2 px-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" title="Marcar enviado por Email"><Mail size={18}/></Button>
            
            <Button onClick={() => handleDeliver(order, 'WHATSAPP')} className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white px-0 border-b-[3px] border-emerald-800 active:border-b-0 active:translate-y-px transition-all" title="Enviar WhatsApp al Paciente">
              <Smartphone size={18}/>
            </Button>

            <Button onClick={() => handleDeliver(order, 'FÍSICO')} className={`h-12 text-white px-0 border-b-[3px] active:border-b-0 active:translate-y-px transition-all ${pref.type === 'FISICO' ? 'bg-orange-600 hover:bg-orange-700 border-orange-800 shadow-md' : 'bg-slate-900 hover:bg-slate-800 border-slate-950'}`} title="Entregar Sobre en Mano">
              <UserCheck size={18}/>
            </Button>

            {/* BOTÓN DEMORAR / PAUSAR */}
            {!isDelayed && (
              <Button onClick={() => handleDelayOrder(order.id)} className="h-12 border-2 border-amber-500 text-amber-600 bg-amber-50 hover:bg-amber-600 hover:text-white px-0 transition-all" title="Marcar como Demorada">
                <PauseCircle size={18}/>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!session?.branchId) return null;

  return (
    <>
      <div className="space-y-6 relative print:hidden">
        
        {/* HEADER PRINCIPAL */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl shadow-sm border-t-8 border-t-red-700 gap-4 border border-slate-200">
          <div>
            <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter flex items-center gap-2">
              <Send className="text-red-700" size={28} /> Logística y Entregas
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black uppercase text-white bg-red-700 px-3 py-1 rounded-md tracking-widest italic shadow-sm">
                SEDE: {branches.find((b:any) => b.id === session.branchId)?.name || "---"}
              </span>
              <span className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">• {session.userName}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button onClick={() => router.push('/recepcion')} className="flex-1 md:flex-none h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase italic text-xs shadow-md border-b-[3px] border-slate-950 active:border-b-0 active:translate-y-px transition-all">
              <ArrowLeft size={14} className="mr-2"/> Recepción
            </Button>
            <Button onClick={() => router.push('/tecnico')} className="flex-1 md:flex-none h-10 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black uppercase italic text-xs shadow-md border-b-[3px] border-red-900 active:border-b-0 active:translate-y-px transition-all">
              <ArrowLeft size={14} className="mr-2"/> Sala de Rayos
            </Button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-full max-w-2xl">
          <button onClick={() => setActiveTab("HOY")} className={`flex-1 rounded-xl h-10 font-black uppercase text-[10px] md:text-xs transition-all ${activeTab === "HOY" ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}>Hoy</button>
          <button onClick={() => setActiveTab("DEMORADAS")} className={`flex-1 rounded-xl h-10 font-black uppercase text-[10px] md:text-xs transition-all ${activeTab === "DEMORADAS" ? 'bg-amber-500 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}>Demoradas {delayed.length > 0 && `(${delayed.length})`}</button>
          <button onClick={() => setActiveTab("BUSCADOR")} className={`flex-1 rounded-xl h-10 font-black uppercase text-[10px] md:text-xs transition-all ${activeTab === "BUSCADOR" ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}>Buscador</button>
        </div>

        {(activeTab === "HOY" || activeTab === "DEMORADAS") && (
           <div className="flex justify-end items-center gap-3">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 w-44 font-black border-2 bg-white rounded-xl shadow-sm" />
              <Button variant="outline" onClick={loadData} className="h-12 rounded-xl border-2 hover:bg-slate-100"><RefreshCw size={20}/></Button>
           </div>
        )}

        {/* --- PANEL HOY --- */}
        {activeTab === "HOY" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
            <div className="space-y-4">
              <h2 className="text-xl font-black italic uppercase text-slate-800 border-b-2 border-slate-200 pb-2 flex items-center gap-2"><Clock className="text-red-700" size={24}/> Por Entregar</h2>
              
              {loading ? <p className="text-center py-10 font-bold uppercase text-slate-400 animate-pulse">Buscando estudios listos...</p> : pending.length === 0 ? <p className="text-center py-10 font-black uppercase text-emerald-500 italic text-xl">¡Todo entregado! ✓</p> : pending.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
            
            {/* ENTREGADOS HOY */}
            <div className="space-y-4">
              <h2 className="text-xl font-black italic uppercase text-slate-800 border-b-2 border-slate-200 pb-2 flex items-center gap-2"><CheckCircle2 className="text-emerald-600" size={24}/> Entregados Hoy</h2>
              {delivered.map(order => (
                <Card key={order.id} className="shadow-sm rounded-[2rem] border-t-8 border-t-slate-300 bg-slate-50 opacity-80 hover:opacity-100 transition-opacity">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-500 leading-none mb-1">Orden #{order.code || order.dailyId}</p>
                        <h4 className="text-sm font-black uppercase text-slate-800">{order.patient?.lastName}, {order.patient?.firstName}</h4>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} 
                        className={`text-[9px] font-black uppercase h-8 px-3 rounded-lg border ${expandedOrder === order.id ? 'bg-white text-slate-900 border-slate-300 shadow-sm' : 'text-slate-500 bg-transparent border-slate-200'}`}
                      >
                        {expandedOrder === order.id ? <ChevronUp size={14} className="mr-1"/> : <ChevronDown size={14} className="mr-1"/>}
                        Archivos
                      </Button>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
                      <Button onClick={() => copyLink(order.accessCode)} variant="outline" className="h-9 border bg-white px-0"><LinkIcon size={14}/></Button>
                      <Button onClick={() => setTicketOrder(order)} variant="outline" className="h-9 border bg-white px-0"><QrCode size={14}/></Button>
                      <Button onClick={() => handleDeliver(order, 'EMAIL')} variant="outline" className="h-9 border bg-white px-0"><Mail size={14}/></Button>
                      <Button onClick={() => handleDeliver(order, 'WHATSAPP')} variant="outline" className="h-9 border border-emerald-200 bg-emerald-50 text-emerald-700 px-0"><Smartphone size={14}/></Button>
                      <Button onClick={() => handleDeliver(order, 'FÍSICO')} className="h-9 bg-slate-700 text-white px-0"><UserCheck size={14}/></Button>
                    </div>

                    {expandedOrder === order.id && (
                      <div className="pt-3 border-t border-slate-200 space-y-3 animate-in fade-in duration-200">
                        {order.images && order.images.length > 0 && (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <div className="flex gap-2 flex-wrap">
                              {order.images.map((img: string, idx: number) => {
                                const isPDF = img.toLowerCase().includes('.pdf');
                                return (
                                  <div key={idx} className="relative group w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-300 overflow-hidden">
                                    {isPDF ? <FileText size={16} className="text-slate-400" /> : <img src={img} alt="placa" className="w-full h-full object-cover opacity-80"/>}
                                    <a href={img} target="_blank" rel="noreferrer" className="absolute inset-0"></a>
                                    <button onClick={async (e) => { e.preventDefault(); if(confirm("¿Eliminar?")) { await deleteImageFromOrder(order.id, img); loadData(); } }} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 shadow-md"><XCircle size={10}/></button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="bg-blue-50/80 rounded-xl p-3 border border-blue-200 flex flex-col gap-2">
                          <p className="text-[9px] font-black uppercase text-blue-800 flex items-center gap-1.5"><ExternalLink size={12}/> Link Externo (Drive / WeTransfer)</p>
                          <div className="flex gap-2">
                            <input type="url" placeholder="https://..." className="flex-1 text-[10px] px-2 py-1.5 rounded-lg border border-blue-300 bg-white shadow-inner focus:outline-none focus:border-blue-500" value={externalLinks[order.id] !== undefined ? externalLinks[order.id] : (order.externalLink || '')} onChange={(e) => setExternalLinks({ ...externalLinks, [order.id]: e.target.value })} />
                            <Button size="sm" onClick={() => handleSaveLink(order.id)} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] h-auto py-1.5 shadow-sm">Guardar</Button>
                          </div>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex justify-between items-center shadow-sm">
                          <p className="text-[9px] font-black uppercase text-amber-800">Cargar Archivo Diferido</p>
                          <label className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-colors"><UploadCloud size={12} className="inline mr-1"/> Adjuntar<input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleDelayedUpload(order.id, e)}/></label>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* --- PANEL DEMORADAS --- */}
        {activeTab === "DEMORADAS" && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
            <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-xl flex items-start gap-3 shadow-sm">
              <PauseCircle className="text-amber-600 mt-0.5" size={20}/>
              <div>
                <h3 className="font-black uppercase text-amber-900">Sala de Pausa</h3>
                <p className="text-xs font-bold text-amber-800 uppercase">Estas órdenes están demoradas por falta de pago u otras observaciones. Podés entregarlas normalmente desde acá cuando se resuelva el problema.</p>
              </div>
            </div>

            {loading ? <p className="text-center py-10 font-bold uppercase text-slate-400 animate-pulse">Cargando...</p> : delayed.length === 0 ? <p className="text-center py-10 font-black uppercase text-slate-400 italic text-xl">No hay órdenes demoradas.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {delayed.map(order => (
                  <OrderCard key={order.id} order={order} isDelayed={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- BUSCADOR --- */}
        {activeTab === "BUSCADOR" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
            <form onSubmit={executeSearch} className="bg-white p-2 pl-4 rounded-[2rem] shadow-lg border-2 border-slate-200 flex items-center gap-3">
               <Search size={24} className="text-red-700"/>
               <Input placeholder="DNI, Apellido o Nº de Orden..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border-none shadow-none focus-visible:ring-0 text-lg font-bold h-14 bg-transparent uppercase" autoFocus />
               <Button type="submit" disabled={isSearching} className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase italic shadow-md transition-all active:scale-95">Buscar</Button>
            </form>

            <div className="space-y-4">
              {searchResults.length === 0 && !isSearching && searchQuery.length > 2 && (
                <p className="text-center py-10 font-bold uppercase text-slate-400">No se encontraron resultados.</p>
              )}
              {searchResults.map((order) => {
                const debt = getDebt(order);
                const pref = getDeliveryPreference(order);

                return (
                  <Card key={order.id} className={`shadow-md rounded-[2rem] border-t-8 overflow-hidden hover:shadow-lg transition-all ${debt > 0 ? 'border-t-red-600' : 'border-t-emerald-500'}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-sm">
                              {new Date(order.createdAt).toLocaleDateString('es-AR')}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${pref.type === 'FISICO' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                              {pref.label}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black uppercase text-slate-900">{order.patient?.lastName}, {order.patient?.firstName}</h3>
                          <p className="text-xs font-bold text-slate-500 mt-1">DNI {order.patient?.dni} | Orden #{order.code || order.dailyId}</p>
                          
                          {debt > 0 && (
                            <span className="inline-flex mt-2 text-[10px] font-black uppercase text-red-700 bg-red-100 px-2 py-1 rounded-md border border-red-200">
                              ⚠️ Adeuda ${debt.toLocaleString('es-AR')}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5 flex-col md:flex-row">
                          <Button onClick={() => copyLink(order.accessCode)} variant="outline" size="sm" className="h-10 border-2 bg-white" title="Copiar Link"><Copy size={16}/></Button>
                          <Button onClick={() => handleDeliver(order, 'WHATSAPP')} variant="outline" size="sm" className="h-10 border-2 border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white" title="Enviar WhatsApp"><Smartphone size={16}/></Button>
                          <Button onClick={() => setTicketOrder(order)} variant="outline" size="sm" className="h-10 border-2 bg-slate-900 text-white hover:bg-slate-800 hover:text-white" title="Imprimir Ticket"><Printer size={16}/></Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-2">
                            <p className="text-[10px] font-black uppercase text-blue-800 flex items-center gap-1.5"><ExternalLink size={14}/> Link Externo (Drive / WeTransfer)</p>
                            <div className="flex gap-2">
                              <input type="url" placeholder="https://..." className="flex-1 text-xs px-3 py-2 rounded-lg border bg-white focus:outline-none focus:border-blue-400" value={externalLinks[order.id] !== undefined ? externalLinks[order.id] : (order.externalLink || '')} onChange={(e) => setExternalLinks({ ...externalLinks, [order.id]: e.target.value })} />
                              <Button size="sm" onClick={() => handleSaveLink(order.id)} className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] shadow-sm">Guardar</Button>
                            </div>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex justify-between items-center shadow-sm">
                            <p className="text-xs font-black uppercase text-amber-800 flex items-center gap-2"><UploadCloud size={16}/> Adjuntar Placas / PDF Diferido</p>
                            <label className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase px-6 py-3 rounded-xl shadow-md transition-all active:scale-95">
                              Cargar Archivo
                              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleDelayedUpload(order.id, e)}/>
                            </label>
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* DIALOGO QR (TICKET) - SIN CAMBIOS */}
      <Dialog open={!!ticketOrder} onOpenChange={(open) => !open && setTicketOrder(null)}>
        <DialogTitle className="sr-only">Detalle</DialogTitle>
        <DialogContent className="sm:max-w-[350px] bg-white rounded-[2rem] border-t-8 border-slate-900 p-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black uppercase italic text-slate-900">i-R Dental</h2>
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-300 border-dashed inline-block shadow-inner" data-qr-ticket>
              {ticketOrder?.accessCode && <QRCode value={`${window.location.origin}/resultados/${ticketOrder.accessCode}`} size={160} />}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escaneá para ver tus placas</p>
            <div className="bg-slate-50 p-4 rounded-xl text-left border-2 border-slate-100">
              <p className="text-sm font-black uppercase text-slate-800">{ticketOrder?.patient?.lastName}, {ticketOrder?.patient?.firstName}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">DNI: {ticketOrder?.patient?.dni}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">ORDEN: #{ticketOrder?.code || ticketOrder?.dailyId}</p>
            </div>
            <Button onClick={() => {
              if (!ticketOrder?.accessCode) return;
              const url = `${window.location.origin}/resultados/${ticketOrder.accessCode}`;
              const svgEl = document.querySelector('[data-qr-ticket] svg');
              const svgHTML = svgEl ? svgEl.outerHTML : '';
              const paciente = `${ticketOrder?.patient?.lastName ?? ''}, ${ticketOrder?.patient?.firstName ?? ''}`;
              const dni = ticketOrder?.patient?.dni ?? '';
              const orderId = ticketOrder?.code || ticketOrder?.dailyId || 'S/N';
              const html = `<html><head><style>
                @page { size: 80mm auto; margin: 0; }
                body { margin: 0; padding: 4mm; width: 80mm; box-sizing: border-box; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; gap: 4px; }
                h1 { font-size: 18px; font-weight: 900; font-style: italic; text-transform: uppercase; margin: 0; text-align: center; }
                svg { width: 55mm; height: 55mm; margin-top: 5px; }
                .hint { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #888; text-align: center; margin-top: 2px; }
                .patient { font-size: 13px; font-weight: 900; text-transform: uppercase; text-align: center; margin-top: 5px; margin-bottom: 2px; }
                .dni { font-size: 9px; font-weight: 700; color: #555; text-transform: uppercase; margin: 0; }
                hr { width: 100%; border: 1px solid black; margin: 5px 0; }
              </style></head><body>
                <h1>i-R Dental</h1>
                <hr/>
                ${svgHTML}
                <p class="hint">Escaneá para ver tus placas digitales</p>
                <hr/>
                <p class="patient">${paciente}</p>
                <p class="dni">DNI: ${dni}</p>
                <p class="dni">ORDEN: #${orderId}</p>
              </body></html>`;
              const win = window.open('', '_blank', 'width=400,height=500');
              if (!win) return;
              win.document.write(html);
              win.document.close();
              win.focus();
              setTimeout(() => { win.print(); win.close(); }, 300);
            }} className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic rounded-xl shadow-md text-lg">Imprimir Ticket</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}