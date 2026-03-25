"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { logoutDentist, updateDentistProfile } from "@/actions/dentist-auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  LogOut, Calendar, CheckCircle2, Image as ImageIcon,
  Search, Hash, FileText, ExternalLink, Settings, MessageSquarePlus, Download, ChevronRight, Clock
} from "lucide-react"
import Link from "next/link"


export default function PanelMedicoClient({ dentist }: { dentist: any }) {
  const router = useRouter()
  
  // Estados principales
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados para Perfil
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    phone: dentist.phone || "",
    email: dentist.email || "",
    deliveryMethod: dentist.deliveryMethod || "DIGITAL",
    resultPreference: dentist.resultPreference || "WHATSAPP"
  })

  // Estados para Nueva Solicitud (Ticket)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [loadingTicket, setLoadingTicket] = useState(false)
  const [ticketMessage, setTicketMessage] = useState("")
  const [ticketSubject, setTicketSubject] = useState("ESTUDIO_FALTANTE")

  // Manejadores
  const handleLogout = async () => {
    await logoutDentist()
    router.push("/portal-medico")
  }

  const handleSaveProfile = async () => {
    setLoadingProfile(true)
    const res = await updateDentistProfile(dentist.id, profileData)
    if (res.success) {
      toast.success("Perfil actualizado correctamente")
      setShowProfileModal(false)
      router.refresh()
    } else {
      toast.error("Error al actualizar el perfil")
    }
    setLoadingProfile(false)
  }

  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (ticketMessage.trim().length < 10) return toast.error("Por favor, detallá un poco más tu solicitud (mín. 10 caracteres)")
    
    setLoadingTicket(true)
    try {
      // AQUÍ IRÍA TU FUNCIÓN REAL PARA CREAR EL TICKET EN SUPABASE
      // const res = await createTicket(dentist.id, ticketSubject, ticketMessage)
      
      // Simulamos la carga por ahora
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success("¡Solicitud enviada a Recepción!", {
        description: "Nos comunicaremos a la brevedad."
      })
      setShowTicketModal(false)
      setTicketMessage("")
    } catch (error) {
      toast.error("Error al enviar la solicitud")
    } finally {
      setLoadingTicket(false)
    }
  }

  // Lógica de filtrado en tiempo real
  const filteredOrders = dentist.orders?.filter((order: any) => {
    const searchLower = searchTerm.toLowerCase()
    const fullName = `${order.patient.firstName} ${order.patient.lastName}`.toLowerCase()
    const reverseName = `${order.patient.lastName} ${order.patient.firstName}`.toLowerCase()
    const dni = order.patient.dni?.toString() || ""
    const orderCode = order.code?.toLowerCase() || ""
    
    return fullName.includes(searchLower) || 
           reverseName.includes(searchLower) || 
           dni.includes(searchLower) || 
           orderCode.includes(searchLower)
  }) || []

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      
      {/* ----------------- MODALES ----------------- */}

      {/* MODAL: MI PERFIL */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-[450px] bg-white rounded-2xl border-t-8 border-brand-600 p-8 outline-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-neutral-900 flex items-center gap-2">
              <Settings className="text-brand-600" size={24}/> Preferencias
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Teléfono (WhatsApp)</Label>
              <Input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="h-12 font-medium bg-neutral-50 focus-visible:ring-brand-600" placeholder="Ej: 1123456789" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Correo Electrónico</Label>
              <Input value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} type="email" className="h-12 font-medium bg-neutral-50 focus-visible:ring-brand-600" placeholder="doctor@email.com" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Formato Entrega</Label>
                <Select value={profileData.deliveryMethod} onValueChange={(v) => setProfileData({...profileData, deliveryMethod: v})}>
                  <SelectTrigger className="h-12 font-bold uppercase text-xs bg-neutral-50 focus:ring-brand-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIGITAL" className="font-medium text-sm">Digital</SelectItem>
                    <SelectItem value="IMPRESA" className="font-medium text-sm">Impreso</SelectItem>
                    <SelectItem value="AMBAS" className="font-medium text-sm">Ambas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Vía Principal</Label>
                <Select value={profileData.resultPreference} onValueChange={(v) => setProfileData({...profileData, resultPreference: v})}>
                  <SelectTrigger className="h-12 font-bold uppercase text-xs bg-neutral-50 focus:ring-brand-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP" className="font-medium text-sm">WhatsApp</SelectItem>
                    <SelectItem value="E-MAIL" className="font-medium text-sm">E-Mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleSaveProfile} disabled={loadingProfile} className="w-full h-12 mt-6 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase tracking-wider rounded-lg shadow-lg transition-all">
              {loadingProfile ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: NUEVA SOLICITUD (TICKET) */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl border-t-8 border-brand-600 p-8 outline-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-neutral-900 flex items-center gap-2">
              <MessageSquarePlus className="text-brand-600" size={24}/> Centro de Solicitudes
            </DialogTitle>
            <DialogDescription className="text-neutral-500">
              Enviá una consulta directa al equipo de recepción de I-R Dental. Te responderemos a la brevedad.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendTicket} className="space-y-5 py-4">
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Motivo de la consulta</Label>
              <Select value={ticketSubject} onValueChange={setTicketSubject}>
                <SelectTrigger className="h-12 font-bold bg-neutral-50 focus:ring-brand-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESTUDIO_FALTANTE" className="font-medium">Falta subir un estudio a mi portal</SelectItem>
                  <SelectItem value="ERROR_DATOS" className="font-medium">Error en los datos de un paciente</SelectItem>
                  <SelectItem value="CONSULTA_TECNICA" className="font-medium">Consulta sobre visor 3D/DICOM</SelectItem>
                  <SelectItem value="OTROS" className="font-medium">Otra consulta / Reclamo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Detalle su solicitud</Label>
              <textarea 
                placeholder="Por favor, incluya nombre del paciente, DNI o fecha aproximada del estudio para agilizar la búsqueda..." 
                value={ticketMessage}
                onChange={e => setTicketMessage(e.target.value)}
                className="flex w-full rounded-md border border-neutral-200 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] bg-neutral-50 font-medium resize-none focus-visible:ring-brand-600 p-3"
              />
            </div>
            
            <Button type="submit" disabled={loadingTicket} className="w-full h-12 mt-4 bg-brand-600 hover:bg-brand-700 text-white font-bold uppercase tracking-wider rounded-lg shadow-lg transition-all flex items-center justify-center gap-2">
              {loadingTicket ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>


      {/* ----------------- CABECERA DEL PORTAL ----------------- */}
      
      <div className="bg-neutral-900 relative overflow-hidden pb-8 sm:pb-12 pt-5 sm:pt-8">
        <div className="absolute inset-0 bg-[url('https://placehold.co/1920x400/1a1a1a/000000?text=+')] opacity-40 bg-cover mix-blend-multiply"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600"></div>
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          
          {/* Fila 1: Logo + acciones */}
          <div className="flex justify-between items-center mb-5 sm:mb-8 border-b border-neutral-800 pb-4 sm:pb-6">
            <Link href="/" className="flex items-center gap-3 group">
               <img src="/logo.png?v=2" alt="I-R Dental" className="h-8 md:h-10 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
               <div className="h-6 w-px bg-neutral-700 hidden sm:block"></div>
               <span className="text-brand-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs hidden sm:block">Portal Profesional</span>
            </Link>
            <div className="flex items-center gap-2">
              <a
                href="/orden.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-md border border-neutral-700 transition-all"
              >
                <Download size={14} className="text-brand-500" /> Descargar Orden PDF
              </a>
              {/* Ajustes — ícono en mobile, texto en desktop */}
              <Button
                onClick={() => setShowProfileModal(true)}
                variant="ghost"
                className="text-neutral-400 hover:text-white hover:bg-neutral-700 px-2.5 py-2 h-auto transition-colors rounded-lg"
                title="Ajustes del Perfil"
              >
                <Settings size={17} className="sm:mr-1.5"/>
                <span className="hidden sm:block text-xs font-bold uppercase">Ajustes</span>
              </Button>
              <Button onClick={handleLogout} variant="ghost" className="text-neutral-400 hover:text-white hover:bg-brand-600/20 px-2.5 py-2 h-auto text-xs uppercase font-bold transition-colors rounded-lg">
                <LogOut size={17} className="sm:mr-1.5"/> <span className="hidden sm:block">Salir</span>
              </Button>
            </div>
          </div>

          {/* Fila 2: Perfil del Odontólogo */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 border-2 border-brand-500/50 shadow-lg shadow-brand-900/40 flex items-center justify-center shrink-0">
              <span className="text-lg sm:text-2xl font-black text-white uppercase tracking-tighter">
                {dentist.lastName?.charAt(0)}{dentist.firstName?.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-tight truncate">
                Dr. {dentist.lastName}, {dentist.firstName}
              </h1>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <span className="text-xs font-bold text-neutral-400 uppercase bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                  MP: {dentist.matriculaProv || '---'}
                </span>
                <span className="text-xs font-bold text-neutral-400 uppercase bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                  MN: {dentist.matriculaNac || '---'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ----------------- CONTENIDO PRINCIPAL ----------------- */}
      
      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-20 space-y-6">
        
        {/* FILA DE CONTROLES: Buscador */}
        <div className="bg-white p-2 pl-4 rounded-xl shadow-md border border-neutral-200 flex items-center gap-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20 transition-all">
           <Search size={18} className="text-neutral-400 shrink-0"/>
           <Input
             placeholder="Buscar por apellido, nombre o DNI..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="border-none shadow-none focus-visible:ring-0 text-sm sm:text-base font-medium h-11 bg-transparent w-full"
           />
        </div>

        {/* BOTONES: Nueva Solicitud + Orden PDF — siempre en la misma fila */}
        <div className="flex gap-3">
          <Button
            onClick={() => setShowTicketModal(true)}
            className="flex-1 h-12 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase tracking-wider px-4 rounded-xl shadow-md flex items-center justify-center gap-2 border border-neutral-700 hover:border-neutral-500 transition-all text-xs sm:text-sm"
          >
            <MessageSquarePlus size={18} className="text-brand-500 shrink-0" />
            <span className="hidden sm:block">Crear Solicitud / Reclamo</span>
            <span className="sm:hidden">Nueva Solicitud</span>
          </Button>
          <a
            href="/orden.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-12 bg-brand-600 hover:bg-brand-700 text-white font-bold uppercase tracking-wider px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
          >
            <Download size={18} className="shrink-0" />
            Orden PDF
          </a>
        </div>

        {/* LISTADO DE PACIENTES */}
        <div className="space-y-6 mt-8">
          {dentist.orders?.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-neutral-300 shadow-sm">
              <FileText size={48} className="text-neutral-300 mx-auto mb-4" />
              <p className="text-lg font-bold uppercase text-neutral-800 mb-2">Aún no hay pacientes derivados</p>
              <p className="text-sm text-neutral-500 max-w-md mx-auto">Una vez que sus pacientes se realicen estudios en nuestras sedes, los informes e imágenes aparecerán aquí automáticamente.</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-neutral-300 shadow-sm">
              <Search size={40} className="text-neutral-300 mx-auto mb-4" />
              <p className="text-lg font-bold uppercase text-neutral-800 mb-1">No se encontraron resultados</p>
              <p className="text-sm text-neutral-500">No hay ningún paciente que coincida con "{searchTerm}".</p>
            </div>
          ) : (
            filteredOrders.map((order: any) => {
              const hasResults = (order.images && order.images.length > 0) || order.externalLink
              const statusColor = order.status === 'ENTREGADA' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : order.status === 'LISTA' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
              const statusLabel = order.status === 'ENTREGADA' ? 'Entregado' : order.status === 'LISTA' ? 'Listo para retirar' : 'En proceso'

              return (
              <Card key={order.id} className="border-none shadow-md hover:shadow-lg transition-shadow rounded-2xl overflow-hidden bg-white">
                {/* Barra superior de color según estado */}
                <div className={`h-1.5 w-full ${order.status === 'ENTREGADA' ? 'bg-emerald-500' : order.status === 'LISTA' ? 'bg-amber-400' : 'bg-neutral-300'}`}/>
                <CardContent className="p-4 sm:p-6">

                  {/* ── ENCABEZADO: Paciente + Estado + Fecha ── */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusColor}`}>{statusLabel}</span>
                        <span className="bg-neutral-100 text-neutral-500 text-[10px] font-bold px-2 py-0.5 rounded border border-neutral-200 flex items-center gap-1">
                          <Hash size={9}/> {order.code || 'S/D'}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black uppercase text-neutral-900 leading-tight truncate">
                        {order.patient.lastName}, <span className="font-medium">{order.patient.firstName}</span>
                      </h3>
                      <p className="text-xs font-medium text-neutral-400 mt-0.5">
                        DNI {order.patient.dni} {order.patient.obraSocial ? `· ${order.patient.obraSocial}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-100">
                      <p className="text-[9px] font-bold uppercase text-neutral-400 tracking-widest">Fecha</p>
                      <p className="text-sm font-bold text-neutral-800 flex items-center justify-end gap-1 mt-0.5">
                        <Calendar size={13} className="text-brand-600"/>
                        {new Date(order.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>

                  {/* ── PRÁCTICAS ── */}
                  <div className="mb-4">
                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-2 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500"/> Prácticas realizadas
                    </p>
                    <div className="space-y-2">
                      {order.items.map((item: any, i: number) => {
                        const teeth = item.metadata?.teeth || item.teeth || []
                        const locs  = item.metadata?.locations || item.locations || []
                        return (
                          <div key={item.id || i} className="flex items-start gap-3 bg-neutral-50 px-3 py-2.5 rounded-xl border border-neutral-100">
                            <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                            <div className="min-w-0">
                              <p className="font-bold uppercase text-neutral-800 text-xs leading-tight">{item.procedure?.name}</p>
                              {(teeth.length > 0 || locs.length > 0) && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {teeth.map((t: any) => (
                                    <span key={t} className="bg-neutral-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Pza {t}</span>
                                  ))}
                                  {locs.map((l: string) => (
                                    <span key={l} className="bg-neutral-200 text-neutral-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{l}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* ── RESULTADOS Y DESCARGAS ── */}
                  <div className={`rounded-xl border p-4 space-y-3 ${hasResults ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-50/50 border-dashed border-neutral-200'}`}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                      <ImageIcon size={12} className="text-brand-600"/> Resultados y Descargas
                    </h4>

                    {!hasResults ? (
                      <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-neutral-100">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                          <Clock size={14} className="text-neutral-400"/>
                        </div>
                        <p className="text-xs font-medium text-neutral-500">Estudio en proceso — los resultados aparecerán aquí a la brevedad.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {order.externalLink && (
                          <a
                            href={order.externalLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between bg-white border border-neutral-200 px-4 py-3 rounded-xl hover:border-brand-600 hover:shadow-sm transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-brand-50 p-2 rounded-lg text-brand-600 shrink-0">
                                <ExternalLink size={18}/>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Visor 3D / DICOM</p>
                                <p className="text-sm font-bold text-neutral-900 group-hover:text-brand-600 transition-colors">Abrir estudio en visor externo</p>
                              </div>
                            </div>
                            <ChevronRight size={18} className="text-neutral-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all shrink-0"/>
                          </a>
                        )}

                        {order.images && order.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {order.images.map((img: string, idx: number) => {
                              const isPDF = img.toLowerCase().includes('.pdf')
                              return (
                                <a key={idx} href={img} target="_blank" rel="noreferrer"
                                   className="relative group block rounded-xl overflow-hidden border border-neutral-200 shadow-sm bg-neutral-900 shrink-0"
                                   style={{ width: '5.5rem', height: '5rem' }}>
                                  {isPDF ? (
                                    <div className="w-full h-full bg-neutral-800 text-neutral-300 flex flex-col items-center justify-center">
                                      <FileText size={24} className="mb-1 text-brand-400"/>
                                      <span className="text-[9px] font-bold uppercase">PDF</span>
                                    </div>
                                  ) : (
                                    <img src={img} alt={`Imagen ${idx+1}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
                                  )}
                                  <div className="absolute inset-0 bg-brand-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Search size={16} className="text-white"/>
                                  </div>
                                </a>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </CardContent>
              </Card>
            )})
          )}
        </div>
      </div>
    </div>
  )
}