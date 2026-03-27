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
import { createTicket, markRespondidosAsRead } from "@/actions/tickets"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  LogOut, Calendar, CheckCircle2, Image as ImageIcon,
  Search, Hash, FileText, ExternalLink, Settings, MessageSquarePlus, Download, ChevronRight, Clock, Bell, X,
  FilePlus, Plus, Trash2, Printer, AlertTriangle, Stamp
} from "lucide-react"
import Link from "next/link"


export default function PanelMedicoClient({ dentist, procedures = [] }: { dentist: any, procedures: any[] }) {
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

  // Estado para ver mis solicitudes
  const [showMisSolicitudes, setShowMisSolicitudes] = useState(false)

  // Estado para Orden de Derivación
  const [showDerivacion, setShowDerivacion] = useState(false)
  const [derivacion, setDerivacion] = useState({
    pacienteApellido: "",
    pacienteNombre: "",
    dni: "",
    fechaNacimiento: "",
    cobertura: "particular" as "particular" | "obrasocial",
    obraSocial: "",
    nroAfiliado: "",
    procedimientosSeleccionados: [] as string[],
    otro: "",
    indicacion: "",
    fecha: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  })

  const toggleProcedimiento = (procId: string) => {
    setDerivacion(prev => ({
      ...prev,
      procedimientosSeleccionados: prev.procedimientosSeleccionados.includes(procId)
        ? prev.procedimientosSeleccionados.filter(p => p !== procId)
        : [...prev.procedimientosSeleccionados, procId]
    }))
  }
  const [derivacionConfig, setDerivacionConfig] = useState<Record<string, { teeth: number[], options: string[] }>>({})
  const [toothModalProc, setToothModalProc] = useState<any>(null)

  const toggleTooth = (procId: string, tooth: number) => {
    setDerivacionConfig(prev => {
      const curr = prev[procId]?.teeth || []
      return { ...prev, [procId]: { ...prev[procId], teeth: curr.includes(tooth) ? curr.filter(t => t !== tooth) : [...curr, tooth] } }
    })
  }

  const toggleOption = (procId: string, option: string) => {
    setDerivacionConfig(prev => {
      const curr = prev[procId]?.options || []
      return { ...prev, [procId]: { ...prev[procId], options: curr.includes(option) ? curr.filter(o => o !== option) : [...curr, option] } }
    })
  }

  const ORTODONCIA_CODES = ['09.01.06', '09.02.07']
  const GRUPOS_DERIVACION = [
    { prefix: '09.01', exclude: ORTODONCIA_CODES, label: '🦷 Intraorales',    color: 'bg-blue-50 border-blue-200 text-blue-800' },
    { prefix: '09.02', exclude: ORTODONCIA_CODES, label: '📷 Extraorales',    color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { codes: ORTODONCIA_CODES,                    label: '😁 Ortodoncia',     color: 'bg-brand-50 border-brand-200 text-brand-800' },
    { prefix: '09.03', exclude: [],               label: '🔬 Tomografías 3D', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  ]

  const [respondedCount, setRespondedCount] = useState(
    dentist.tickets?.filter((t: any) => t.status === 'RESPONDIDO').length || 0
  )

  const handleOpenSolicitudes = async () => {
    setShowMisSolicitudes(true)
    if (respondedCount > 0) {
      setRespondedCount(0)
      await markRespondidosAsRead(dentist.id)
      router.refresh()
    }
  }

  const buildDerivacionHTML = () => {
    const d = derivacion
    const esParticular = d.cobertura === 'particular'

    const todosEstudios: string[] = [
      ...d.procedimientosSeleccionados.map(procId => {
        const proc = procedures.find((p: any) => p.id === procId)
        if (!proc) return ''
        const cfg = derivacionConfig[procId] || {}
        let label = proc.name
        if (cfg.teeth?.length) label += ` — Piezas: ${cfg.teeth.sort((a: number, b: number) => a - b).join(', ')}`
        if (cfg.options?.length) label += ` — ${cfg.options.join(' / ')}`
        return label
      }).filter(Boolean),
      ...(d.otro.trim() ? [d.otro.trim()] : [])
    ]
    const estudiosHTML = todosEstudios.length
      ? todosEstudios.map(e => `<li>${e}</li>`).join('')
      : '<li style="color:#bbb;font-style:italic">Sin estudios especificados</li>'

    const selloHTML = esParticular
      ? `<div style="display:inline-block;border:2px solid #BA2C66;border-radius:8px;padding:8px 16px;text-align:center;min-width:160px">
           <p style="font-family:'Dancing Script',cursive;font-weight:700;font-size:20px;color:#1a1a1a;margin:0 0 4px;line-height:1.3;letter-spacing:0.3px">${dentist.lastName}, ${dentist.firstName}</p>
           ${dentist.matriculaProv ? `<p style="font-size:9.5px;color:#777;margin:0;font-family:Arial,sans-serif;font-weight:600">MP: ${dentist.matriculaProv}</p>` : ''}
           ${dentist.matriculaNac ? `<p style="font-size:9.5px;color:#777;margin:0;font-family:Arial,sans-serif;font-weight:600">MN: ${dentist.matriculaNac}</p>` : ''}
         </div>`
      : `<div style="border:2px dashed #ccc;border-radius:8px;padding:8px 16px;text-align:center;min-height:58px;min-width:160px"></div>`

    const html = `<!DOCTYPE html><html><head><title>Derivación</title>
    <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
    <style>
      @page { size: A4 portrait; margin: 12mm 15mm; }
      *{box-sizing:border-box;margin:0;padding:0}
      html{width:210mm}
      body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;font-size:11px;background:#fff;width:210mm;max-width:210mm}
      @media print{html,body{width:210mm!important;max-width:210mm!important}}

      .header{background:linear-gradient(135deg,#BA2C66 0%,#8b1d4a 100%);border-radius:12px;padding:13px 18px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}
      .header-brand{display:flex;align-items:center;gap:12px}
      .header-logo-png{height:44px;width:auto;margin-right:6px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5))}
      .header-logo-svg{height:34px;width:auto}
      .header-right{text-align:right}
      .header-right h2{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#fff;margin:0}
      .header-right .fecha{display:inline-block;margin-top:4px;background:#8b1d4a;border-radius:6px;padding:3px 10px;font-size:9.5px;font-weight:700;color:#fff;letter-spacing:0.3px}

      .aviso{text-align:center;margin-bottom:10px;padding:5px 0}
      .aviso p{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#b45309}

      .section{margin-bottom:10px;background:#fafafa;border:1px solid #f0f0f0;border-radius:10px;padding:9px 12px}
      .section-title{font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#BA2C66;margin-bottom:7px;display:flex;align-items:center;gap:4px}
      .section-title::after{content:'';flex:1;height:1px;background:#f0dde8;margin-left:4px}

      .row{display:flex;gap:10px;margin-bottom:6px}
      .field{flex:1}
      .field label{font-size:7.5px;font-weight:700;text-transform:uppercase;color:#aaa;display:block;margin-bottom:2px;letter-spacing:0.5px}
      .field .value{font-size:10.5px;font-weight:600;color:#111;background:#fff;border:1px solid #e8e8e8;border-radius:6px;padding:3px 7px;min-height:22px}

      .studies-box{background:#fff;border:1px solid #e8e8e8;border-radius:8px;padding:8px 10px}
      .studies-list{padding-left:14px;margin:0;columns:2;column-gap:14px}
      .studies-list li{margin-bottom:4px;font-size:10.5px;font-weight:600;break-inside:avoid;color:#222}

      .indicacion{background:#fff;border:1px solid #e8e8e8;border-radius:8px;padding:8px 10px;min-height:44px;font-size:10.5px;color:#333;white-space:pre-wrap;line-height:1.6}

      .footer-firma{margin-top:14px;border:1.5px dashed #ddd;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:flex-end;min-height:70px;position:relative}
      .firma-label{font-size:7.5px;font-weight:700;text-transform:uppercase;color:#bbb;letter-spacing:1px;position:absolute;bottom:10px;left:16px}

      .footer-bottom{margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0}
      .sedes-row{display:flex;justify-content:space-around;gap:6px;margin-bottom:7px}
      .sede-item{text-align:center}
      .sede-item a{text-decoration:none;color:#BA2C66;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px}
      .sede-item .dir{font-size:8.5px;color:#888;margin-top:1px;font-weight:600}
      .sede-item .tel{font-size:8.5px;color:#BA2C66;font-weight:700;margin-top:1px}
      .contacto-row{text-align:center;font-size:9.5px;font-weight:700;color:#BA2C66;margin-bottom:4px}
      .horarios-row{text-align:center;font-size:9.5px;color:#444;font-weight:700;letter-spacing:0.2px}

      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>

      <div class="header">
        <div class="header-brand">
          <img src="${window.location.origin}/logo.png" class="header-logo-png" alt="i-R Dental" />
          <svg class="header-logo-svg" viewBox="0 0 192.08 32.18" xmlns="http://www.w3.org/2000/svg"><defs><style>.st0{fill:#fff}</style></defs><path class="st0" d="M67.54,6.16c-2.99-2.23-6.27-2.63-10.04-2.63h-5.67v26.99h5.58c3.76,0,6.72-.36,9.87-2.59,3.56-2.51,5.42-6.39,5.42-10.89s-1.9-8.42-5.18-10.89ZM64.91,24.74c-2.35,1.74-5.14,1.9-7.16,1.9h-1.78V7.42h1.78c1.98,0,4.86.16,7.2,1.86,1.94,1.42,3.64,4.21,3.64,7.77s-1.82,6.27-3.68,7.69Z"/><polygon class="st0" points="79.52 30.52 94.41 30.52 94.41 26.64 83.65 26.64 83.65 18.14 94.09 18.14 94.09 14.25 83.65 14.25 83.65 7.42 94.41 7.42 94.41 3.53 79.52 3.53 79.52 30.52"/><polygon class="st0" points="120.96 22.23 101.37 1.71 101.37 30.52 105.5 30.52 105.5 11.66 125.09 32.18 125.09 3.53 120.96 3.53 120.96 22.23"/><polygon class="st0" points="130.35 7.42 136.54 7.42 136.54 30.52 140.67 30.52 140.67 7.42 146.86 7.42 146.86 3.53 130.35 3.53 130.35 7.42"/><path class="st0" d="M147.43,30.52h4.45l2.95-6.52h11.53l2.83,6.52h4.45l-12.79-28.57-13.43,28.57ZM156.53,20.12l4.17-9.15,4.01,9.15h-8.17Z"/><polygon class="st0" points="182.8 26.64 182.8 3.53 178.67 3.53 178.67 30.52 190.73 30.52 190.73 26.64 182.8 26.64"/><path class="st0" d="M36.19,10.98c0-1.17-.24-4.37-3.2-6.35-1.74-1.17-3.84-1.58-7.12-1.58h-4.82v12.13h-4.77v3.93h4.77v10.93h4.13v-11.05h.73l7.73,11.05h4.98l-8.42-11.53c3.6-.81,5.99-3.64,5.99-7.53ZM25.18,15.43V6.85h1.42c2.02,0,5.62.36,5.62,4.17,0,4.29-4.61,4.41-5.75,4.41h-1.29Z"/><rect class="st0" x="9.17" y="15.17" width="3.93" height="3.93"/><rect class="st0" x="1.62" y="15.17" width="3.93" height="14.86"/><rect class="st0" x="1.62" y="3.92" width="3.93" height="4.24"/></svg>
        </div>
        <div class="header-right">
          <h2>Orden de Derivación</h2>
          <div class="fecha">${d.fecha}</div>
        </div>
      </div>

      <div class="aviso">
        <p>✦ Atención sin turno &nbsp;·&nbsp; Por orden de llegada ✦</p>
      </div>

      <div class="section">
        <div class="section-title">Paciente</div>
        <div class="row">
          <div class="field"><label>Apellido y Nombre</label><div class="value">${d.pacienteApellido}${d.pacienteApellido && d.pacienteNombre ? ', ' : ''}${d.pacienteNombre}</div></div>
          <div class="field" style="max-width:90px"><label>DNI</label><div class="value">${d.dni}</div></div>
        </div>
        <div class="row">
          <div class="field" style="max-width:110px"><label>Fecha de Nac.</label><div class="value">${d.fechaNacimiento}</div></div>
          <div class="field"><label>Cobertura</label><div class="value">${esParticular ? 'Particular' : d.obraSocial}</div></div>
          ${!esParticular ? `<div class="field" style="max-width:120px"><label>N° Afiliado</label><div class="value">${d.nroAfiliado}</div></div>` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Estudios Solicitados</div>
        <div class="studies-box"><ul class="studies-list">${estudiosHTML}</ul></div>
      </div>

      ${d.indicacion.trim() ? `
      <div class="section">
        <div class="section-title">Indicación Clínica</div>
        <div class="indicacion">${d.indicacion}</div>
      </div>` : ''}

      <div class="footer-firma">
        <div class="firma-label">Firma y Sello</div>
        <div style="margin-left:auto">${selloHTML}</div>
      </div>

      <div class="footer-bottom">
        <div class="sedes-row">
          <div class="sede-item">
            <a href="https://maps.google.com/maps?q=Olavarria+88,+Quilmes">📍 Quilmes</a>
            <p class="dir">Olavarría 88</p>
            <p class="tel">4257-2950</p>
            <p class="tel">WhatsApp: 11-5820-9986</p>
          </div>
          <div class="sede-item">
            <a href="https://maps.google.com/maps?q=9+de+Julio+64,+Avellaneda">📍 Avellaneda</a>
            <p class="dir">9 de Julio 64, 2do A</p>
            <p class="tel">4201-1061</p>
            <p class="tel">WhatsApp: 11-3865-7094</p>
          </div>
          <div class="sede-item">
            <a href="https://maps.google.com/maps?q=España+156,+Lomas+de+Zamora">📍 Lomas de Zamora</a>
            <p class="dir">España 156, PB</p>
            <p class="tel">4244-0519</p>
            <p class="tel">WhatsApp: 11-7044-2131</p>
          </div>
        </div>
        <div class="contacto-row">0810.333.4507 &nbsp;·&nbsp; info@irdental.com.ar</div>
        <div class="horarios-row">Lunes a Viernes: 9:00 a 17:30 hs &nbsp;·&nbsp; Sábados: 9:00 a 12:30 hs</div>
      </div>

    </body></html>`
    return html
  }

  const handlePrintDerivacion = () => {
    const html = buildDerivacionHTML().replace(
      '<body>',
      `<body><script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script>`
    )
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
  }

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
      const res = await createTicket(dentist.id, ticketSubject, ticketMessage)
      if (res.success) {
        toast.success("¡Solicitud enviada a Recepción!", { description: "Nos comunicaremos a la brevedad." })
        setShowTicketModal(false)
        setTicketMessage("")
        router.refresh()
      } else {
        toast.error("Error al enviar la solicitud")
      }
    } catch (error) {
      toast.error("Error al enviar la solicitud")
    } finally {
      setLoadingTicket(false)
    }
  }

  // Count ready orders for badge
  const estudiosListos = dentist.orders?.filter((o: any) => o.status === 'LISTO_PARA_ENTREGA').length || 0

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

      {/* MODAL: MIS SOLICITUDES */}
      <Dialog open={showMisSolicitudes} onOpenChange={setShowMisSolicitudes}>
        <DialogContent className="sm:max-w-[560px] bg-white rounded-2xl border-t-8 border-brand-600 p-0 outline-none overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
              <Bell className="text-brand-600" size={20}/> Mis Solicitudes
            </DialogTitle>
          </DialogHeader>
          <div className="p-5 max-h-[65vh] overflow-y-auto space-y-3">
            {!dentist.tickets || dentist.tickets.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquarePlus size={40} className="mx-auto text-neutral-200 mb-3"/>
                <p className="font-bold uppercase text-neutral-400 text-sm">No enviaste ninguna solicitud todavía</p>
              </div>
            ) : dentist.tickets.map((ticket: any) => {
              const statusCfg: Record<string, { label: string, color: string, bg: string }> = {
                ABIERTO:    { label: 'Pendiente',    color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
                RESPONDIDO: { label: '✓ Respondido', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                CERRADO:    { label: 'Cerrado',       color: 'text-neutral-500', bg: 'bg-neutral-50 border-neutral-200' },
              }
              const subjectLabels: Record<string, string> = {
                ESTUDIO_FALTANTE: 'Falta subir un estudio',
                ERROR_DATOS: 'Error en datos de paciente',
                CONSULTA_TECNICA: 'Consulta técnica',
                OTROS: 'Otra consulta'
              }
              const cfg = statusCfg[ticket.status] || statusCfg.ABIERTO
              return (
                <div key={ticket.id} className={`rounded-2xl border overflow-hidden ${cfg.bg}`}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100/80">
                    <p className="text-xs font-black uppercase text-neutral-600">{subjectLabels[ticket.subject] || ticket.subject}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400">{new Date(ticket.createdAt).toLocaleDateString('es-AR')}</span>
                      <span className={`text-[10px] font-black uppercase ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-sm text-neutral-700">{ticket.message}</p>
                    {ticket.reply && (
                      <div className="bg-white/80 rounded-xl p-3 border border-emerald-200 mt-2">
                        <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">
                          Respuesta {ticket.repliedBy ? `de ${ticket.repliedBy}` : ''} · {ticket.repliedAt ? new Date(ticket.repliedAt).toLocaleDateString('es-AR') : ''}
                        </p>
                        <p className="text-sm text-neutral-800">{ticket.reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="px-5 pb-5 pt-2 border-t border-neutral-100">
            <Button
              onClick={() => { setShowMisSolicitudes(false); setShowTicketModal(true) }}
              className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-black uppercase text-xs rounded-xl flex items-center gap-2"
            >
              <MessageSquarePlus size={15}/> Nueva Solicitud
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



      {/* MODAL: ORDEN DE DERIVACIÓN */}
      <Dialog open={showDerivacion} onOpenChange={setShowDerivacion}>
        <DialogContent className="sm:max-w-[680px] bg-white rounded-t-2xl sm:rounded-2xl border-t-8 border-brand-600 p-0 overflow-hidden outline-none flex flex-col max-h-[90dvh] w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100 shrink-0">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
              <FilePlus size={20} className="text-brand-600"/> Nueva Orden de Derivación
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400 mt-1">
              Completá los datos para generar e imprimir la orden de derivación.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* DATOS DEL PACIENTE */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-600 mb-3">Datos del Paciente</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Apellido</Label>
                  <Input value={derivacion.pacienteApellido} onChange={e => setDerivacion({...derivacion, pacienteApellido: e.target.value.toUpperCase()})} placeholder="García" className="h-10 bg-neutral-50 text-sm uppercase"/>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Nombre</Label>
                  <Input value={derivacion.pacienteNombre} onChange={e => setDerivacion({...derivacion, pacienteNombre: e.target.value.toUpperCase()})} placeholder="Juan" className="h-10 bg-neutral-50 text-sm uppercase"/>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-neutral-500">DNI</Label>
                  <Input value={derivacion.dni} onChange={e => setDerivacion({...derivacion, dni: e.target.value})} placeholder="12.345.678" className="h-10 bg-neutral-50 text-sm uppercase"/>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Fecha de Nacimiento</Label>
                  <Input
                    type="text"
                    value={derivacion.fechaNacimiento}
                    onChange={e => {
                      let v = e.target.value.replace(/[^\d]/g, '').slice(0, 8)
                      if (v.length > 4) v = v.slice(0,2) + '-' + v.slice(2,4) + '-' + v.slice(4)
                      else if (v.length > 2) v = v.slice(0,2) + '-' + v.slice(2)
                      setDerivacion({...derivacion, fechaNacimiento: v})
                    }}
                    placeholder="DD-MM-AAAA"
                    maxLength={10}
                    className="h-10 bg-neutral-50 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* COBERTURA */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-600 mb-3">Cobertura Médica</p>
              <div className="flex gap-3 mb-3">
                {(['particular', 'obrasocial'] as const).map(tipo => (
                  <button key={tipo} onClick={() => setDerivacion({...derivacion, cobertura: tipo})}
                    className={`flex-1 py-2.5 rounded-xl font-black uppercase text-xs border-2 transition-all ${derivacion.cobertura === tipo ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-white text-neutral-500 border-neutral-200 hover:border-brand-300'}`}>
                    {tipo === 'particular' ? '👤 Particular' : '🏥 Obra Social'}
                  </button>
                ))}
              </div>
              {derivacion.cobertura === 'obrasocial' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase text-neutral-500">Obra Social</Label>
                    <Input value={derivacion.obraSocial} onChange={e => setDerivacion({...derivacion, obraSocial: e.target.value.toUpperCase()})} placeholder="OSDE, Swiss Medical..." className="h-10 bg-neutral-50 text-sm uppercase"/>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase text-neutral-500">N° Afiliado</Label>
                    <Input value={derivacion.nroAfiliado} onChange={e => setDerivacion({...derivacion, nroAfiliado: e.target.value.toUpperCase()})} placeholder="1-234-5678901/00" className="h-10 bg-neutral-50 text-sm uppercase"/>
                  </div>
                </div>
              )}
              {derivacion.cobertura === 'particular' && (
                <div className="mt-3 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5"/>
                  <p className="text-xs text-emerald-800 font-medium">Podés imprimir esta orden tal como está. Se incluirá tu sello con matrículas.</p>
                </div>
              )}
              {derivacion.cobertura === 'obrasocial' && (
                <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5"/>
                  <p className="text-xs text-amber-800 font-medium">Para obra social debés <strong>firmar y estampar tu sello físico</strong> antes de entregarla al paciente.</p>
                </div>
              )}
            </div>

            {/* ESTUDIOS */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-600 mb-3">Estudios Solicitados</p>
              <div className="space-y-3 mb-3">
                {GRUPOS_DERIVACION.map(grupo => {
                  const procs = procedures.filter((p: any) =>
                    'codes' in grupo
                      ? (grupo.codes ?? []).includes(p.code)
                      : p.code?.startsWith((grupo as any).prefix) && !((grupo as any).exclude || []).includes(p.code)
                  )
                  if (procs.length === 0) return null
                  const key = 'codes' in grupo ? grupo.label : grupo.prefix
                  return (
                    <div key={key} className={`rounded-xl border p-3 ${grupo.color}`}>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-2 opacity-70">{grupo.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {procs.map((proc: any) => {
                          const sel = derivacion.procedimientosSeleccionados.includes(proc.id)
                          const cfg = derivacionConfig[proc.id] || {}
                          const teethCount = cfg.teeth?.length || 0
                          return (
                            <div key={proc.id} className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleProcedimiento(proc.id)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all whitespace-nowrap ${sel ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-white text-neutral-600 border-neutral-300 hover:border-brand-400 hover:text-brand-600'}`}>
                                  {sel && '✓ '}{proc.name}
                                </button>
                                {sel && proc.requiresTooth && (
                                  <button onClick={() => setToothModalProc(proc)}
                                    className={`px-2 py-1.5 rounded-lg text-[10px] font-black border-2 transition-all ${teethCount > 0 ? 'bg-brand-600 text-white border-brand-600' : 'bg-white/80 text-slate-500 border-slate-300 hover:border-brand-400'}`}>
                                    {teethCount > 0 ? `${teethCount} pza` : '+ piezas'}
                                  </button>
                                )}
                              </div>
                              {sel && proc.options?.length > 0 && (
                                <div className="flex flex-wrap gap-1 ml-1">
                                  {proc.options.map((opt: string) => (
                                    <button key={opt} onClick={() => toggleOption(proc.id, opt)}
                                      className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${(cfg.options||[]).includes(opt) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white/80 text-slate-500 border-slate-300 hover:border-slate-500'}`}>
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {/* Prácticas sin grupo conocido */}
                {(() => {
                  const ungrouped = procedures.filter((p: any) => !GRUPOS_DERIVACION.some(g =>
                    'codes' in g ? (g.codes ?? []).includes(p.code) : p.code?.startsWith((g as any).prefix) && !((g as any).exclude||[]).includes(p.code)
                  ))
                  if (ungrouped.length === 0) return null
                  return (
                    <div className="rounded-xl border p-3 bg-slate-50 border-slate-200">
                      <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-slate-400">Otros</p>
                      <div className="flex flex-wrap gap-2">
                        {ungrouped.map((proc: any) => {
                          const sel = derivacion.procedimientosSeleccionados.includes(proc.id)
                          const cfg = derivacionConfig[proc.id] || {}
                          return (
                            <button key={proc.id} onClick={() => toggleProcedimiento(proc.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${sel ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-white text-neutral-600 border-neutral-300 hover:border-brand-400 hover:text-brand-600'}`}>
                              {sel && '✓ '}{proc.name}
                              {sel && proc.options?.length > 0 && (cfg.options||[]).length > 0 && <span className="ml-1 text-brand-500">({(cfg.options||[]).join('/')})</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-neutral-500">Otro / Especificar</Label>
                <Input value={derivacion.otro} onChange={e => setDerivacion({...derivacion, otro: e.target.value.toUpperCase()})} placeholder="Escribí un estudio personalizado..." className="h-10 bg-neutral-50 text-sm uppercase"/>
              </div>
            </div>

            {/* INDICACIÓN CLÍNICA */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-600 mb-3">Indicación Clínica <span className="text-neutral-400 normal-case font-medium">(opcional)</span></p>
              <textarea
                value={derivacion.indicacion}
                onChange={e => setDerivacion({...derivacion, indicacion: e.target.value.toUpperCase()})}
                placeholder="Diagnóstico presuntivo, motivo del estudio, información relevante..."
                className="w-full min-h-[72px] bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent uppercase"
              />
            </div>

          </div>

          <div className="px-6 py-4 border-t border-neutral-100 shrink-0 space-y-2">
            <div className="flex gap-2">
              <Button onClick={handlePrintDerivacion} className="flex-1 h-11 bg-brand-600 hover:bg-brand-700 text-white font-black uppercase text-xs rounded-xl shadow-lg flex items-center justify-center gap-2">
                <Printer size={15}/> Imprimir / Guardar PDF
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setShowDerivacion(false)} className="w-full h-9 text-xs text-neutral-400 hover:text-neutral-600">
              Cancelar
            </Button>
          </div>

          {/* ODONTOGRAMA — overlay interno (evita Dialog anidado que rompe mobile) */}
          {toothModalProc && (
            <div className="absolute inset-0 bg-white z-20 flex flex-col rounded-2xl border-t-8 border-brand-600">
              <div className="px-6 pt-5 pb-4 border-b border-neutral-100 shrink-0 flex items-center justify-between">
                <h3 className="text-base font-black uppercase tracking-tight text-neutral-900">
                  {toothModalProc.name}
                </h3>
                <button onClick={() => setToothModalProc(null)} className="text-neutral-400 hover:text-neutral-700 transition-colors">
                  <X size={20}/>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-600 text-center">Seleccioná las piezas dentarias</p>
                <p className="text-[10px] text-slate-400 text-center mb-4">← Deslizá para ver todas las piezas →</p>
                <div className="overflow-x-auto pb-2" ref={el => { if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2 }}>
                  <div className="flex flex-col gap-3 min-w-max px-2">
                    {/* Superior */}
                    <div className="flex gap-1">
                      {[18,17,16,15,14,13,12,11].map(t => {
                        const sel = (derivacionConfig[toothModalProc.id]?.teeth || []).includes(t)
                        return <button key={t} onClick={() => toggleTooth(toothModalProc.id, t)} className={`w-9 h-9 rounded-lg text-xs font-black border-2 transition-all ${sel ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-400'}`}>{t}</button>
                      })}
                      <div className="w-px bg-slate-300 mx-1"/>
                      {[21,22,23,24,25,26,27,28].map(t => {
                        const sel = (derivacionConfig[toothModalProc.id]?.teeth || []).includes(t)
                        return <button key={t} onClick={() => toggleTooth(toothModalProc.id, t)} className={`w-9 h-9 rounded-lg text-xs font-black border-2 transition-all ${sel ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-400'}`}>{t}</button>
                      })}
                    </div>
                    <div className="border-t border-dashed border-slate-300"/>
                    {/* Inferior */}
                    <div className="flex gap-1">
                      {[48,47,46,45,44,43,42,41].map(t => {
                        const sel = (derivacionConfig[toothModalProc.id]?.teeth || []).includes(t)
                        return <button key={t} onClick={() => toggleTooth(toothModalProc.id, t)} className={`w-9 h-9 rounded-lg text-xs font-black border-2 transition-all ${sel ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-400'}`}>{t}</button>
                      })}
                      <div className="w-px bg-slate-300 mx-1"/>
                      {[31,32,33,34,35,36,37,38].map(t => {
                        const sel = (derivacionConfig[toothModalProc.id]?.teeth || []).includes(t)
                        return <button key={t} onClick={() => toggleTooth(toothModalProc.id, t)} className={`w-9 h-9 rounded-lg text-xs font-black border-2 transition-all ${sel ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-400'}`}>{t}</button>
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex items-center justify-between">
                <p className="text-sm font-black text-slate-600">
                  {(derivacionConfig[toothModalProc.id]?.teeth || []).length} pieza{(derivacionConfig[toothModalProc.id]?.teeth || []).length !== 1 ? 's' : ''} seleccionada{(derivacionConfig[toothModalProc.id]?.teeth || []).length !== 1 ? 's' : ''}
                </p>
                <Button onClick={() => setToothModalProc(null)} className="h-10 bg-brand-600 hover:bg-brand-700 text-white font-black uppercase text-xs rounded-xl px-6">
                  Confirmar
                </Button>
              </div>
            </div>
          )}
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
              {/* Botón Mis Solicitudes */}
              <button
                onClick={handleOpenSolicitudes}
                className="relative flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-md transition-all shadow-lg shadow-brand-900/30"
              >
                <Bell size={14} className="shrink-0"/>
                <span className="hidden sm:block">Mis Solicitudes</span>
                {respondedCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-amber-900 text-[9px] font-black rounded-full flex items-center justify-center shadow animate-bounce">
                    {respondedCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowDerivacion(true)}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-md border border-neutral-700 transition-all"
              >
                <FilePlus size={14} className="text-brand-400" />
                <span className="hidden sm:block">Nueva Derivación</span>
              </button>
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
              {estudiosListos > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-xs font-black uppercase px-3 py-1.5 rounded-full animate-pulse shadow-lg shadow-brand-600/30">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block"/>
                    {estudiosListos} estudio{estudiosListos > 1 ? 's' : ''} listo{estudiosListos > 1 ? 's' : ''} para entrega
                  </span>
                </div>
              )}
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
              const isListo = order.status === 'LISTO_PARA_ENTREGA'
              const statusColor = order.status === 'ENTREGADA' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : isListo ? 'bg-brand-100 text-brand-700 border-brand-200 animate-pulse' : order.status === 'LISTA' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
              const statusLabel = order.status === 'ENTREGADA' ? 'Entregado' : isListo ? '✅ Listo para retirar' : order.status === 'LISTA' ? 'Listo para retirar' : 'En proceso'

              return (
              <Card key={order.id} className="border-none shadow-md hover:shadow-lg transition-shadow rounded-2xl overflow-hidden bg-white">
                {/* Barra superior de color según estado */}
                <div className={`h-1.5 w-full ${order.status === 'ENTREGADA' ? 'bg-emerald-500' : isListo ? 'bg-brand-600' : order.status === 'LISTA' ? 'bg-amber-400' : 'bg-neutral-300'}`}/>
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