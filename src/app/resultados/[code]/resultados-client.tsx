"use client"

import { useState } from "react"
import IRDentalLogo from "@/components/icons/irdental-logo"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getPatientResults } from "@/actions/portal"
import { usePathname } from "next/navigation"
import {
  ShieldCheck, Image as ImageIcon, Download,
  Calendar, MapPin, Hash, CheckCircle2, History,
  FileText, ExternalLink, Lock
} from "lucide-react"
import ToothIcon from "@/components/icons/tooth-icon"
import Link from "next/link"

export default function ResultadosClient() {
  const pathname = usePathname()
  const accessCode = pathname.split('/').pop() || ""

  const [dni, setDni] = useState("")
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [patient, setPatient] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dni || dni.length < 5) return toast.error("Ingresá un DNI válido")
    setLoading(true)
    const res = await getPatientResults(accessCode, dni)
    if (res.success) {
      setPatient(res.patient)
      setOrders(res.orders || [])
      setIsAuthenticated(true)
      toast.success("Identidad verificada", { icon: "🔒" })
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  // --- PANTALLA 1: VERIFICACIÓN DE DNI ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center relative overflow-hidden px-4">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-brand-950 opacity-80" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600" />

        <div className="relative z-10 w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4 mb-2">
            <Link href="/" className="flex items-center gap-4 group">
              <img src="/logo.png?v=2" alt="i-R Dental" className="h-14 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="h-10 w-px bg-white/20" />
              <IRDentalLogo className="h-8 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
            </Link>
            <span className="text-brand-400 font-bold uppercase tracking-widest text-xs">Portal de Pacientes</span>
          </div>

          {/* Card de login */}
          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto bg-brand-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border-2 border-brand-100">
                  <ShieldCheck size={28} className="text-brand-600" />
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Verificá tu identidad</h1>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Ingresá tu DNI para acceder a tus estudios de forma segura.
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">Número de DNI</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    <Input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Ej: 35123456"
                      value={dni}
                      onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                      className="h-13 pl-11 text-base font-semibold border-2 focus-visible:ring-brand-600 focus-visible:border-brand-400 bg-slate-50 rounded-xl placeholder:text-slate-300"
                      autoFocus
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 bg-brand-600 hover:bg-brand-700 text-white font-bold uppercase rounded-xl shadow-lg transition-all text-sm border-b-4 border-brand-800 active:border-b-0 active:translate-y-px"
                >
                  {loading ? "Verificando..." : "Acceder a mis estudios"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center space-y-1.5">
            <p className="text-xs text-neutral-500">¿Problemas para acceder?</p>
            <a href="tel:08103334507" className="block text-base font-bold text-brand-400 hover:text-brand-300 tracking-wider transition-colors">
              0810 333 4507
            </a>
            <a href="mailto:info@irdental.com.ar" className="block text-xs text-neutral-500 hover:text-brand-400 transition-colors">
              info@irdental.com.ar
            </a>
          </div>
        </div>
      </div>
    )
  }

  // --- PANTALLA 2: HISTORIAL ---
  return (
    <div className="min-h-screen bg-neutral-50 pb-16">

      {/* HEADER */}
      <div className="bg-neutral-900 relative overflow-hidden pb-8 pt-5">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-brand-950 opacity-80" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600" />

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          {/* Logo row */}
          <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/logo.png?v=2" alt="i-R Dental" className="h-9 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="h-6 w-px bg-neutral-700 hidden sm:block" />
              <IRDentalLogo className="h-5 w-auto opacity-80 group-hover:opacity-100 transition-opacity hidden sm:block" />
            </Link>
            <span className="text-[10px] font-black uppercase text-neutral-500 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-500"/> Sesión verificada
            </span>
          </div>

          {/* Paciente row */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 border-2 border-brand-500/50 flex items-center justify-center shrink-0">
              <span className="text-lg font-black text-white uppercase">
                {patient?.lastName?.charAt(0)}{patient?.firstName?.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                {patient?.lastName}, <span className="text-brand-400">{patient?.firstName}</span>
              </h1>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-xs font-bold text-neutral-400 uppercase bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                  DNI: {patient?.dni}
                </span>
                <span className="text-xs font-bold text-neutral-400 uppercase bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 flex items-center gap-1">
                  <History size={10}/> {orders.length} visita{orders.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-4xl mx-auto px-4 -mt-4 relative z-10 space-y-6">
        {orders.map((order, index) => (
          <Card key={order.id} className={`border-none shadow-xl rounded-[2rem] overflow-hidden bg-white border-t-8 ${index === 0 ? 'border-brand-700' : 'border-slate-200'}`}>

            {index === 0 && (
              <div className="absolute top-0 right-6 bg-brand-700 text-white text-[9px] font-black uppercase px-3 py-1 rounded-b-xl tracking-widest">
                Más Reciente
              </div>
            )}

            <CardContent className="p-6 md:p-8">

              {/* Cabecera de la orden */}
              <div className="flex flex-col md:flex-row justify-between gap-4 border-b-2 border-slate-100 pb-5 mb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Visita</p>
                  <div className="flex items-center gap-2">
                    <Hash size={15} className="text-slate-300" />
                    <h3 className="text-xl font-black uppercase text-slate-800">Orden {order.code || 'S/D'}</h3>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-left md:text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fecha</p>
                  <p className="text-base font-black italic text-slate-800 flex items-center md:justify-end gap-1.5">
                    <Calendar size={15} className="text-brand-600" />
                    {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Médico y Sede */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div className="flex items-center gap-3 bg-brand-50/50 p-3 rounded-xl border border-brand-100">
                  <ToothIcon size={18} className="text-brand-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Médico Solicitante</p>
                    <p className="text-sm font-black uppercase text-slate-800">
                      {order.dentist ? `${order.dentist.lastName}, ${order.dentist.firstName}` : 'Particular'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <MapPin size={18} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Sede</p>
                    <p className="text-sm font-black uppercase text-slate-800">{order.branch?.name}</p>
                  </div>
                </div>
              </div>

              {/* Prácticas */}
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Estudios Realizados</p>
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item: any) => (
                    <span key={item.id} className="bg-slate-900 text-white text-xs font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 size={11} className="text-emerald-400" /> {item.procedure?.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Archivos */}
              <div>
                <h4 className="text-sm font-black uppercase italic text-slate-800 flex items-center gap-2 border-b-2 border-slate-100 pb-2 mb-4">
                  <ImageIcon className="text-brand-600" size={15} /> Archivos Digitales
                </h4>

                {order.externalLink && (
                  <div className="bg-blue-50 border-2 border-blue-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-200/50 p-2 rounded-full shrink-0">
                        <ExternalLink size={22} className="text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase text-blue-900 leading-none mb-1">Descarga Externa</p>
                        <p className="text-xs font-bold text-blue-600">Este estudio incluye archivos pesados o carpetas ZIP.</p>
                      </div>
                    </div>
                    <a href={order.externalLink} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs rounded-xl">
                        Abrir <ExternalLink size={13} className="ml-1.5" />
                      </Button>
                    </a>
                  </div>
                )}

                {(!order.images || order.images.length === 0) && !order.externalLink ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <ImageIcon size={28} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-black uppercase text-slate-400">Sin archivos digitales disponibles</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {order.images?.map((img: string, idx: number) => {
                      const isPDF = img.toLowerCase().includes('.pdf')
                      return (
                        <div key={idx} className="bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 group flex flex-col">
                          {isPDF ? (
                            <a href={img} target="_blank" rel="noreferrer" className="flex-1 aspect-[4/3] bg-slate-800 flex flex-col items-center justify-center text-slate-400 hover:text-white transition-colors relative">
                              <FileText size={44} className="mb-2" />
                              <span className="font-black text-lg tracking-widest">PDF</span>
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <span className="bg-brand-700 text-white font-black uppercase text-[10px] px-3 py-1.5 rounded-lg">Abrir Documento</span>
                              </div>
                            </a>
                          ) : (
                            <a href={img} target="_blank" rel="noreferrer" className="flex-1 aspect-[4/3] bg-black relative block">
                              <img src={img} alt={`Estudio ${idx + 1}`} className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <span className="bg-brand-700 text-white font-black uppercase text-[10px] px-3 py-1.5 rounded-lg">Ver completo</span>
                              </div>
                            </a>
                          )}
                          <div className="p-3 bg-white flex justify-between items-center border-t border-slate-100">
                            <span className="text-[10px] font-black uppercase text-slate-400">
                              {isPDF ? `Doc. ${idx + 1}` : `Imagen ${idx + 1}`}
                            </span>
                            <a href={img} download target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase border-slate-200 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700">
                                <Download size={11} className="mr-1.5" /> Descargar
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
