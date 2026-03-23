"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getPatientResults } from "@/actions/portal"
import { usePathname } from "next/navigation" 
import { 
  ShieldCheck, Activity, Image as ImageIcon, Download, 
  Calendar, Stethoscope, MapPin, Hash, CheckCircle2, History,
  FileText, ExternalLink // 👉 Importamos un par de iconos nuevos
} from "lucide-react"

export default function ResultadosClient() { 
  
  const pathname = usePathname()
  const accessCode = pathname.split('/').pop() || ""

  const [dni, setDni] = useState("")
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const [patient, setPatient] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni || dni.length < 5) return toast.error("Ingresá un DNI válido");

    setLoading(true);
    const res = await getPatientResults(accessCode, dni);
    
    if (res.success) {
      setPatient(res.patient);
      setOrders(res.orders);
      setIsAuthenticated(true);
      toast.success("Identidad verificada", { icon: "🔒" });
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  }

  // --- PANTALLA 1: VALIDACIÓN DE DNI ---
  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white border-t-8 border-t-red-700 animate-in zoom-in-95 duration-300">
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck size={40} className="text-red-700" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Portal de Pacientes</h1>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-widest leading-relaxed">
              Estudios Radiológicos Digitales
            </p>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 text-left space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
              <Activity size={12}/> Verificación de Identidad
            </p>
            <p className="text-xs font-bold text-slate-400">
              Por motivos de privacidad médica, ingresá tu número de documento para acceder a tu historial.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <Input 
              type="number" 
              placeholder="Número de DNI..." 
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="h-14 text-center font-black text-xl tracking-widest border-2 focus-visible:ring-red-700 bg-slate-50 rounded-xl"
              autoFocus
            />
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic rounded-xl shadow-lg transition-all"
            >
              {loading ? "Verificando..." : "Acceder a mis estudios"}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  // --- PANTALLA 2: HISTORIAL CLÍNICO ---
  return (
    <div className="w-full max-w-3xl space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* HEADER DE LA CLÍNICA */}
      <div className="text-center space-y-1 mb-8">
        <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Tu Clínica</h1>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Historial Clínico Digital</p>
      </div>

      {/* TARJETA MAESTRA DEL PACIENTE */}
      <Card className="border-none shadow-md rounded-[2rem] overflow-hidden bg-white border-t-8 border-slate-900 mb-8">
        <CardContent className="p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Paciente</p>
          <h2 className="text-3xl font-black uppercase text-slate-900 leading-none">
            {patient.lastName}, <span className="text-red-700">{patient.firstName}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">DNI: {patient.dni}</span>
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <History size={14} className="text-slate-400"/> {orders.length} Visitas registradas
            </span>
          </div>
        </CardContent>
      </Card>

      {/* LÍNEA DE TIEMPO DE ESTUDIOS */}
      <div className="space-y-8">
        {orders.map((order, index) => (
          <Card key={order.id} className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white border-t-8 border-red-700 relative">
            
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-red-700 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-widest">
                Más Reciente
              </div>
            )}

            <CardContent className="p-6 md:p-8">
              
              {/* Info del Estudio */}
              <div className="flex flex-col md:flex-row justify-between gap-4 border-b-2 border-slate-100 pb-6 mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Detalle de la Visita</p>
                  <div className="flex items-center gap-2">
                    <Hash size={16} className="text-slate-300"/>
                    <h3 className="text-xl font-black uppercase text-slate-800 leading-none">Orden {order.code || 'S/D'}</h3>
                  </div>
                </div>
                <div className="text-left md:text-right bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fecha de Realización</p>
                  <p className="text-lg font-black italic text-slate-800 flex items-center md:justify-end gap-1.5">
                    <Calendar size={16} className="text-red-700"/> {new Date(order.createdAt).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>

              {/* Médico y Sede */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3 bg-red-50/50 p-4 rounded-xl border border-red-100">
                  <Stethoscope size={20} className="text-red-700 shrink-0"/>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Médico Solicitante</p>
                    <p className="text-sm font-black uppercase text-slate-800">{order.dentist ? `Dr. ${order.dentist.lastName}, ${order.dentist.firstName}` : 'Particular'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <MapPin size={20} className="text-slate-400 shrink-0"/>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Sede de Atención</p>
                    <p className="text-sm font-black uppercase text-slate-800">{order.branch?.name}</p>
                  </div>
                </div>
              </div>
              
              {/* Prácticas Realizadas */}
              <div className="mb-8">
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Prácticas Realizadas</p>
                 <div className="flex flex-wrap gap-2">
                   {order.items.map((item: any) => (
                     <span key={item.id} className="bg-slate-900 text-white text-xs font-black uppercase px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
                       <CheckCircle2 size={12} className="text-emerald-400"/> {item.procedure?.name}
                     </span>
                   ))}
                 </div>
              </div>

              {/* Archivos Digitales */}
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase italic text-slate-800 flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                  <ImageIcon className="text-red-700" size={16}/> Archivos Digitales
                </h4>

                {/* 👉 NUEVO: SECCIÓN DE ENLACE EXTERNO (Drive/WeTransfer) */}
                {order.externalLink && (
                  <div className="bg-blue-50 border-2 border-blue-100 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 text-center md:text-left">
                      <div className="bg-blue-200/50 p-2 rounded-full shrink-0">
                        <ExternalLink size={24} className="text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase text-blue-900 leading-none mb-1">Descarga Externa</p>
                        <p className="text-xs font-bold text-blue-700">Este estudio contiene archivos pesados o carpetas ZIP.</p>
                      </div>
                    </div>
                    <a href={order.externalLink} target="_blank" rel="noreferrer" className="w-full md:w-auto">
                      <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs rounded-xl shadow-md">
                        Abrir Enlace <ExternalLink size={14} className="ml-2" />
                      </Button>
                    </a>
                  </div>
                )}

                {(!order.images || order.images.length === 0) && !order.externalLink ? (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <ImageIcon size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-black uppercase text-slate-400">Sin archivos digitales</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Este estudio no contiene placas ni documentos adjuntos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.images?.map((img: string, idx: number) => {
                      const isPDF = img.toLowerCase().includes('.pdf');

                      return (
                        <div key={idx} className="bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner group flex flex-col">
                          
                          {/* 👉 NUEVO: RENDERIZADO INTELIGENTE (IMAGEN vs PDF) */}
                          {isPDF ? (
                            <a href={img} target="_blank" rel="noreferrer" className="flex-1 relative aspect-[4/3] bg-slate-800 flex flex-col items-center justify-center text-slate-400 hover:text-white transition-colors">
                              <FileText size={48} className="mb-2" />
                              <span className="font-black text-xl tracking-widest">PDF</span>
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <span className="bg-red-700 text-white font-black uppercase text-[10px] px-3 py-1.5 rounded-lg shadow-lg">Abrir Documento</span>
                              </div>
                            </a>
                          ) : (
                            <a href={img} target="_blank" rel="noreferrer" className="flex-1 relative aspect-[4/3] bg-black">
                              <img src={img} alt={`Estudio ${idx + 1}`} className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <span className="bg-red-700 text-white font-black uppercase text-[10px] px-3 py-1.5 rounded-lg shadow-lg">Ver en pantalla completa</span>
                              </div>
                            </a>
                          )}

                          <div className="p-3 bg-white flex justify-between items-center border-t border-slate-100">
                            <span className="text-[10px] font-black uppercase text-slate-400">
                              {isPDF ? `Documento ${idx + 1}` : `Imagen ${idx + 1}`}
                            </span>
                            <a href={img} download target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase border-slate-200 text-slate-700 hover:bg-slate-50">
                                <Download size={12} className="mr-1.5"/> Descargar
                              </Button>
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  )
}