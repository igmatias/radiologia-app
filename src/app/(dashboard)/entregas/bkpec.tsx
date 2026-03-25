"use client"
import { deleteImageFromOrder, uploadDelayedImage, saveExternalLinkToOrder } from "@/actions/storage" 
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getDeliveries, markAsDelivered } from "@/actions/deliveries"
import { searchOrdersGlobal } from "@/actions/search"
import { getCurrentSession } from "@/actions/auth"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import QRCode from "react-qr-code"
import { useRouter } from "next/navigation"
import { 
  FileCheck, Clock, CheckCircle2, User, Stethoscope, Mail, 
  Smartphone, UserCheck, RefreshCw, Send, Printer, QrCode, Search, 
  UploadCloud, Link as LinkIcon, Copy, XCircle, FileText, ExternalLink,
  ArrowLeft, ChevronDown, ChevronUp 
} from "lucide-react"

export default function EntregasClient({ branches }: { branches: any[] }) {
  const router = useRouter()
  const [session, setSession] = useState<{ branchId: string, userName: string } | null>(null)
  const [activeTab, setActiveTab] = useState<"HOY" | "BUSCADOR">("HOY")
  
  const getLocalDate = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split('T')[0];
  };
  const [date, setDate] = useState(getLocalDate());
  
  const [pending, setPending] = useState<any[]>([])
  const [delivered, setDelivered] = useState<any[]>([])
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
    }
    setLoading(false);
  };

  useEffect(() => { 
    if(activeTab === "HOY") loadData(); 
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

  const handleDeliver = async (order: any, method: string) => {
    if (!order.accessCode && (method === "WHATSAPP" || method === "QR")) return toast.error("Sin link digital.");
    const linkPortal = `${window.location.origin}/resultados/${order.accessCode}`;
    if (method === "WHATSAPP") {
      const msj = encodeURIComponent(`¡Hola! Tus resultados están listos:\n${linkPortal}`);
      const cleanPhone = order.patient?.phone?.replace(/\D/g, ''); 
      window.open(`https://wa.me/549${cleanPhone}?text=${msj}`, '_blank');
    }
    const res = await markAsDelivered(order.id, method);
    if (res.success) { toast.success(`Entregado (${method}) ✓`); loadData(); }
  }

  if (!session?.branchId) return null;

  return (
    <>
      <div className="space-y-6 relative print:hidden">
        
        {/* HEADER PRINCIPAL */}
        <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] shadow-xl border-t-8 border-brand-700 text-white">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            
            <div className="space-y-4">
              {/* BOTONES DE NAVEGACIÓN - UNIFICADOS */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => router.push('/recepcion')}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 h-auto rounded-xl font-black uppercase italic text-[10px] border-b-[3px] border-slate-950 active:border-b-0 active:translate-y-px transition-all"
                >
                  <ArrowLeft size={14} className="mr-2"/> Panel Recepción
                </Button>
                <Button 
                  onClick={() => router.push('/tecnico')}
                  className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 h-auto rounded-xl font-black uppercase italic text-[10px] border-b-[3px] border-brand-900 active:border-b-0 active:translate-y-px transition-all"
                >
                  <ArrowLeft size={14} className="mr-2"/> Sala de Rayos
                </Button>
              </div>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <Send className="text-brand-700" size={36} /> Logística y Entregas
                </h1>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
                  SEDE: {branches.find((b:any) => b.id === session.branchId)?.name} • {session.userName}
                </p>
              </div>
            </div>
            
            <div className="flex bg-slate-800 p-1.5 rounded-2xl w-full lg:w-auto shadow-inner">
              <button onClick={() => setActiveTab("HOY")} className={`flex-1 lg:w-40 py-3 rounded-xl font-black uppercase text-xs transition-all ${activeTab === "HOY" ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}>Hoy</button>
              <button onClick={() => setActiveTab("BUSCADOR")} className={`flex-1 lg:w-40 py-3 rounded-xl font-black uppercase text-xs transition-all ${activeTab === "BUSCADOR" ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}>Buscador</button>
            </div>
          </div>
        </div>

        {activeTab === "HOY" && (
           <div className="flex justify-end items-center gap-3">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 w-44 font-black border-2 bg-white rounded-xl shadow-sm" />
              <Button variant="outline" onClick={loadData} className="h-12 rounded-xl border-2 hover:bg-slate-100"><RefreshCw size={20}/></Button>
           </div>
        )}

        {/* --- PANEL HOY --- */}
        {activeTab === "HOY" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-black italic uppercase text-slate-800 border-b-2 border-slate-200 pb-2 flex items-center gap-2"><Clock className="text-brand-700" size={24}/> Por Entregar</h2>
              {loading ? <p className="text-center py-10 opacity-50">Buscando estudios...</p> : pending.map(order => (
                <Card key={order.id} className="border-none shadow-lg rounded-[2rem] border-t-8 border-t-brand-700">
                  <CardContent className="p-6">
                    <p className="text-[10px] font-black uppercase text-brand-700 mb-1">Orden #{order.code}</p>
                    <h3 className="text-2xl font-black uppercase text-slate-900 mb-4 truncate">{order.patient?.lastName}, {order.patient?.firstName}</h3>
                    <div className="grid grid-cols-5 gap-1.5">
                      <Button onClick={() => copyLink(order.accessCode)} variant="outline" className="h-12 border-2 px-0" title="Link"><LinkIcon size={18}/></Button>
                      <Button onClick={() => setTicketOrder(order)} variant="outline" className="h-12 border-2 px-0" title="QR"><QrCode size={18}/></Button>
                      <Button onClick={() => handleDeliver(order, 'EMAIL')} variant="outline" className="h-12 border-2 px-0" title="Email"><Mail size={18}/></Button>
                      <Button onClick={() => handleDeliver(order, 'WHATSAPP')} variant="outline" className="h-12 border-2 border-emerald-100 text-emerald-600 bg-emerald-50 px-0" title="WhatsApp"><Smartphone size={18}/></Button>
                      <Button onClick={() => handleDeliver(order, 'FÍSICO')} className="h-12 bg-slate-900 text-white px-0" title="Entregar en Mano"><UserCheck size={18}/></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-black italic uppercase text-slate-800 border-b-2 border-slate-200 pb-2 flex items-center gap-2"><CheckCircle2 className="text-emerald-600" size={24}/> Entregados Hoy</h2>
              {delivered.map(order => (
                <Card key={order.id} className="border-none shadow-md rounded-[1.5rem] border-l-4 border-l-slate-800">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 leading-none">Orden #{order.code}</p>
                        <h4 className="text-sm font-black uppercase text-slate-900 mt-1">{order.patient?.lastName}, {order.patient?.firstName}</h4>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} 
                        className={`text-[9px] font-black uppercase h-8 px-3 rounded-lg border ${expandedOrder === order.id ? 'bg-slate-100 text-slate-900 border-slate-200' : 'text-slate-400 bg-slate-50 border-slate-100'}`}
                      >
                        {expandedOrder === order.id ? <ChevronUp size={14} className="mr-1"/> : <ChevronDown size={14} className="mr-1"/>}
                        Archivos
                      </Button>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                      <Button onClick={() => copyLink(order.accessCode)} variant="outline" className="h-9 border px-0"><LinkIcon size={14}/></Button>
                      <Button onClick={() => setTicketOrder(order)} variant="outline" className="h-9 border px-0"><QrCode size={14}/></Button>
                      <Button onClick={() => handleDeliver(order, 'EMAIL')} variant="outline" className="h-9 border px-0"><Mail size={14}/></Button>
                      <Button onClick={() => handleDeliver(order, 'WHATSAPP')} variant="outline" className="h-9 border border-emerald-100 text-emerald-600 px-0"><Smartphone size={14}/></Button>
                      <Button onClick={() => handleDeliver(order, 'FÍSICO')} className="h-9 bg-slate-900 text-white px-0"><UserCheck size={14}/></Button>
                    </div>

                    {expandedOrder === order.id && (
                      <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                        {order.images && order.images.length > 0 && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <div className="flex gap-2 flex-wrap">
                              {order.images.map((img: string, idx: number) => {
                                const isPDF = img.toLowerCase().includes('.pdf');
                                return (
                                  <div key={idx} className="relative group w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-300 overflow-hidden">
                                    {isPDF ? <FileText size={16} className="text-slate-400" /> : <img src={img} alt="placa" className="w-full h-full object-cover opacity-80"/>}
                                    <a href={img} target="_blank" rel="noreferrer" className="absolute inset-0"></a>
                                    <button onClick={async (e) => { e.preventDefault(); if(confirm("¿Eliminar?")) { await deleteImageFromOrder(order.id, img); loadData(); } }} className="absolute -top-1 -right-1 bg-brand-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><XCircle size={10}/></button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 flex flex-col gap-2">
                          <p className="text-[9px] font-black uppercase text-blue-800 flex items-center gap-1.5"><ExternalLink size={12}/> Link Externo</p>
                          <div className="flex gap-2">
                            <input type="url" placeholder="https://drive..." className="flex-1 text-[10px] px-2 py-1.5 rounded-lg border border-blue-200 bg-white" value={externalLinks[order.id] !== undefined ? externalLinks[order.id] : (order.externalLink || '')} onChange={(e) => setExternalLinks({ ...externalLinks, [order.id]: e.target.value })} />
                            <Button size="sm" onClick={() => handleSaveLink(order.id)} className="bg-blue-600 text-white font-black text-[9px] h-auto py-1.5">Guardar</Button>
                          </div>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex justify-between items-center">
                          <p className="text-[9px] font-black uppercase text-amber-800">Cargar Archivo</p>
                          <label className="cursor-pointer bg-amber-500 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg"><UploadCloud size={12} className="inline mr-1"/> Adjuntar<input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleDelayedUpload(order.id, e)}/></label>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* --- BUSCADOR --- */}
        {activeTab === "BUSCADOR" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <form onSubmit={executeSearch} className="bg-white p-2 pl-4 rounded-[2rem] shadow-lg border border-slate-200 flex items-center gap-3">
               <Search size={24} className="text-slate-400"/>
               <Input placeholder="DNI, Apellido o Código..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border-none shadow-none focus-visible:ring-0 text-lg font-bold h-14 bg-transparent" />
               <Button type="submit" disabled={isSearching} className="h-14 px-8 bg-brand-700 hover:bg-brand-800 text-white rounded-2xl font-black uppercase italic shadow-md">Buscar</Button>
            </form>

            <div className="space-y-4">
              {searchResults.map((order) => (
                <Card key={order.id} className="border-none shadow-md rounded-[2rem] border-t-8 border-slate-900 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4 border-b pb-4">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</span>
                        <h3 className="text-2xl font-black uppercase text-slate-900">{order.patient?.lastName}, {order.patient?.firstName}</h3>
                        <p className="text-xs font-bold text-slate-500 mt-1">DNI {order.patient?.dni} | Orden #{order.code}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button onClick={() => copyLink(order.accessCode)} variant="outline" size="sm" className="h-10 border-2"><Copy size={16}/></Button>
                        <Button onClick={() => handleDeliver(order, 'WHATSAPP')} variant="outline" size="sm" className="h-10 border-2 border-emerald-100 text-emerald-600"><Smartphone size={16}/></Button>
                        <Button onClick={() => setTicketOrder(order)} variant="outline" size="sm" className="h-10 border-2 bg-slate-900 text-white"><Printer size={16}/></Button>
                      </div>
                    </div>

                    {/* Lógica de archivos y links (igual que arriba) */}
                    <div className="space-y-4">
                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-2">
                          <p className="text-[10px] font-black uppercase text-blue-800 flex items-center gap-1.5"><ExternalLink size={14}/> Link Externo (Drive / WeTransfer)</p>
                          <div className="flex gap-2">
                            <input type="url" placeholder="https://..." className="flex-1 text-xs px-3 py-2 rounded-lg border bg-white" value={externalLinks[order.id] !== undefined ? externalLinks[order.id] : (order.externalLink || '')} onChange={(e) => setExternalLinks({ ...externalLinks, [order.id]: e.target.value })} />
                            <Button size="sm" onClick={() => handleSaveLink(order.id)} className="bg-blue-600 text-white font-black uppercase text-[10px]">Guardar</Button>
                          </div>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex justify-between items-center">
                          <p className="text-xs font-black uppercase text-amber-800">Adjuntar Placas / PDF</p>
                          <label className="cursor-pointer bg-amber-500 text-white text-[10px] font-black uppercase px-6 py-3 rounded-xl shadow-md transition-all">
                            <UploadCloud size={16} className="inline mr-2"/> Cargar Diferido
                            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleDelayedUpload(order.id, e)}/>
                          </label>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DIALOGO QR (TICKET) - SIN CAMBIOS */}
      <Dialog open={!!ticketOrder} onOpenChange={(open) => !open && setTicketOrder(null)}>
        <DialogTitle className="sr-only">Detalle</DialogTitle>
        <DialogContent className="sm:max-w-[350px] bg-white rounded-3xl p-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-black uppercase italic">i-R Dental</h2>
            <div className="bg-white p-4 rounded-2xl border-2 border-dashed inline-block">
              {ticketOrder?.accessCode && <QRCode value={`${window.location.origin}/resultados/${ticketOrder.accessCode}`} size={160} />}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Escaneá para ver tus placas digitales</p>
            <div className="bg-slate-50 p-4 rounded-xl text-left border">
              <p className="text-sm font-black uppercase">{ticketOrder?.patient?.lastName}, {ticketOrder?.patient?.firstName}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">DNI: {ticketOrder?.patient?.dni}</p>
            </div>
            <Button onClick={() => window.print()} className="w-full h-12 bg-black text-white font-black uppercase rounded-xl">Imprimir Ticket</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}