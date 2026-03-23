"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { logoutDentist } from "@/actions/dentist-auth"
import { updateDentistProfile } from "@/actions/dentist-auth" // 👉 Asegurate que esta ruta sea correcta
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Stethoscope, LogOut, Calendar, CheckCircle2, Image as ImageIcon, 
  Search, Hash, FileText, Link as LinkIcon, ExternalLink, Settings, Users
} from "lucide-react"

export default function PanelMedicoClient({ dentist }: { dentist: any }) {
  const router = useRouter()
  
  // Estados
  const [searchTerm, setSearchTerm] = useState("")
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  
  // Estado del formulario del perfil
  const [profileData, setProfileData] = useState({
    phone: dentist.phone || "",
    email: dentist.email || "",
    deliveryMethod: dentist.deliveryMethod || "DIGITAL",
    resultPreference: dentist.resultPreference || "WHATSAPP"
  })

  const handleLogout = async () => {
    await logoutDentist()
    router.push("/portal-medico")
  }

  const handleSaveProfile = async () => {
    setLoadingProfile(true);
    const res = await updateDentistProfile(dentist.id, profileData);
    if (res.success) {
      toast.success("Perfil actualizado correctamente ✓");
      setShowProfileModal(false);
      router.refresh();
    } else {
      toast.error("Error al actualizar el perfil");
    }
    setLoadingProfile(false);
  }

  // Lógica de filtrado en tiempo real
  const filteredOrders = dentist.orders?.filter((order: any) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${order.patient.firstName} ${order.patient.lastName}`.toLowerCase();
    const reverseName = `${order.patient.lastName} ${order.patient.firstName}`.toLowerCase();
    const dni = order.patient.dni?.toString() || "";
    const orderCode = order.code?.toLowerCase() || "";
    
    return fullName.includes(searchLower) || 
           reverseName.includes(searchLower) || 
           dni.includes(searchLower) || 
           orderCode.includes(searchLower);
  }) || [];

  const totalPacientes = dentist.orders?.length || 0;

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      
      {/* MODAL DE MI PERFIL */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-[450px] bg-white rounded-[2rem] border-t-8 border-red-700 p-8 outline-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
              <Settings className="text-red-700" size={24}/> Mi Perfil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Teléfono (WhatsApp)</Label>
              <Input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="h-12 font-bold border-2" placeholder="Ej: 1123456789" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">E-Mail</Label>
              <Input value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} type="email" className="h-12 font-bold border-2 lowercase" placeholder="doctor@email.com" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Recibir Placas</Label>
                <Select value={profileData.deliveryMethod} onValueChange={(v) => setProfileData({...profileData, deliveryMethod: v})}>
                  <SelectTrigger className="h-12 font-black uppercase text-xs border-2"><SelectValue /></SelectTrigger>
                  <SelectContent className="font-black uppercase text-xs">
                    <SelectItem value="DIGITAL">Digital</SelectItem>
                    <SelectItem value="IMPRESA">Impreso</SelectItem>
                    <SelectItem value="AMBAS">Ambas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vía Digital</Label>
                <Select value={profileData.resultPreference} onValueChange={(v) => setProfileData({...profileData, resultPreference: v})}>
                  <SelectTrigger className="h-12 font-black uppercase text-xs border-2"><SelectValue /></SelectTrigger>
                  <SelectContent className="font-black uppercase text-xs">
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="E-MAIL">E-Mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleSaveProfile} disabled={loadingProfile} className="w-full h-14 mt-4 bg-red-700 hover:bg-red-800 text-white font-black uppercase italic rounded-xl shadow-md transition-all">
              {loadingProfile ? "Guardando..." : "Guardar Preferencias ✓"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* HEADER CORPORATIVO */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-b-[3rem] shadow-2xl border-b-8 border-red-700">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 shrink-0">
              <Stethoscope size={36} className="text-white" />
            </div>
            <div className="w-full">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Portal de Profesionales</p>
              <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter truncate">
                Dr. {dentist.lastName}, {dentist.firstName}
              </h1>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase">
                MP: {dentist.matriculaProv || '---'} | MN: {dentist.matriculaNac || '---'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* ESTADÍSTICA RÁPIDA */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-center w-full sm:w-auto flex items-center justify-center gap-3">
              <Users className="text-slate-400" size={18}/>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Pacientes Derivados</p>
                <p className="text-xl font-black italic leading-none">{totalPacientes}</p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => setShowProfileModal(true)} variant="outline" className="flex-1 sm:flex-none hover:bg-slate-800 hover:text-white text-slate-200 font-black uppercase text-xs h-12 px-4 rounded-xl transition-colors border-slate-700 bg-slate-800/50">
                <Settings size={16} className="mr-2"/> Perfil
              </Button>
              <Button onClick={handleLogout} variant="ghost" className="flex-1 sm:flex-none hover:bg-red-700 hover:text-white text-slate-300 font-black uppercase text-xs h-12 px-4 rounded-xl transition-colors border border-slate-700">
                <LogOut size={16} className="mr-2 md:mr-0"/> <span className="md:hidden">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
        
        {/* BUSCADOR INTELIGENTE */}
        <div className="bg-white p-2 pl-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 focus-within:border-red-700 focus-within:ring-4 focus-within:ring-red-700/10 transition-all">
           <Search size={24} className="text-slate-400"/>
           <Input 
             placeholder="Buscar paciente por nombre, apellido o DNI..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="border-none shadow-none focus-visible:ring-0 text-lg font-bold h-14 bg-transparent"
           />
        </div>

        {/* LISTADO DE PACIENTES */}
        <div className="space-y-4">
          {dentist.orders?.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
              <Stethoscope size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-black uppercase text-slate-400">Aún no hay pacientes derivados.</p>
              <p className="text-xs font-bold text-slate-400 mt-1">Los estudios de sus pacientes aparecerán aquí automáticamente.</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
              <Search size={48} className="text-slate-200 mx-auto mb-4" />
              <p className="text-lg font-black uppercase text-slate-400">No se encontraron resultados</p>
              <p className="text-xs font-bold text-slate-400 mt-1">No hay ningún paciente que coincida con "{searchTerm}".</p>
            </div>
          ) : (
            filteredOrders.map((order: any) => (
              <Card key={order.id} className="border-none shadow-md hover:shadow-xl transition-shadow rounded-[2rem] overflow-hidden bg-white border-l-8 border-l-slate-900">
                <CardContent className="p-6">
                  
                  <div className="flex flex-col md:flex-row justify-between gap-4 border-b-2 border-slate-100 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paciente</span>
                        <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase border border-slate-200 flex items-center gap-1">
                          <Hash size={10}/> Orden {order.code || 'S/D'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black uppercase text-slate-900 leading-none">
                        {order.patient.lastName}, <span className="text-red-700">{order.patient.firstName}</span>
                      </h3>
                      <p className="text-xs font-bold text-slate-500 uppercase mt-2">DNI: {order.patient.dni}</p>
                    </div>
                    <div className="text-left md:text-right bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fecha de Estudio</p>
                      <p className="text-lg font-black italic text-slate-800 flex items-center md:justify-end gap-1.5">
                        <Calendar size={16} className="text-red-700"/> {new Date(order.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                  
                  {/* DETALLE DE PRÁCTICAS, PIEZAS Y SECTORES */}
                  <div className="mb-6">
                     <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Prácticas y Sectores Evaluados</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                       {order.items.map((item: any, i: number) => (
                         <div key={item.id || i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-center">
                           <div className="flex items-start gap-2">
                             <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/>
                             <div className="flex-1">
                               <p className="font-black uppercase text-slate-800 text-xs leading-tight">{item.procedure?.name}</p>
                               
                               {(item.metadata?.teeth || item.teeth)?.length > 0 && (
                                 <div className="mt-2 flex flex-wrap gap-1 items-center">
                                   <span className="text-[9px] font-black text-slate-400 uppercase mr-1">Piezas:</span>
                                   {(item.metadata?.teeth || item.teeth).map((tooth: any) => (
                                     <span key={tooth} className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                       {tooth}
                                     </span>
                                   ))}
                                 </div>
                               )}

                               {(item.metadata?.locations || item.locations)?.length > 0 && (
                                 <div className="mt-2 flex flex-wrap gap-1 items-center">
                                   <span className="text-[9px] font-black text-slate-400 uppercase mr-1">Sector:</span>
                                   {(item.metadata?.locations || item.locations).map((loc: string) => (
                                     <span key={loc} className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300">
                                       {loc}
                                     </span>
                                   ))}
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                  </div>

                  {/* 👉 ARCHIVOS: FOTOS, PDFS Y LINKS EXTERNOS */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-sm font-black uppercase italic text-slate-800 flex items-center gap-2">
                      <ImageIcon className="text-red-700" size={16}/> Resultados del Estudio
                    </h4>

                    {(!order.images || order.images.length === 0) && !order.externalLink ? (
                      <p className="text-xs font-bold text-slate-400 uppercase italic">El estudio aún no posee resultados cargados.</p>
                    ) : (
                      <div className="space-y-4">
                        
                        {/* LINK EXTERNO DE DRIVE/WETRANSFER */}
                        {order.externalLink && (
                          <a 
                            href={order.externalLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-3 bg-blue-50 border-2 border-blue-200 text-blue-700 p-3 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-700 transition-all group shadow-sm w-fit"
                          >
                            <ExternalLink size={20} className="shrink-0" />
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-0.5">Link Externo</p>
                              <p className="text-sm font-black uppercase">Descargar Archivos Pesados</p>
                            </div>
                          </a>
                        )}

                        {/* GALERÍA DE IMÁGENES Y PDFS */}
                        {order.images && order.images.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {order.images.map((img: string, idx: number) => {
                              const isPDF = img.toLowerCase().includes('.pdf');
                              
                              return (
                                <a key={idx} href={img} target="_blank" rel="noreferrer" className="relative group block h-24 w-32 rounded-xl overflow-hidden border-2 border-slate-300 shadow-sm bg-black shrink-0">
                                  {isPDF ? (
                                    <div className="w-full h-full bg-slate-800 text-slate-300 flex flex-col items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                                      <FileText size={24} className="mb-1 text-slate-400" />
                                      <span className="text-[10px] font-black uppercase">Ver PDF</span>
                                    </div>
                                  ) : (
                                    <img src={img} alt={`Placa ${idx+1}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                  )}
                                  
                                  {/* Overlay hover */}
                                  <div className="absolute inset-0 bg-red-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                    <Search size={16} className="mb-1"/>
                                    <span className="text-[9px] font-black uppercase text-center leading-tight">Abrir</span>
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