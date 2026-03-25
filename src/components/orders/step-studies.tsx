"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Plus, Check, Settings2, X, Stethoscope, ScanLine, MapPin, UserCheck, AlertCircle } from "lucide-react"
import { QuickDentistForm } from "./quick-dentist-form"

interface StepStudiesProps {
  form: any
  dentists: any[]
  procedures: any[]
  searchTerm: string
  setSearchTerm: (v: string) => void
  procedureSearch: string
  setProcedureSearch: (v: string) => void
  filteredDentists: any[]
  filteredProcedures: any[]
  isDentistModalOpen: boolean
  setIsDentistModalOpen: (v: boolean) => void
  activeConfigId: string | null
  setActiveConfigId: (v: string | null) => void
  onToggleProcedure: (procedure: any) => void
}

export function StepStudies({
  form,
  dentists,
  procedures,
  searchTerm,
  setSearchTerm,
  procedureSearch,
  setProcedureSearch,
  filteredDentists,
  filteredProcedures,
  isDentistModalOpen,
  setIsDentistModalOpen,
  activeConfigId,
  setActiveConfigId,
  onToggleProcedure,
}: StepStudiesProps) {
  const dentistId = form.watch("dentistId")
  const selectedDentist = dentists.find((d: any) => d.id === dentistId)
  const selectedItems = form.watch("items") || []
  const selectedCount = selectedItems.length

  return (
    <div className="space-y-6 animate-in slide-in-from-right">

      {/* ===== ODONTÓLOGO SOLICITANTE ===== */}
      <div className={`rounded-2xl border-2 shadow-lg transition-all duration-300 ${dentistId ? 'border-emerald-400' : 'border-brand-500'}`}>

        {/* Header con color fuerte */}
        <div className={`px-5 py-3.5 flex items-center justify-between transition-colors rounded-t-2xl ${dentistId ? 'bg-emerald-600' : 'bg-brand-600'}`}>
          <div className="flex items-center gap-2.5 text-white">
            {dentistId
              ? <UserCheck size={20} className="shrink-0" />
              : <AlertCircle size={20} className="shrink-0 animate-pulse" />
            }
            <span className="font-black uppercase text-sm tracking-widest">Odontólogo Solicitante</span>
            {!dentistId && (
              <span className="hidden sm:inline text-[10px] bg-white/25 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Obligatorio
              </span>
            )}
          </div>

          <Dialog open={isDentistModalOpen} onOpenChange={setIsDentistModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold bg-white/10 hover:bg-white/25 border-white/30 text-white px-3 transition-colors"
              >
                + Nuevo Profesional
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-none bg-transparent shadow-none p-0 outline-none">
              <DialogTitle className="sr-only">Nuevo Profesional</DialogTitle>
              <QuickDentistForm onSuccess={() => setIsDentistModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Cuerpo del buscador / seleccionado */}
        <div className={`p-4 transition-colors rounded-b-2xl ${dentistId ? 'bg-emerald-50/60' : 'bg-brand-50/40'}`}>
          {!dentistId ? (
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Escribí APELLIDO o MATRÍCULA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-sm uppercase font-bold border-2 border-brand-200 bg-white focus-visible:ring-brand-400 rounded-xl"
                autoFocus
              />
              {searchTerm && (
                <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-slate-200 shadow-2xl rounded-xl overflow-hidden font-bold">
                  {filteredDentists.length === 0 ? (
                    <p className="p-4 text-sm text-slate-400 font-bold uppercase text-center">Sin resultados</p>
                  ) : filteredDentists.map((d: any) => (
                    <div
                      key={d.id}
                      className="p-4 hover:bg-brand-50 cursor-pointer border-b last:border-0 text-sm"
                      onClick={() => { form.setValue("dentistId", d.id); setSearchTerm("") }}
                    >
                      <span className="font-black uppercase italic text-slate-900">
                        {d.lastName}, {d.firstName}
                      </span>
                      {d.matriculaProv && (
                        <span className="ml-2 text-[11px] font-bold text-slate-500">MP: {d.matriculaProv}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selectedDentist && (
            <div className="flex flex-col gap-2.5">
              {/* Nombre seleccionado */}
              <div className="flex items-center justify-between bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-md">
                <div className="flex items-center gap-2.5">
                  <Stethoscope size={18} />
                  <span className="font-black uppercase italic text-sm tracking-wide">
                    {selectedDentist.lastName}, {selectedDentist.firstName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => form.setValue("dentistId", "")}
                  className="bg-emerald-800 hover:bg-emerald-900 p-1.5 rounded-full transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              {/* Chips de preferencias */}
              <div className="flex gap-2 ml-1">
                {(selectedDentist.deliveryMethod === 'IMPRESA' || selectedDentist.deliveryMethod === 'AMBAS') && (
                  <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                    📦 Físico
                  </span>
                )}
                {(selectedDentist.deliveryMethod === 'DIGITAL' || selectedDentist.deliveryMethod === 'AMBAS' || !selectedDentist.deliveryMethod) && (
                  <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                    📱 Digital ({selectedDentist.resultPreference || 'WhatsApp'})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== PRÁCTICAS ===== */}
      <div className="space-y-3">

        {/* Header de prácticas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black uppercase text-sm text-slate-800 tracking-wider">Prácticas</span>
            {selectedCount > 0 && (
              <span className="bg-brand-700 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                {selectedCount} seleccionada{selectedCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="relative w-56">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filtrar estudio..."
              value={procedureSearch}
              onChange={(e) => setProcedureSearch(e.target.value)}
              className="pl-9 h-9 text-xs font-bold border-2 border-slate-200 bg-slate-50 rounded-xl"
            />
          </div>
        </div>

        {/* Grid de prácticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1 pb-2">
          {filteredProcedures.map((p: any) => {
            const selectedItem = selectedItems.find((i: any) => i.procedureId === p.id)
            const isSelected = !!selectedItem
            const hasConfig = p.requiresTooth || (p.options && p.options.length > 0)
            const hasTeeth = selectedItem?.teeth?.length > 0
            const hasLocations = selectedItem?.locations?.length > 0

            return (
              <div
                key={p.id}
                className={`flex items-stretch rounded-2xl border-2 transition-all duration-150 ${
                  isSelected
                    ? 'bg-brand-50 border-brand-600 shadow-md'
                    : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Botón principal */}
                <button
                  type="button"
                  onClick={() => onToggleProcedure(p.id)}
                  className="flex-1 flex items-center gap-3 px-4 py-3.5 text-left"
                >
                  {/* Check / Plus */}
                  <div className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </div>

                  {/* Texto */}
                  <div className="flex-1 min-w-0">
                    {/* Código */}
                    <span className={`inline-block text-[10px] font-black uppercase px-1.5 py-0.5 rounded mb-1 ${
                      isSelected ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {p.code}
                    </span>
                    {/* Nombre */}
                    <p className="text-sm font-bold uppercase leading-tight text-slate-900 truncate" title={p.name}>
                      {p.name}
                    </p>
                    {/* Piezas / Ubicaciones seleccionadas */}
                    {isSelected && (hasTeeth || hasLocations) && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {hasTeeth && (
                          <span className="inline-flex items-center gap-1 text-xs font-black bg-brand-100 text-brand-800 px-2 py-0.5 rounded-lg border border-brand-200">
                            <ScanLine size={11} />
                            Piezas: {selectedItem.teeth.join(', ')}
                          </span>
                        )}
                        {hasLocations && (
                          <span className="inline-flex items-center gap-1 text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-lg border border-blue-200">
                            <MapPin size={11} />
                            {selectedItem.locations.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Indicador de que necesita config */}
                    {isSelected && hasConfig && !hasTeeth && !hasLocations && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        ⚠ Configurar piezas/posición
                      </span>
                    )}
                  </div>
                </button>

                {/* Botón de configuración */}
                {isSelected && hasConfig && (
                  <button
                    type="button"
                    onClick={() => setActiveConfigId(p.id)}
                    className="px-3 mr-2 my-2 shrink-0 bg-slate-900 hover:bg-brand-700 text-white rounded-xl transition-colors shadow-sm flex items-center"
                    title="Configurar piezas o posición"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
