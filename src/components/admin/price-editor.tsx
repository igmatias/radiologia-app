"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { updateProcedurePrice, createObraSocial, deleteObraSocial, updatePriceCustomCode, updateMaxAgeOrtodoncia, createOSVariant, deleteOSVariant, updateObraSocialClosingDay, createBillingPeriod, updateBillingPeriod, deleteBillingPeriod } from "@/actions/admin"
import { toast } from "sonner"
import { Plus, Trash2, Building2, Search, X, Calculator, Tag, ShieldAlert, List, Check, CalendarRange, Calendar, Pencil } from "lucide-react"

export function PriceEditor({ obrasSociales, procedures }: any) {
  // Copia local de todas las OS (para mantener cambios al switchear entre ellas)
  const [localOS, setLocalOS] = useState<any[]>(obrasSociales)
  const [selectedOS, setSelectedOS] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newOSName, setNewOSName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [newVariantName, setNewVariantName] = useState("")
  const [isAddingVariant, setIsAddingVariant] = useState(false)

  // Períodos de facturación
  const [isAddingPeriod, setIsAddingPeriod] = useState(false)
  const [newPeriodStart, setNewPeriodStart] = useState("")
  const [newPeriodEnd, setNewPeriodEnd] = useState("")
  const [newPeriodName, setNewPeriodName] = useState("")
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null)
  const [editingPeriodName, setEditingPeriodName] = useState("")

  const filteredProcedures = procedures.filter((p: any) =>
    p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")) ||
    p.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOSChange = (id: string) => {
    const os = localOS.find((o: any) => o.id === id)
    setSelectedOS(os)
    setIsAddingPeriod(false)
    setEditingPeriodId(null)
  }

  const autoGeneratePeriodName = (startDate: string) => {
    if (!startDate) return ""
    const d = new Date(startDate + "T12:00:00")
    const yy = String(d.getFullYear()).slice(-2)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${yy}-${mm}`
  }

  const autoNextPeriod = () => {
    const periods: any[] = selectedOS.billingPeriods || []
    const closingDay: number = selectedOS.closingDay || 2
    let nextStart: Date

    if (periods.length > 0) {
      const sorted = [...periods].sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
      const lastEnd = new Date(sorted[0].endDate)
      nextStart = new Date(lastEnd)
      nextStart.setDate(nextStart.getDate() + 1)
    } else {
      const today = new Date()
      if (today.getDate() > closingDay) {
        nextStart = new Date(today.getFullYear(), today.getMonth(), closingDay + 1)
      } else {
        nextStart = new Date(today.getFullYear(), today.getMonth() - 1, closingDay + 1)
      }
    }

    const nextEnd = new Date(nextStart.getFullYear(), nextStart.getMonth() + 1, closingDay)
    const startStr = nextStart.toISOString().slice(0, 10)
    const endStr = nextEnd.toISOString().slice(0, 10)

    setNewPeriodStart(startStr)
    setNewPeriodEnd(endStr)
    setNewPeriodName(autoGeneratePeriodName(startStr))
    setIsAddingPeriod(true)
  }

  // Actualiza el estado local (selectedOS + localOS) tras guardar
  const applyLocalUpdate = (procedureId: string, newInsurance: number, newPatient: number, newCode?: string | null) => {
    setSelectedOS((prev: any) => {
      const existingPrices: any[] = prev.priceList?.prices || []
      const idx = existingPrices.findIndex((p: any) => p.procedureId === procedureId)
      let newPrices: any[]
      if (idx >= 0) {
        newPrices = existingPrices.map((p: any) =>
          p.procedureId === procedureId
            ? { ...p, insuranceCoverage: newInsurance, patientCopay: newPatient, amount: newInsurance + newPatient, ...(newCode !== undefined ? { customCode: newCode } : {}) }
            : p
        )
      } else {
        newPrices = [...existingPrices, { procedureId, insuranceCoverage: newInsurance, patientCopay: newPatient, amount: newInsurance + newPatient, customCode: newCode ?? null }]
      }
      const updated = { ...prev, priceList: { ...prev.priceList, prices: newPrices } }
      // Actualizar también en localOS
      setLocalOS((all: any[]) => all.map((o: any) => o.id === prev.id ? updated : o))
      return updated
    })
  }

  const handleCreate = async () => {
    if (!newOSName) return
    const res = await createObraSocial(newOSName)
    if (res.success) {
      toast.success("Obra Social creada")
      setNewOSName("")
      setIsCreating(false)
      window.location.reload()
    }
  }

  const handleDelete = async () => {
    if (!selectedOS) return
    if (!confirm(`¿Eliminar ${selectedOS.name}?`)) return
    const res = await deleteObraSocial(selectedOS.id)
    if (res.success) {
      toast.success("Obra Social eliminada")
      setSelectedOS(null)
      setLocalOS((all: any[]) => all.filter((o: any) => o.id !== selectedOS.id))
    } else {
      toast.error(res.error || "No se pudo eliminar")
    }
  }

  const handlePriceUpdate = async (
    procedureId: string,
    type: 'insurance' | 'patient',
    value: string,
    currentInsurance: number,
    currentPatient: number
  ) => {
    if (!selectedOS?.priceList?.id) return
    const numValue = parseFloat(value) || 0
    const newInsurance = type === 'insurance' ? numValue : currentInsurance
    const newPatient = type === 'patient' ? numValue : currentPatient
    if (newInsurance === currentInsurance && newPatient === currentPatient) return

    setUpdatingId(procedureId)
    const res = await updateProcedurePrice(selectedOS.priceList.id, procedureId, newInsurance, newPatient)
    if (res.success) {
      toast.success("Valores actualizados", { id: 'price-update' })
      applyLocalUpdate(procedureId, newInsurance, newPatient)
    } else {
      toast.error("Error al guardar")
    }
    setUpdatingId(null)
  }

  const handleCodeUpdate = async (procedureId: string, newCode: string, currentCode: string | null) => {
    if (!selectedOS?.priceList?.id) return
    const trimmed = newCode.trim()
    if (trimmed === (currentCode || '')) return

    setUpdatingId(procedureId)
    const res = await updatePriceCustomCode(selectedOS.priceList.id, procedureId, trimmed)
    if (res.success) {
      toast.success("Código actualizado", { id: 'code-update' })
      const priceRecord = selectedOS?.priceList?.prices?.find((p: any) => p.procedureId === procedureId)
      applyLocalUpdate(procedureId, Number(priceRecord?.insuranceCoverage || 0), Number(priceRecord?.patientCopay || 0), trimmed || null)
    } else {
      toast.error("Error al guardar el código")
    }
    setUpdatingId(null)
  }

  return (
    <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* PANEL IZQUIERDO */}
      <div className="space-y-4">
        <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b pb-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-700" />
              Directorio de Mutuales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Seleccionar Convenio</label>
              <Select onValueChange={handleOSChange} value={selectedOS?.id}>
                <SelectTrigger className="h-12 border-2 font-bold uppercase text-sm">
                  <SelectValue placeholder="ELEGIR MUTUAL..." />
                </SelectTrigger>
                <SelectContent className="font-bold uppercase">
                  {localOS.map((os: any) => (
                    <SelectItem key={os.id} value={os.id}>{os.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isCreating ? (
              <Button
                variant="outline"
                className="w-full border-dashed text-slate-500 h-12 hover:border-brand-500 hover:text-brand-700 transition-all font-bold uppercase text-xs"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Cargar Nueva Mutual
              </Button>
            ) : (
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-brand-200 animate-in fade-in zoom-in duration-200 shadow-inner">
                <label className="text-[10px] font-black uppercase text-brand-700 tracking-widest">Nombre de la Mutual</label>
                <Input
                  placeholder="EJ: OSDE, IOMA..."
                  value={newOSName}
                  onChange={(e) => setNewOSName(e.target.value.toUpperCase())}
                  className="bg-white h-10 font-bold uppercase"
                  autoFocus
                />
                <div className="flex gap-2 pt-1">
                  <Button className="flex-1 bg-brand-700 hover:bg-brand-800 font-bold uppercase text-xs h-10" onClick={handleCreate}>Guardar ✓</Button>
                  <Button variant="outline" className="h-10 px-3 hover:bg-slate-200" onClick={() => setIsCreating(false)}><X className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            {selectedOS && (
              <Button
                variant="ghost"
                className="w-full text-slate-400 hover:bg-brand-50 hover:text-brand-700 transition-colors text-[10px] font-bold uppercase mt-8"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3 mr-2" /> Eliminar {selectedOS.name}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Leyenda de equivalencias */}
        {selectedOS && (
          <Card className="border-none shadow-sm rounded-2xl bg-amber-50 border border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Tag size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase text-amber-800 mb-1">Equivalencia de Códigos</p>
                  <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                    Completá la columna <strong>Cód. OS</strong> si esta mutual usa un código distinto al estándar. Aparecerá en la liquidación en lugar del código por defecto.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edad máxima ortodoncia */}
        {selectedOS && (
          <Card className="border-none shadow-sm rounded-2xl bg-indigo-50 border border-indigo-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <ShieldAlert size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase text-indigo-800 mb-1">Edad Máx. Estudios Ortodoncia</p>
                  <p className="text-[10px] font-bold text-indigo-600 leading-relaxed">
                    Si esta mutual tiene límite de edad para cefalogramas y fotos clínicas, ingresá la edad máxima. Se mostrará una alerta al cargar la orden.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  placeholder="Sin límite"
                  className="h-10 w-full font-black text-center border-2 border-indigo-200 bg-white text-indigo-800"
                  defaultValue={selectedOS.maxAgeOrtodoncia ?? ''}
                  key={selectedOS.id}
                  onBlur={async (e) => {
                    const val = e.target.value.trim();
                    const newAge = val ? parseInt(val) : null;
                    const currentAge = selectedOS.maxAgeOrtodoncia ?? null;
                    if (newAge === currentAge) return;
                    const res = await updateMaxAgeOrtodoncia(selectedOS.id, newAge);
                    if (res.success) {
                      toast.success("Edad máxima actualizada");
                      setSelectedOS((prev: any) => ({ ...prev, maxAgeOrtodoncia: newAge }));
                      setLocalOS((all: any[]) => all.map((o: any) => o.id === selectedOS.id ? { ...o, maxAgeOrtodoncia: newAge } : o));
                    } else {
                      toast.error("Error al guardar");
                    }
                  }}
                />
                <span className="text-xs font-black uppercase text-indigo-500 shrink-0">Años</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Día de cierre */}
        {selectedOS && (
          <Card className="border-none shadow-sm rounded-2xl bg-teal-50 border border-teal-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Calendar size={14} className="text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase text-teal-800 mb-1">Día de Cierre del Período</p>
                  <p className="text-[10px] font-bold text-teal-600 leading-relaxed">
                    Día del mes en que cierra el período de esta mutual. Se usa como referencia al crear nuevos períodos.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Sin definir"
                  className="h-10 w-full font-black text-center border-2 border-teal-200 bg-white text-teal-800"
                  defaultValue={selectedOS.closingDay ?? ''}
                  key={selectedOS.id + '-closing'}
                  onBlur={async (e) => {
                    const val = e.target.value.trim();
                    const newDay = val ? parseInt(val) : null;
                    if (newDay !== null && (newDay < 1 || newDay > 31)) return;
                    const currentDay = selectedOS.closingDay ?? null;
                    if (newDay === currentDay) return;
                    const res = await updateObraSocialClosingDay(selectedOS.id, newDay);
                    if (res.success) {
                      toast.success("Día de cierre actualizado");
                      setSelectedOS((prev: any) => ({ ...prev, closingDay: newDay }));
                      setLocalOS((all: any[]) => all.map((o: any) => o.id === selectedOS.id ? { ...o, closingDay: newDay } : o));
                    } else {
                      toast.error("Error al guardar");
                    }
                  }}
                />
                <span className="text-xs font-black uppercase text-teal-500 shrink-0">de cada mes</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sub-selecciones (variantes) */}
        {selectedOS && (
          <Card className="border-none shadow-sm rounded-2xl bg-violet-50 border border-violet-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <List size={14} className="text-violet-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-violet-800 mb-1">Sub-selecciones</p>
                  <p className="text-[10px] font-bold text-violet-600 leading-relaxed">
                    Variantes de facturación (ej: Gravado, No Gravado, Intraorales, etc.)
                  </p>
                </div>
              </div>

              {/* Lista de variantes existentes */}
              {(selectedOS.variants || []).length > 0 && (
                <div className="space-y-1.5">
                  {selectedOS.variants.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-violet-200">
                      <span className="text-xs font-black uppercase text-violet-800">{v.name}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(`¿Eliminar "${v.name}"?`)) return;
                          const res = await deleteOSVariant(v.id);
                          if (res.success) {
                            toast.success("Variante eliminada");
                            const updatedVariants = selectedOS.variants.filter((vr: any) => vr.id !== v.id);
                            setSelectedOS((prev: any) => ({ ...prev, variants: updatedVariants }));
                            setLocalOS((all: any[]) => all.map((o: any) => o.id === selectedOS.id ? { ...o, variants: updatedVariants } : o));
                          } else toast.error(res.error || "Error al eliminar");
                        }}
                        className="text-violet-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar nueva variante */}
              {!isAddingVariant ? (
                <Button
                  variant="outline"
                  className="w-full border-dashed border-violet-300 text-violet-600 h-9 hover:border-violet-500 hover:text-violet-800 transition-all font-bold uppercase text-[10px]"
                  onClick={() => setIsAddingVariant(true)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Agregar Variante
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="EJ: GRAVADO, NO GRAVADO..."
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value.toUpperCase())}
                    className="h-9 text-xs font-black uppercase border-2 border-violet-300 bg-white flex-1"
                    autoFocus
                  />
                  <Button
                    className="h-9 px-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs"
                    onClick={async () => {
                      if (!newVariantName.trim()) return;
                      const res = await createOSVariant(selectedOS.id, newVariantName);
                      if (res.success) {
                        toast.success("Variante creada");
                        // Refresh: add locally
                        const newVar = { id: `temp-${Date.now()}`, name: newVariantName.toUpperCase().trim(), obraSocialId: selectedOS.id };
                        const updatedVariants = [...(selectedOS.variants || []), newVar];
                        setSelectedOS((prev: any) => ({ ...prev, variants: updatedVariants }));
                        setLocalOS((all: any[]) => all.map((o: any) => o.id === selectedOS.id ? { ...o, variants: updatedVariants } : o));
                        setNewVariantName("");
                        setIsAddingVariant(false);
                      } else toast.error(res.error || "Error al crear");
                    }}
                  >
                    <Check size={14} />
                  </Button>
                  <Button variant="ghost" className="h-9 px-2" onClick={() => { setIsAddingVariant(false); setNewVariantName(""); }}>
                    <X size={14} />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* PANEL DERECHO: TARIFARIO */}
      <Card className="md:col-span-2 xl:col-span-3 border-none shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-900 text-white space-y-4 p-6 border-b-8 border-brand-700">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <Calculator className="text-brand-500" />
              {selectedOS ? `Aranceles: ${selectedOS.name}` : "Configuración de Precios"}
            </CardTitle>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="BUSCAR ESTUDIO (EJ: PERIAPICAL, 09.01)..."
              className="pl-10 h-12 text-sm bg-slate-800 border-slate-700 text-white font-bold uppercase placeholder:text-slate-500 focus-visible:ring-brand-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {!selectedOS ? (
            <div className="text-center py-32 bg-slate-50">
              <Building2 className="h-16 w-16 text-slate-200 mx-auto mb-4" />
              <p className="text-lg font-black italic text-slate-400 uppercase tracking-tighter">Esperando Selección</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Seleccioná una obra social del panel izquierdo</p>
            </div>
          ) : (
            // key=selectedOS.id fuerza remount completo al cambiar de OS → inputs se reinician
            <div key={selectedOS.id} className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-widest sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 pl-6 border-b-2 border-slate-200">Código / Estudio</th>
                    <th className="p-4 w-36 text-center border-b-2 border-slate-200">Cubre Mutual</th>
                    <th className="p-4 w-36 text-center border-b-2 border-slate-200 bg-brand-50 text-brand-800">Copago Paciente</th>
                    <th className="p-4 w-28 text-right pr-6 border-b-2 border-slate-200">Total</th>
                    <th className="p-4 w-36 text-center border-b-2 border-slate-200 bg-amber-50 text-amber-800">Cód. OS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProcedures.map((proc: any) => {
                    const priceRecord = selectedOS?.priceList?.prices?.find((p: any) => p.procedureId === proc.id)
                    const insuranceValue = Number(priceRecord?.insuranceCoverage || 0)
                    const patientValue = Number(priceRecord?.patientCopay || 0)
                    const totalValue = insuranceValue + patientValue
                    const customCode: string | null = priceRecord?.customCode || null
                    const isUpdating = updatingId === proc.id

                    return (
                      <tr key={proc.id} className={`hover:bg-slate-50 transition-colors ${isUpdating ? 'bg-amber-50' : ''}`}>
                        <td className="p-4 pl-6">
                          <p className="text-[10px] text-brand-700 font-black uppercase mb-0.5">{proc.code}</p>
                          <p className="text-sm font-black text-slate-800 uppercase leading-tight">{proc.name}</p>
                        </td>

                        {/* CUBRE MUTUAL */}
                        <td className="p-4">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                            <Input
                              type="number"
                              className="pl-7 w-full text-center font-bold text-slate-700 border-2 focus-visible:ring-slate-400 h-10"
                              defaultValue={insuranceValue}
                              onBlur={(e) => handlePriceUpdate(proc.id, 'insurance', e.target.value, insuranceValue, patientValue)}
                            />
                          </div>
                        </td>

                        {/* COPAGO PACIENTE */}
                        <td className="p-4 bg-brand-50/30">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 text-xs font-bold">$</span>
                            <Input
                              type="number"
                              className="pl-7 w-full text-center font-black text-brand-700 border-2 border-brand-200 focus-visible:ring-brand-500 bg-white h-10 shadow-sm"
                              defaultValue={patientValue}
                              onBlur={(e) => handlePriceUpdate(proc.id, 'patient', e.target.value, insuranceValue, patientValue)}
                            />
                          </div>
                        </td>

                        {/* TOTAL */}
                        <td className="p-4 pr-6 text-right">
                          <span className={`text-lg font-black italic ${totalValue > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                            ${totalValue.toLocaleString('es-AR')}
                          </span>
                        </td>

                        {/* CÓDIGO OS (equivalencia) */}
                        <td className="p-4 bg-amber-50/40">
                          <Input
                            type="text"
                            className="w-full text-center font-black text-amber-800 border-2 border-amber-200 focus-visible:ring-amber-400 bg-white h-10 uppercase text-xs tracking-widest"
                            defaultValue={customCode || ''}
                            placeholder={proc.code}
                            onBlur={(e) => handleCodeUpdate(proc.id, e.target.value.toUpperCase(), customCode)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredProcedures.length === 0 && (
                <div className="text-center py-20 bg-slate-50 border-t border-dashed">
                  <Search className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm font-bold uppercase text-slate-400 tracking-widest">No hay coincidencias.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {/* SECCIÓN FULL-WIDTH: PERÍODOS DE FACTURACIÓN */}
    {selectedOS && (
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden border-t-4 border-cyan-500">
        <CardHeader className="bg-cyan-50 border-b border-cyan-100 pb-4 pt-5 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarRange size={20} className="text-cyan-600" />
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-cyan-900">
                  Períodos de Facturación — {selectedOS.name}
                </CardTitle>
                <p className="text-[10px] font-bold text-cyan-600 mt-0.5">
                  Rangos de fechas para filtrar en facturación y control de recetas
                  {selectedOS.closingDay ? ` · Día de cierre: ${selectedOS.closingDay}` : ''}
                </p>
              </div>
            </div>
            {!isAddingPeriod && (
              <div className="flex gap-2">
                {selectedOS.closingDay && (
                  <Button
                    variant="outline"
                    className="border-dashed border-2 border-cyan-400 text-cyan-600 hover:border-cyan-600 hover:bg-cyan-50 font-bold uppercase text-xs h-9"
                    onClick={autoNextPeriod}
                  >
                    ⚡ Generar próximo
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="border-dashed border-2 border-cyan-300 text-cyan-700 hover:border-cyan-500 hover:bg-cyan-50 font-bold uppercase text-xs h-9"
                  onClick={() => setIsAddingPeriod(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Agregar Período
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Formulario nuevo período */}
          {isAddingPeriod && (
            <div className="bg-cyan-50 rounded-xl border-2 border-cyan-200 p-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-[9px] font-black uppercase text-cyan-700 tracking-widest">Desde</label>
                <Input
                  type="date"
                  value={newPeriodStart}
                  onChange={e => {
                    setNewPeriodStart(e.target.value);
                    setNewPeriodName(autoGeneratePeriodName(e.target.value));
                  }}
                  className="h-9 text-xs border-cyan-200 mt-1 w-40"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-cyan-700 tracking-widest">Hasta</label>
                <Input
                  type="date"
                  value={newPeriodEnd}
                  onChange={e => setNewPeriodEnd(e.target.value)}
                  className="h-9 text-xs border-cyan-200 mt-1 w-40"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-cyan-700 tracking-widest">Nombre del período</label>
                <Input
                  placeholder="EJ: 26-04"
                  value={newPeriodName}
                  onChange={e => setNewPeriodName(e.target.value.toUpperCase())}
                  className="h-9 text-xs border-cyan-200 mt-1 w-28 font-black uppercase"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-cyan-600 hover:bg-cyan-700 font-bold uppercase text-xs h-9 px-4"
                  onClick={async () => {
                    if (!newPeriodStart || !newPeriodEnd || !newPeriodName.trim()) {
                      toast.error("Completá todos los campos");
                      return;
                    }
                    const res = await createBillingPeriod(selectedOS.id, newPeriodName, newPeriodStart, newPeriodEnd);
                    if (res.success && res.period) {
                      toast.success("Período creado");
                      const updated = [...(selectedOS.billingPeriods || []), res.period];
                      setSelectedOS((prev: any) => ({ ...prev, billingPeriods: updated }));
                      setLocalOS((all: any[]) => all.map((o: any) => o.id === selectedOS.id ? { ...o, billingPeriods: updated } : o));
                      setIsAddingPeriod(false);
                      setNewPeriodStart(""); setNewPeriodEnd(""); setNewPeriodName("");
                    } else toast.error(res.error || "Error al crear");
                  }}
                >Guardar ✓</Button>
                <Button variant="outline" className="h-9 px-3 border-cyan-200" onClick={() => { setIsAddingPeriod(false); setNewPeriodStart(""); setNewPeriodEnd(""); setNewPeriodName(""); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Grid de períodos */}
          {(selectedOS.billingPeriods || []).length === 0 && !isAddingPeriod ? (
            <div className="text-center py-8 text-cyan-300">
              <CalendarRange size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs font-black uppercase text-cyan-400">No hay períodos cargados para esta mutual</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {(selectedOS.billingPeriods || []).map((p: any) => (
                <div key={p.id} className="bg-white rounded-xl border-2 border-cyan-100 p-3 space-y-1 hover:border-cyan-300 transition-colors group">
                  {editingPeriodId === p.id ? (
                    <div className="flex gap-1">
                      <Input
                        value={editingPeriodName}
                        onChange={e => setEditingPeriodName(e.target.value.toUpperCase())}
                        className="h-7 text-xs font-black uppercase border-cyan-300 flex-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        className="h-7 px-2 bg-cyan-600 hover:bg-cyan-700 text-white shrink-0"
                        onClick={async () => {
                          const start = new Date(p.startDate).toISOString().split('T')[0];
                          const end = new Date(p.endDate).toISOString().split('T')[0];
                          const res = await updateBillingPeriod(p.id, editingPeriodName, start, end);
                          if (res.success) {
                            toast.success("Período actualizado");
                            const updated = (selectedOS.billingPeriods || []).map((x: any) => x.id === p.id ? { ...x, name: editingPeriodName.trim().toUpperCase() } : x);
                            setSelectedOS((prev: any) => ({ ...prev, billingPeriods: updated }));
                            setLocalOS((all: any[]) => all.map((o: any) => o.id === selectedOS.id ? { ...o, billingPeriods: updated } : o));
                            setEditingPeriodId(null);
                          } else toast.error("Error al actualizar");
                        }}
                      ><Check size={11} /></Button>
                      <Button size="sm" variant="ghost" className="h-7 px-1.5 shrink-0" onClick={() => setEditingPeriodId(null)}><X size={11} /></Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-base font-black uppercase text-cyan-800 leading-none">{p.name}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => { setEditingPeriodId(p.id); setEditingPeriodName(p.name); }} className="text-cyan-400 hover:text-cyan-700 p-0.5"><Pencil size={11} /></button>
                        <button type="button" onClick={async () => {
                          if (!confirm(`¿Eliminar período ${p.name}?`)) return;
                          const res = await deleteBillingPeriod(p.id);
                          if (res.success) {
                            toast.success("Período eliminado");
                            const updated = (selectedOS.billingPeriods || []).filter((x: any) => x.id !== p.id);
                            setSelectedOS((prev: any) => ({ ...prev, billingPeriods: updated }));
                            setLocalOS((all: any[]) => all.map((o: any) => o.id === selectedOS.id ? { ...o, billingPeriods: updated } : o));
                          } else toast.error("Error al eliminar");
                        }} className="text-cyan-400 hover:text-red-500 p-0.5"><X size={11} /></button>
                      </div>
                    </div>
                  )}
                  <p className="text-[9px] font-bold text-cyan-500 leading-tight">
                    {new Date(p.startDate).toLocaleDateString('es-AR')}<br />{new Date(p.endDate).toLocaleDateString('es-AR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )}
    </div>
  )
}
