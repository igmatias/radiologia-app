"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Plus, Check, Settings2, X, Stethoscope, LayoutGrid, ScanLine, MapPin } from "lucide-react"
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
  return (
    <div className="space-y-8 animate-in slide-in-from-right">
      <div className="bg-white p-6 rounded-2xl border-2 border-red-500 relative shadow-md">
        <div className="flex justify-between items-center mb-4 text-red-700 font-black uppercase italic">
          <Label className="text-sm">Odontólogo Solicitante</Label>
          <Dialog open={isDentistModalOpen} onOpenChange={setIsDentistModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs font-bold bg-white shadow-sm hover:bg-red-50 border-red-200 text-red-700 px-3">+ Nuevo Profesional</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-none bg-transparent shadow-none p-0 outline-none">
              <DialogTitle className="sr-only">Nuevo Profesional</DialogTitle>
              <QuickDentistForm onSuccess={() => setIsDentistModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        {!form.watch("dentistId") ? (
          <div className="relative shadow-sm rounded-xl">
            <Search className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
            <Input placeholder="Escribí APELLIDO O MATRÍCULA..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 uppercase font-bold border-2 border-slate-300 bg-slate-50" />
            {searchTerm && (
              <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-slate-200 shadow-2xl rounded-xl overflow-hidden font-bold">
                {filteredDentists.map((d: any) => (
                  <div key={d.id} className="p-4 hover:bg-red-50 cursor-pointer border-b last:border-0 font-black uppercase italic text-sm" onClick={() => { form.setValue("dentistId", d.id); setSearchTerm(""); }}>
                    {d.lastName}, {d.firstName} {d.matriculaProv ? `(MP: ${d.matriculaProv})` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (() => {
          const d = dentists.find((doc: any) => doc.id === form.watch("dentistId"));
          return d && (
            <div className="flex flex-col gap-2">
              <div className="px-5 py-3 bg-red-700 text-white rounded-xl text-sm font-black italic flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2 uppercase"><Stethoscope size={16} /> {d.lastName}, {d.firstName}</div>
                <button type="button" onClick={() => form.setValue("dentistId", "")} className="bg-red-900 hover:bg-red-950 p-1.5 rounded-full transition-colors"><X size={14} /></button>
              </div>
              {/* CHIPS DE PREFERENCIAS DEL MEDICO */}
              <div className="flex gap-2 ml-1">
                {(d.deliveryMethod === 'IMPRESA' || d.deliveryMethod === 'AMBAS') && (
                  <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-orange-100 text-orange-800 border border-orange-200 shadow-sm flex items-center gap-1">📦 FÍSICO</span>
                )}
                {(d.deliveryMethod === 'DIGITAL' || d.deliveryMethod === 'AMBAS' || !d.deliveryMethod) && (
                  <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-blue-100 text-blue-800 border border-blue-200 shadow-sm flex items-center gap-1">📱 DIGITAL ({d.resultPreference || 'WHATSAPP'})</span>
                )}
              </div>
            </div>
          )
        })()}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <Label className="text-xs font-black uppercase italic text-slate-900 flex items-center gap-2"><LayoutGrid size={16}/> Prácticas</Label>
          <div className="relative w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input placeholder="FILTRAR ESTUDIO..." value={procedureSearch} onChange={(e) => setProcedureSearch(e.target.value)} className="pl-9 h-9 text-xs uppercase font-bold border-2 border-slate-200 bg-slate-50 rounded-lg" /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 pb-2">
          {filteredProcedures.map((p: any) => {
            const selectedItem = form.watch("items").find((i: any) => i.procedureId === p.id);
            const isSelected = !!selectedItem;
            const hasConfig = p.requiresTooth || (p.options && p.options.length > 0);

            return (
              <div key={p.id} className={`flex items-center p-2 rounded-2xl border-2 transition-all ${isSelected ? 'bg-red-50 border-red-700 shadow-md scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                <button type="button" onClick={() => onToggleProcedure(p.id)} className="flex-1 flex items-start gap-3 p-1.5 text-left">
                  <div className={`h-8 w-8 mt-1 shrink-0 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-[9px] font-black uppercase text-red-700 mb-0.5 leading-none">{p.code}</p>
                    <p className="text-xs font-black uppercase leading-tight truncate" title={p.name}>{p.name}</p>
                    {isSelected && selectedItem && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {selectedItem.teeth?.length > 0 && <span className="text-[9px] font-black bg-red-200 text-red-800 px-1.5 py-0.5 rounded-md uppercase border border-red-300 inline-flex items-center gap-1"><ScanLine size={9} /> {selectedItem.teeth.join(', ')}</span>}
                        {selectedItem.locations?.length > 0 && <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md uppercase border border-blue-200 inline-flex items-center gap-1"><MapPin size={9} /> {selectedItem.locations.join(', ')}</span>}
                      </div>
                    )}
                  </div>
                </button>
                {isSelected && hasConfig && (
                  <button onClick={() => setActiveConfigId(p.id)} className="mr-2 shrink-0 bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
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
