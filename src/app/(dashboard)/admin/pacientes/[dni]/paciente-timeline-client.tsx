"use client"

import Link from "next/link"
import {
  ArrowLeft, User, Phone, Mail, CreditCard, Calendar, Hash,
  Building2, Stethoscope, Image as ImageIcon, FileText,
  CheckCircle2, Clock, AlertCircle, XCircle, Package, Truck, Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const STATUS_LABELS: Record<string, string> = {
  CREADA: 'Creada',
  EN_ESPERA: 'En espera',
  EN_ATENCION: 'En atención',
  PROCESANDO: 'Procesando',
  LISTO_PARA_ENTREGA: 'Lista',
  ENTREGADA: 'Entregada',
  ANULADA: 'Anulada',
  ENVIADA_DIGITAL: 'Digital',
  DEMORADA: 'Demorada',
}

const STATUS_COLORS: Record<string, string> = {
  CREADA: 'bg-blue-100 text-blue-700 border-blue-200',
  EN_ESPERA: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  EN_ATENCION: 'bg-orange-100 text-orange-700 border-orange-200',
  PROCESANDO: 'bg-purple-100 text-purple-700 border-purple-200',
  LISTO_PARA_ENTREGA: 'bg-green-100 text-green-700 border-green-200',
  ENTREGADA: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ANULADA: 'bg-red-100 text-red-600 border-red-200',
  ENVIADA_DIGITAL: 'bg-sky-100 text-sky-700 border-sky-200',
  DEMORADA: 'bg-amber-100 text-amber-700 border-amber-200',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  CREADA: <Clock size={12} />,
  EN_ESPERA: <Clock size={12} />,
  EN_ATENCION: <Loader2 size={12} />,
  PROCESANDO: <Loader2 size={12} />,
  LISTO_PARA_ENTREGA: <Package size={12} />,
  ENTREGADA: <CheckCircle2 size={12} />,
  ANULADA: <XCircle size={12} />,
  ENVIADA_DIGITAL: <Truck size={12} />,
  DEMORADA: <AlertCircle size={12} />,
}

const TIMELINE_DOT_COLORS: Record<string, string> = {
  ENTREGADA: 'bg-emerald-500',
  ENVIADA_DIGITAL: 'bg-sky-500',
  ANULADA: 'bg-red-400',
  LISTO_PARA_ENTREGA: 'bg-green-500',
  PROCESANDO: 'bg-purple-500',
  EN_ATENCION: 'bg-orange-500',
  EN_ESPERA: 'bg-yellow-500',
  CREADA: 'bg-blue-500',
  DEMORADA: 'bg-amber-500',
}

function calcAge(birthDate: Date | string | null) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount)
}

type Patient = {
  id: string
  dni: string
  firstName: string | null
  lastName: string | null
  birthDate: Date | null
  phone: string | null
  email: string | null
  affiliateNumber: string | null
  plan: string | null
  defaultObraSocial: { name: string } | null
  orders: Array<{
    id: string
    code: string | null
    createdAt: Date
    attendedAt: Date | null
    completedAt: Date | null
    deliveredAt: Date | null
    status: string
    totalAmount: number
    paidAmount: number
    patientAmount: number
    insuranceAmount: number
    notes: string | null
    images: string[]
    branch: { name: string } | null
    dentist: { firstName: string; lastName: string } | null
    obraSocial: { name: string } | null
    osVariant: { name: string } | null
    items: Array<{ id: string; procedure: { name: string } | null; customName: string | null }>
    payments: Array<{ id: string; amount: number; method: string }>
  }>
}

export default function PacienteTimelineClient({ patient }: { patient: Patient }) {
  const orders = patient.orders
  const totalPaid = orders.reduce((acc, o) => acc + Number(o.paidAmount || 0), 0)
  const totalAmount = orders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0)
  const delivered = orders.filter(o => o.status === 'ENTREGADA' || o.status === 'ENVIADA_DIGITAL').length
  const lastVisit = orders.length > 0 ? orders[0].createdAt : null
  const age = calcAge(patient.birthDate)

  // Group orders by year for section headers
  const byYear = orders.reduce<Record<string, typeof orders>>((acc, o) => {
    const year = new Date(o.createdAt).getFullYear().toString()
    if (!acc[year]) acc[year] = []
    acc[year].push(o)
    return acc
  }, {})
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="min-h-full bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <Link href="/admin/ordenes"
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase transition-colors">
          <ArrowLeft size={14} /> Órdenes
        </Link>
        <span className="text-slate-300 text-sm">/</span>
        <span className="font-black text-xs uppercase text-slate-700">Historial del paciente</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* PATIENT CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 px-6 py-5 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-700 flex items-center justify-center shrink-0">
              <User size={26} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black uppercase text-white tracking-tight leading-none">
                {patient.lastName || '—'}, {patient.firstName || '—'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase">
                  <Hash size={12} /> DNI {patient.dni}
                </span>
                {age !== null && (
                  <span className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase">
                    <Calendar size={12} /> {age} años
                    {patient.birthDate && <span className="text-slate-500">({formatDate(patient.birthDate)})</span>}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100">
            {patient.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={14} className="text-slate-400 shrink-0" />
                <span className="text-sm font-bold truncate">{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={14} className="text-slate-400 shrink-0" />
                <span className="text-sm font-bold truncate">{patient.email}</span>
              </div>
            )}
            {patient.defaultObraSocial && (
              <div className="flex items-center gap-2 text-slate-600">
                <CreditCard size={14} className="text-slate-400 shrink-0" />
                <span className="text-sm font-bold truncate">{patient.defaultObraSocial.name}</span>
              </div>
            )}
            {patient.affiliateNumber && (
              <div className="flex items-center gap-2 text-slate-600">
                <Hash size={14} className="text-slate-400 shrink-0" />
                <span className="text-sm font-bold truncate">Af. {patient.affiliateNumber}</span>
              </div>
            )}
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
            {[
              { label: 'Total estudios', value: orders.length },
              { label: 'Entregados', value: delivered },
              { label: 'Total facturado', value: formatCurrency(totalAmount) },
              { label: 'Última visita', value: lastVisit ? formatDate(lastVisit) : '—' },
            ].map((s) => (
              <div key={s.label} className="px-5 py-4 text-center">
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="text-[10px] font-black uppercase text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TIMELINE */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
            <FileText size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="font-black uppercase text-slate-400 text-sm">Sin estudios registrados</p>
          </div>
        ) : (
          <div className="space-y-8">
            {years.map(year => (
              <div key={year}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-widest">{year}</span>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs font-bold text-slate-400">{byYear[year].length} estudio{byYear[year].length !== 1 ? 's' : ''}</span>
                </div>

                <div className="relative pl-6 space-y-3">
                  {/* vertical line */}
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />

                  {byYear[year].map((order) => {
                    const dotColor = TIMELINE_DOT_COLORS[order.status] || 'bg-slate-400'
                    const paidNum = Number(order.paidAmount || 0)
                    const totalNum = Number(order.totalAmount || 0)
                    const isPaid = paidNum >= totalNum && totalNum > 0
                    const isPartial = paidNum > 0 && paidNum < totalNum
                    const isAnulada = order.status === 'ANULADA'

                    return (
                      <div key={order.id} className={`relative ${isAnulada ? 'opacity-50' : ''}`}>
                        {/* dot */}
                        <div className={`absolute -left-4 top-4 w-3 h-3 rounded-full border-2 border-white shadow ${dotColor}`} />

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            {/* left: date + code */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="text-center shrink-0">
                                <p className="text-lg font-black text-slate-900 leading-none">
                                  {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit' })}
                                </p>
                                <p className="text-[10px] font-black uppercase text-slate-400 leading-none">
                                  {new Date(order.createdAt).toLocaleDateString('es-AR', { month: 'short' })}
                                </p>
                              </div>
                              <div className="min-w-0">
                                {order.code && (
                                  <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">
                                    #{order.code}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {order.items.map(item => (
                                    <span key={item.id}
                                      className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full">
                                      {item.customName || item.procedure?.name || '—'}
                                    </span>
                                  ))}
                                  {order.items.length === 0 && (
                                    <span className="text-slate-400 text-xs font-bold">Sin prácticas</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* right: status */}
                            <span className={`flex items-center gap-1 font-black text-[10px] uppercase px-2 py-1 rounded-full border ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {STATUS_ICONS[order.status]}
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                          </div>

                          {/* details row */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                            {order.branch && (
                              <span className="flex items-center gap-1">
                                <Building2 size={11} className="text-slate-300" /> {order.branch.name}
                              </span>
                            )}
                            {order.dentist && (
                              <span className="flex items-center gap-1">
                                <Stethoscope size={11} className="text-slate-300" />
                                {order.dentist.lastName}, {order.dentist.firstName}
                              </span>
                            )}
                            {order.obraSocial ? (
                              <span className="flex items-center gap-1">
                                <CreditCard size={11} className="text-slate-300" />
                                {order.obraSocial.name}
                                {order.osVariant && <span className="text-violet-500 font-black ml-1">{order.osVariant.name}</span>}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-slate-400">
                                <CreditCard size={11} className="text-slate-200" /> Particular
                              </span>
                            )}
                            {order.images.length > 0 && (
                              <span className="flex items-center gap-1">
                                <ImageIcon size={11} className="text-slate-300" /> {order.images.length} imagen{order.images.length !== 1 ? 'es' : ''}
                              </span>
                            )}
                            {/* payment indicator */}
                            {!isAnulada && totalNum > 0 && (
                              <span className={`ml-auto font-black ${isPaid ? 'text-emerald-600' : isPartial ? 'text-amber-600' : 'text-red-500'}`}>
                                {formatCurrency(paidNum)} / {formatCurrency(totalNum)}
                                {isPaid && ' ✓'}
                                {isPartial && ' (parcial)'}
                                {!isPaid && !isPartial && ' (sin pago)'}
                              </span>
                            )}
                          </div>

                          {/* notes */}
                          {order.notes && (
                            <p className="mt-2 text-[11px] text-slate-500 font-bold bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                              {order.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
