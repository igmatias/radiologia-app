"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText } from "lucide-react"

interface StepPatientProps {
  form: any
  patientHistory: any[]
  onShowHistory: () => void
  obrasSociales: any[]
  onDniChange: (value: string) => void
  onDniBlur: (value: string) => void
}

export function StepPatient({ form, patientHistory, onShowHistory, obrasSociales, onDniChange, onDniBlur }: StepPatientProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
      <div className="space-y-2 relative">
        <Label className="text-[10px] font-bold text-slate-400 uppercase">DNI</Label>
        <div className="flex gap-2">
          <Input
            {...form.register("patient.dni", {
              onChange: (e: any) => onDniChange(e.target.value)
            })}
            onBlur={(e: any) => onDniBlur(e.target.value)}
            className="h-11 font-black border-2 flex-1"
            autoFocus
          />
          {patientHistory.length > 0 && (
            <Button type="button" onClick={onShowHistory} className="h-11 px-4 bg-slate-900 hover:bg-red-700 text-white font-black italic uppercase rounded-lg shadow-md">
              <FileText size={18} className="mr-2" /> Historial ({patientHistory.length})
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-slate-400 uppercase">Apellido</Label>
        <Input {...form.register("patient.lastName")} className="h-11 uppercase font-bold border-2" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-slate-400 uppercase">Nombre</Label>
        <Input {...form.register("patient.firstName")} className="h-11 uppercase font-bold border-2" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-slate-400 uppercase">Fecha Nac.</Label>
        <Input {...form.register("patient.birthDate")} type="date" className="h-11 border-2 font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</Label>
        <Input {...form.register("patient.phone")} className="h-11 font-bold border-2" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-slate-400 uppercase">E-mail</Label>
        <Input {...form.register("patient.email")} type="email" className="h-11 font-bold border-2 lowercase" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-slate-400 uppercase">Obra Social</Label>
        <Select value={form.watch("patient.obrasocialId")} onValueChange={(v: any) => form.setValue("patient.obrasocialId", v)}>
          <SelectTrigger className="h-11 font-bold border-2"><SelectValue placeholder="MUTUAL..." /></SelectTrigger>
          <SelectContent className="font-black italic uppercase">
            {obrasSociales.map((os: any) => <SelectItem key={os.id} value={os.id}>{os.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-slate-400 uppercase">N° Afiliado</Label>
        <Input {...form.register("patient.affiliateNumber")} className="h-11 uppercase font-bold border-2" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-slate-400 uppercase">Plan OS</Label>
        <Input {...form.register("patient.plan")} placeholder="Ej: 210, PMO..." className="h-11 uppercase font-bold border-2 bg-blue-50 focus-visible:ring-blue-500" />
      </div>
      <div className="space-y-2 md:col-span-3 mt-2">
        <Label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">Observaciones / Notas</Label>
        <textarea {...form.register("notes")} className="flex w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold uppercase placeholder:text-slate-400 focus-visible:ring-red-700 resize-none h-20 shadow-inner"/>
      </div>
    </div>
  )
}
