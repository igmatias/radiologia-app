"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { searchOrdersAdmin, adminUpdateOrder } from "@/actions/orders"
import Link from "next/link"
import {
  Search, ClipboardList, Calendar, User, Building2,
  CreditCard, Hash, Edit2, Save, X, ChevronDown, ChevronUp, Trash2, Plus, Eye, EyeOff
} from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  CREADA: 'Creada', EN_ESPERA: 'En espera', EN_ATENCION: 'En atención',
  PROCESANDO: 'Procesando', LISTA: 'Lista', ENTREGADA: 'Entregada', ANULADA: 'Anulada'
}
const STATUS_COLORS: Record<string, string> = {
  CREADA: 'bg-blue-100 text-blue-700',
  EN_ESPERA: 'bg-yellow-100 text-yellow-700',
  EN_ATENCION: 'bg-orange-100 text-orange-700',
  PROCESANDO: 'bg-purple-100 text-purple-700',
  LISTA: 'bg-green-100 text-green-700',
  ENTREGADA: 'bg-emerald-100 text-emerald-700',
  ANULADA: 'bg-red-100 text-red-700',
}

export default function OrdenesAdminClient({ branches, procedures, obrasSociales, dentists }: {
  branches: any[], procedures: any[], obrasSociales: any[], dentists: any[]
}) {
  // Filtros
  const [search, setSearch] = useState("")
  const [branchId, setBranchId] = useState("ALL")
  const [obraSocialId, setObraSocialId] = useState("ALL")
  const [osVariantId, setOsVariantId] = useState("ALL")
  const [procedureId, setProcedureId] = useState("ALL")
  const [status, setStatus] = useState("ALL")
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [searched, setSearched] = useState(false)

  // Modal edición
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [editData, setEditData] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [expandedItems, setExpandedItems] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    const res = await searchOrdersAdmin({ search, branchId, obraSocialId, procedureId, status, startDate, endDate, osVariantId: osVariantId !== "ALL" ? osVariantId : undefined })
    if (res.success) { setOrders(res.orders); setSearched(true) }
    else toast.error("Error al buscar órdenes")
    setLoading(false)
  }

  const openEdit = (order: any) => {
    setEditingOrder(order)
    setExpandedItems(false)
    setEditData({
      code: order.code || "",
      createdAt: new Date(order.createdAt).toISOString().split('T')[0],
      status: order.status,
      notes: order.notes || "",
      dentistId: order.dentistId || "",
      obraSocialId: order.obraSocialId || "",
      osVariantId: order.osVariantId || "",
      branchId: order.branchId,
      patient: {
        firstName: order.patient?.firstName || "",
        lastName: order.patient?.lastName || "",
        phone: order.patient?.phone || "",
        email: order.patient?.email || "",
        birthDate: order.patient?.birthDate ? new Date(order.patient.birthDate).toISOString().split('T')[0] : "",
        affiliateNumber: order.patient?.affiliateNumber || "",
        plan: order.patient?.plan || "",
      },
      items: order.items.map((i: any) => ({
        id: i.id,
        procedureId: i.procedureId,
        procedureName: i.procedure?.name || "",
        price: Number(i.price),
        insuranceCoverage: Number(i.insuranceCoverage),
        patientCopay: Number(i.patientCopay),
        teeth: i.metadata?.teeth || [],
        locations: i.metadata?.locations || [],
        hidden: i.hidden ?? false,
      }))
    })
  }

  const handleSave = async () => {
    if (!editingOrder || !editData) return
    setSaving(true)
    const payload: any = {
      code: editData.code,
      createdAt: editData.createdAt,
      status: editData.status,
      notes: editData.notes,
      dentistId: editData.dentistId || null,
      obraSocialId: editData.obraSocialId || null,
      osVariantId: editData.osVariantId || null,
      branchId: editData.branchId,
      patient: editData.patient,
      items: editData.items.map((i: any) => ({
        procedureId: i.procedureId,
        price: Number(i.price),
        insuranceCoverage: Number(i.insuranceCoverage),
        patientCopay: Number(i.patientCopay),
        teeth: i.teeth || [],
        locations: i.locations || [],
        hidden: i.hidden ?? false,
      }))
    }
    const res = await adminUpdateOrder(editingOrder.id, payload)
    if (res.success) {
      toast.success("Orden actualizada ✓")
      setEditingOrder(null)
      await handleSearch()
    } else {
      toast.error(res.error || "Error al guardar")
    }
    setSaving(false)
  }

  const updateItem = (index: number, field: string, value: any) => {
    const items = [...editData.items]
    items[index] = { ...items[index], [field]: value }
    if (field === 'insuranceCoverage' || field === 'patientCopay') {
      items[index].price = Number(items[index].insuranceCoverage) + Number(items[index].patientCopay)
    }
    setEditData({ ...editData, items })
  }

  const removeItem = (index: number) => {
    setEditData({ ...editData, items: editData.items.filter((_: any, i: number) => i !== index) })
  }

  const addItem = (procId: string) => {
    const proc = procedures.find(p => p.id === procId)
    if (!proc) return
    if (editData.items.find((i: any) => i.procedureId === procId)) return toast.error("Ya está agregada")
    setEditData({
      ...editData,
      items: [...editData.items, {
        procedureId: procId, procedureName: proc.name,
        price: 0, insuranceCoverage: 0, patientCopay: 0, teeth: [], locations: []
      }]
    })
  }

  const totalItems = editData?.items?.reduce((acc: number, i: any) => acc + Number(i.price), 0) || 0

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3">
        <ClipboardList size={28} className="text-brand-600" />
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Gestión de Órdenes</h1>
          <p className="text-xs font-bold text-slate-400 uppercase">Búsqueda, filtros y edición global</p>
        </div>
      </div>

      {/* FILTROS */}
      <Card className="border-none shadow-md rounded-[2rem] bg-white border-t-8 border-slate-900">
        <CardContent className="p-6 space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">Buscar (DNI, apellido, nº orden)</Label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Ej: 36253332 / PEREZ / Q-2026-000001" className="pl-9 h-11 font-bold border-2" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">Sede</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="h-11 font-bold border-2 uppercase"><SelectValue /></SelectTrigger>
                <SelectContent className="font-bold uppercase">
                  <SelectItem value="ALL">Todas las sedes</SelectItem>
                  {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 font-bold border-2 uppercase"><SelectValue /></SelectTrigger>
                <SelectContent className="font-bold uppercase">
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">Obra Social</Label>
              <Select value={obraSocialId} onValueChange={(v) => { setObraSocialId(v); setOsVariantId("ALL"); }}>
                <SelectTrigger className="h-11 font-bold border-2 uppercase"><SelectValue /></SelectTrigger>
                <SelectContent className="font-bold uppercase">
                  <SelectItem value="ALL">Todas</SelectItem>
                  {obrasSociales.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {/* Sub-selección si la OS tiene variantes */}
              {(() => {
                const os = obrasSociales.find((o: any) => o.id === obraSocialId);
                if (!os?.variants?.length) return null;
                return (
                  <Select value={osVariantId} onValueChange={setOsVariantId}>
                    <SelectTrigger className="h-9 font-bold uppercase border-2 border-violet-300 bg-violet-50 text-[10px] mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="font-black uppercase">
                      <SelectItem value="ALL">— Todas las variantes —</SelectItem>
                      {os.variants.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                );
              })()}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">Práctica</Label>
              <Select value={procedureId} onValueChange={setProcedureId}>
                <SelectTrigger className="h-11 font-bold border-2 uppercase"><SelectValue /></SelectTrigger>
                <SelectContent className="font-bold uppercase">
                  <SelectItem value="ALL">Todas</SelectItem>
                  {procedures.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">Fecha desde</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-11 font-bold border-2" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">Fecha hasta</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-11 font-bold border-2" />
            </div>
          </div>
          <Button onClick={handleSearch} disabled={loading} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase rounded-xl">
            <Search size={16} className="mr-2" /> {loading ? "Buscando..." : "Buscar órdenes"}
          </Button>
        </CardContent>
      </Card>

      {/* RESULTADOS */}
      {searched && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-black uppercase text-slate-500">{orders.length} resultado{orders.length !== 1 ? 's' : ''}</p>
            {orders.length === 200 && <p className="text-xs font-bold text-amber-600">Mostrando máximo 200 resultados — acotar filtros</p>}
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
              <ClipboardList size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="font-black uppercase text-slate-400">Sin resultados para los filtros seleccionados</p>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">Nº Orden</th>
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">Fecha</th>
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">Paciente</th>
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">DNI</th>
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">Odontólogo</th>
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">Sede</th>
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">OS</th>
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider">Prácticas</th>
                      <th className="text-right px-4 py-3 font-black uppercase text-[10px] tracking-wider">Total</th>
                      <th className="text-center px-4 py-3 font-black uppercase text-[10px] tracking-wider">Estado</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-black text-slate-900">{order.code || '—'}</td>
                        <td className="px-4 py-3 font-bold text-slate-600 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-4 py-3 font-black uppercase text-slate-900 whitespace-nowrap">
                          {order.patient?.dni ? (
                            <Link href={`/admin/pacientes/${encodeURIComponent(order.patient.dni)}`}
                              className="hover:text-brand-600 hover:underline transition-colors">
                              {order.patient?.lastName}, {order.patient?.firstName}
                            </Link>
                          ) : (
                            <>{order.patient?.lastName}, {order.patient?.firstName}</>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-500">{order.patient?.dni}</td>
                        <td className="px-4 py-3 font-bold text-slate-600 whitespace-nowrap">
                          {order.dentist ? `${order.dentist.lastName}, ${order.dentist.firstName}` : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-600 whitespace-nowrap">{order.branch?.name}</td>
                        <td className="px-4 py-3 font-bold text-slate-600 whitespace-nowrap">
                          {order.obraSocial?.name || <span className="text-slate-300">Particular</span>}
                          {order.osVariant?.name && <span className="block text-[9px] font-bold text-violet-600">{order.osVariant.name}</span>}
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <div className="flex flex-wrap gap-1">
                            {order.items.map((item: any) => (
                              <span key={item.id} className="bg-slate-100 text-slate-700 font-bold text-[9px] uppercase px-2 py-0.5 rounded-full">
                                {item.procedure?.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">
                          ${Number(order.totalAmount).toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-black text-[9px] uppercase px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline" onClick={() => openEdit(order)}
                            className="h-8 border-brand-200 hover:bg-brand-50 hover:border-brand-400 text-brand-700 font-black text-[10px] uppercase">
                            <Edit2 size={12} className="mr-1" /> Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL EDICIÓN */}
      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-t-8 border-brand-600 p-0 outline-none">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
              <Edit2 size={20} className="text-brand-600" /> Editar Orden {editData?.code}
            </DialogTitle>
          </DialogHeader>

          {editData && (
            <div className="p-6 space-y-6">

              {/* DATOS DE LA ORDEN */}
              <section>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-600 mb-3 flex items-center gap-1.5">
                  <Hash size={12} /> Datos de la Orden
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Nº Orden</Label>
                    <Input value={editData.code} onChange={e => setEditData({...editData, code: e.target.value})} className="h-10 font-bold border-2" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Fecha</Label>
                    <Input type="date" value={editData.createdAt} onChange={e => setEditData({...editData, createdAt: e.target.value})} className="h-10 font-bold border-2" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Estado</Label>
                    <Select value={editData.status} onValueChange={v => setEditData({...editData, status: v})}>
                      <SelectTrigger className="h-10 font-bold border-2 uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="font-bold uppercase">
                        {Object.entries(STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Sede</Label>
                    <Select value={editData.branchId} onValueChange={v => setEditData({...editData, branchId: v})}>
                      <SelectTrigger className="h-10 font-bold border-2 uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="font-bold uppercase">
                        {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Odontólogo</Label>
                    <Select value={editData.dentistId || "NONE"} onValueChange={v => setEditData({...editData, dentistId: v === "NONE" ? "" : v})}>
                      <SelectTrigger className="h-10 font-bold border-2 uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="font-bold uppercase">
                        <SelectItem value="NONE">— Particular —</SelectItem>
                        {dentists.map(d => <SelectItem key={d.id} value={d.id}>{d.lastName}, {d.firstName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Obra Social</Label>
                    <Select value={editData.obraSocialId || "NONE"} onValueChange={v => setEditData({...editData, obraSocialId: v === "NONE" ? "" : v, osVariantId: ""})}>
                      <SelectTrigger className="h-10 font-bold border-2 uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="font-bold uppercase">
                        <SelectItem value="NONE">— Particular —</SelectItem>
                        {obrasSociales.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {/* Sub-selección en edición */}
                    {(() => {
                      const os = obrasSociales.find((o: any) => o.id === editData.obraSocialId);
                      if (!os?.variants?.length) return null;
                      return (
                        <Select value={editData.osVariantId || "NONE"} onValueChange={v => setEditData({...editData, osVariantId: v === "NONE" ? "" : v})}>
                          <SelectTrigger className="h-9 font-bold uppercase border-2 border-violet-300 bg-violet-50 text-[10px] mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent className="font-black uppercase">
                            <SelectItem value="NONE">— Sin variante —</SelectItem>
                            {os.variants.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      );
                    })()}
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Notas / Observaciones</Label>
                    <Input value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} className="h-10 font-bold border-2" placeholder="Ninguna" />
                  </div>
                </div>
              </section>

              {/* DATOS DEL PACIENTE */}
              <section>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                  <User size={12} /> Datos del Paciente
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Apellido</Label>
                    <Input value={editData.patient.lastName} onChange={e => setEditData({...editData, patient: {...editData.patient, lastName: e.target.value}})} className="h-10 font-bold border-2 uppercase" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Nombre</Label>
                    <Input value={editData.patient.firstName} onChange={e => setEditData({...editData, patient: {...editData.patient, firstName: e.target.value}})} className="h-10 font-bold border-2 uppercase" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Teléfono</Label>
                    <Input value={editData.patient.phone} onChange={e => setEditData({...editData, patient: {...editData.patient, phone: e.target.value}})} className="h-10 font-bold border-2" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Fecha de Nacimiento</Label>
                    <Input type="date" value={editData.patient.birthDate} onChange={e => setEditData({...editData, patient: {...editData.patient, birthDate: e.target.value}})} className="h-10 font-bold border-2" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Nº Afiliado</Label>
                    <Input value={editData.patient.affiliateNumber} onChange={e => setEditData({...editData, patient: {...editData.patient, affiliateNumber: e.target.value}})} className="h-10 font-bold border-2" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Plan OS</Label>
                    <Input value={editData.patient.plan} onChange={e => setEditData({...editData, patient: {...editData.patient, plan: e.target.value}})} className="h-10 font-bold border-2 uppercase" />
                  </div>
                </div>
              </section>

              {/* PRÁCTICAS */}
              <section>
                <button onClick={() => setExpandedItems(!expandedItems)}
                  className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 hover:text-brand-600 transition-colors">
                  <span className="flex items-center gap-1.5">
                    <ClipboardList size={12} /> Prácticas ({editData.items.length}) — Total: ${totalItems.toLocaleString('es-AR')}
                  </span>
                  {expandedItems ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {expandedItems && (
                  <div className="space-y-2">
                    {editData.items.map((item: any, index: number) => (
                      <div key={index} className={`rounded-xl border p-3 transition-colors ${item.hidden ? 'bg-slate-100 border-slate-300 opacity-60' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-black uppercase ${item.hidden ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.procedureName}</p>
                            {item.hidden && <span className="text-[9px] font-black uppercase bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Oculto</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateItem(index, 'hidden', !item.hidden)}
                              title={item.hidden ? 'Mostrar al paciente/odontólogo' : 'Ocultar al paciente/odontólogo'}
                              className={`transition-colors ${item.hidden ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-brand-600'}`}
                            >
                              {item.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-[9px] font-black uppercase text-slate-400">Valor OS</Label>
                            <Input type="number" value={item.insuranceCoverage}
                              onChange={e => updateItem(index, 'insuranceCoverage', Number(e.target.value))}
                              className="h-8 font-bold border-2 text-right" />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[9px] font-black uppercase text-slate-400">Copago</Label>
                            <Input type="number" value={item.patientCopay}
                              onChange={e => updateItem(index, 'patientCopay', Number(e.target.value))}
                              className="h-8 font-bold border-2 text-right" />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[9px] font-black uppercase text-slate-400">Total</Label>
                            <Input type="number" value={item.price} readOnly className="h-8 font-black border-2 text-right bg-slate-100" />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Agregar práctica */}
                    <div className="flex gap-2">
                      <Select onValueChange={addItem}>
                        <SelectTrigger className="h-9 font-bold border-2 uppercase text-xs flex-1"><SelectValue placeholder="+ Agregar práctica..." /></SelectTrigger>
                        <SelectContent className="font-bold uppercase text-xs">
                          {procedures.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </section>

              {/* BOTONES */}
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <Button variant="outline" onClick={() => setEditingOrder(null)} className="flex-1 h-11 font-black uppercase border-2">
                  <X size={15} className="mr-2" /> Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 h-11 bg-brand-600 hover:bg-brand-700 text-white font-black uppercase shadow-lg">
                  <Save size={15} className="mr-2" /> {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
