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
  Search, Hash, FileText, ExternalLink, Settings, MessageSquarePlus, Download, ChevronRight
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
          
          {/* Fila 1: Logo, Descarga Orden y Salir */}
          <div className="flex justify-between items-center mb-5 sm:mb-8 border-b border-neutral-800 pb-4 sm:pb-6">
            <Link href="/" className="flex items-center gap-3 group">
               <img src="/logo.png?v=2" alt="I-R Dental" className="h-8 md:h-10 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
               <div className="h-6 w-px bg-neutral-700 hidden sm:block"></div>
               <span className="text-brand-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs hidden sm:block">Portal Profesional</span>
            </Link>
            <div className="flex gap-3">
              <a 
                href="/orden.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-md border border-neutral-700 transition-all"
              >
                <Download size={14} className="text-brand-500" /> Descargar Orden PDF
              </a>
              <Button onClick={handleLogout} variant="ghost" className="text-neutral-400 hover:text-white hover:bg-brand-600/20 px-3 py-2 h-auto text-xs uppercase font-bold transition-colors">
                <LogOut size={16} className="sm:mr-2"/> <span className="hidden sm:block">Cerrar Sesión</span>
              </Button>
            </div>
          </div>

          {/* Fila 2: Perfil del Odontólogo */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5 w-full md:w-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 border-2 border-brand-500/50 shadow-lg shadow-brand-900/40 flex items-center justify-center shrink-0">
                <span className="text-lg sm:text-2xl font-black text-white uppercase tracking-tighter">
                  {dentist.lastName?.charAt(0)}{dentist.firstName?.charAt(0)}
                </span>
              </div>
              <div className="w-full min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-tight truncate">
                  Dr. {dentist.lastName}, {dentist.firstName}
                </h1>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="text-xs font-bold text-neutral-400 uppercase bg-neutral-800 px-2 py-1 rounded border border-neutral-700">
                    MP: {dentist.matriculaProv || '---'}
                  </span>
                  <span className="text-xs font-bold text-neutral-400 uppercase bg-neutral-800 px-2 py-1 rounded border border-neutral-700">
                    MN: {dentist.matriculaNac || '---'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex w-full md:w-auto">
              <Button onClick={() => setShowProfileModal(true)} variant="outline" className="h-12 w-full md:w-auto md:px-6 bg-neutral-800/80 border border-neutral-700 hover:bg-neutral-700 text-neutral-300 hover:text-white shrink-0 shadow-lg transition-colors flex items-center justify-center">
                <Settings size={18} className="mr-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Ajustes del Perfil</span>
              </Button>
            </div>
          </div>
        </div>
      </div>


      {/* ----------------- CONTENIDO PRINCIPAL ----------------- */}
      
      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-20 space-y-6">
        
        {/* FILA DE CONTROLES: Buscador y Botón de Solicitudes */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-white p-2 pl-4 rounded-xl shadow-md border border-neutral-200 flex items-center gap-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20 transition-all">
             <Search size={20} className="text-neutral-400"/>
             <Input 
               placeholder="Buscar paciente por apellido, nombre o DNI..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="border-none shadow-none focus-visible:ring-0 text-base md:text-lg font-medium h-12 bg-transparent w-full"
             />
          </div>
          
          <Button 
            onClick={() => setShowTicketModal(true)}
            className="h-16 md:h-16 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase tracking-wider px-6 rounded-xl shadow-md flex items-center justify-center gap-2 shrink-0 border border-neutral-700 hover:border-neutral-500 transition-all"
          >
            <MessageSquarePlus size={20} className="text-brand-500" />
            <span className="hidden sm:block">Crear Solicitud / Reclamo</span>
            <span className="sm:hidden">Nueva Solicitud</span>
          </Button>

          {/* Botón Descarga Orden (Solo Móvil) */}
          <a 
            href="/orden.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            className="md:hidden h-16 bg-brand-600 hover:bg-brand-700 text-white font-bold uppercase tracking-wider px-6 rounded-xl shadow-md flex items-center justify-center gap-2 shrink-0 transition-all"
          >
            <Download size={20} />
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
            filteredOrders.map((order: any) => (
              <Card key={order.id} className="border-none shadow-md hover:shadow-lg transition-shadow rounded-xl overflow-hidden bg-white border-l-[6px] border-l-brand-600">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  
                  {/* Cabecera del Paciente */}
                  <div className="flex flex-col md:flex-row justify-between gap-3 border-b border-neutral-100 pb-4 mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Paciente</span>
                        <span className="bg-neutral-100 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded border border-neutral-200 flex items-center gap-1">
                          <Hash size={10}/> Orden {order.code || 'S/D'}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold uppercase text-neutral-900 leading-none truncate">
                        {order.patient.lastName}, <span className="font-medium">{order.patient.firstName}</span>
                      </h3>
                      <p className="text-sm font-medium text-neutral-500 mt-2 flex items-center gap-1.5">
                         <span className="uppercase text-[10px] font-bold tracking-widest">DNI:</span> {order.patient.dni}
                      </p>
                    </div>
                    <div className="text-left md:text-right bg-neutral-50 p-4 rounded-lg border border-neutral-200 shrink-0 self-start md:self-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Fecha del Estudio</p>
                      <p className="text-lg font-bold text-neutral-800 flex items-center md:justify-end gap-2">
                        <Calendar size={18} className="text-brand-600"/> {new Date(order.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                  
                  {/* DETALLE DE PRÁCTICAS, PIEZAS Y SECTORES */}
                  <div className="mb-6">
                     <p className="text-[10px] font-bold uppercase text-neutral-500 tracking-widest mb-3 flex items-center gap-1.5">
                       <CheckCircle2 size={14} className="text-green-600"/> Prácticas Realizadas
                     </p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {order.items.map((item: any, i: number) => (
                         <div key={item.id || i} className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 flex flex-col justify-center">
                           <p className="font-bold uppercase text-neutral-800 text-sm leading-tight mb-2">{item.procedure?.name}</p>
                           
                           {/* Piezas / Sectores */}
                           <div className="flex flex-wrap gap-x-4 gap-y-2">
                             {(item.metadata?.teeth || item.teeth)?.length > 0 && (
                               <div className="flex items-center gap-1.5">
                                 <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Piezas:</span>
                                 <div className="flex flex-wrap gap-1">
                                   {(item.metadata?.teeth || item.teeth).map((tooth: any) => (
                                     <span key={tooth} className="bg-neutral-900 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-sm">
                                       {tooth}
                                     </span>
                                   ))}
                                 </div>
                               </div>
                             )}

                             {(item.metadata?.locations || item.locations)?.length > 0 && (
                               <div className="flex items-center gap-1.5">
                                 <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Sector:</span>
                                 <div className="flex flex-wrap gap-1">
                                   {(item.metadata?.locations || item.locations).map((loc: string) => (
                                     <span key={loc} className="bg-neutral-200 text-neutral-800 text-xs font-bold px-2 py-0.5 rounded border border-neutral-300 uppercase">
                                       {loc}
                                     </span>
                                   ))}
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                       ))}
                     </div>
                  </div>

                  {/* 👉 ARCHIVOS: FOTOS, PDFS Y LINKS EXTERNOS */}
                  <div className="bg-neutral-100 p-5 rounded-xl border border-neutral-200 space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                      <ImageIcon className="text-brand-600" size={18}/> Resultados y Descargas
                    </h4>

                    {(!order.images || order.images.length === 0) && !order.externalLink ? (
                      <div className="bg-white p-4 rounded-lg border border-neutral-200 text-center">
                         <p className="text-sm font-medium text-neutral-500">El estudio se encuentra en proceso. Los resultados estarán disponibles aquí a la brevedad.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        
                        {/* LINK EXTERNO DE DRIVE/WETRANSFER (Tomografías) */}
                        {order.externalLink && (
                          <a 
                            href={order.externalLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center justify-between bg-white border border-neutral-200 p-4 rounded-lg hover:border-brand-600 hover:shadow-md transition-all group"
                          >
                            <div className="flex items-center gap-4">
                               <div className="bg-brand-50 p-2 rounded text-brand-600">
                                  <ExternalLink size={24} />
                               </div>
                               <div>
                                 <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-0.5">Visor DICOM / Tomografía 3D</p>
                                 <p className="text-sm font-bold text-neutral-900 group-hover:text-brand-600 transition-colors">Abrir enlace externo de descarga</p>
                               </div>
                            </div>
                            <ChevronRight size={20} className="text-neutral-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                          </a>
                        )}

                        {/* GALERÍA DE IMÁGENES Y PDFS (Panorámicas / Cefalometría) */}
                        {order.images && order.images.length > 0 && (
                          <div className="flex flex-wrap gap-4 pt-2">
                            {order.images.map((img: string, idx: number) => {
                              const isPDF = img.toLowerCase().includes('.pdf')
                              
                              return (
                                <a key={idx} href={img} target="_blank" rel="noreferrer" className="relative group block h-32 w-40 rounded-lg overflow-hidden border border-neutral-300 shadow-sm bg-neutral-900 shrink-0">
                                  {isPDF ? (
                                    <div className="w-full h-full bg-neutral-800 text-neutral-300 flex flex-col items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                                      <FileText size={32} className="mb-2 text-brand-500" />
                                      <span className="text-[10px] font-bold uppercase tracking-widest">Informe PDF</span>
                                    </div>
                                  ) : (
                                    <img src={img} alt={`Placa ${idx+1}`} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                  )}
                                  
                                  {/* Overlay hover */}
                                  <div className="absolute inset-0 bg-brand-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                    <Search size={20} className="mb-2"/>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-center">Visualizar</span>
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
            ))
          )}
        </div>
      </div>
    </div>
  )
}