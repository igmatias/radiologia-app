"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { importDentistsAction } from "@/actions/dentists"

export default function QuickDentistForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue } = useForm()

  const onSubmit = async (data: any) => {
    setLoading(true)
    // Reutilizamos la lógica de importación pero mandando un solo objeto en un array
    const res = await importDentistsAction([data])
    if (res.success) {
      toast.success("Profesional registrado con éxito")
      onSuccess()
    } else {
      toast.error("Error al registrar")
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 font-black uppercase italic">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] text-slate-400">Apellido</Label>
          <Input {...register("Apellido")} placeholder="PEÑA" className="h-12 border-2 uppercase font-bold" required />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] text-slate-400">Nombre</Label>
          <Input {...register("Nombre")} placeholder="CARLOS" className="h-12 border-2 uppercase font-bold" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] text-slate-400">Matrícula Prov.</Label>
          <Input {...register("Matricula Provincial")} placeholder="12345" className="h-12 border-2 font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] text-slate-400">E-Mail</Label>
          <Input {...register("E-Mail")} type="email" placeholder="DOC@MAIL.COM" className="h-12 border-2 font-bold" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] text-slate-400">Preferencia de Entrega</Label>
        <Select onValueChange={(v) => setValue("Prefiere recibir los resultados de manera", v)}>
          <SelectTrigger className="h-12 border-2 font-bold">
            <SelectValue placeholder="SELECCIONAR..." />
          </SelectTrigger>
          <SelectContent className="font-bold uppercase italic">
            <SelectItem value="DIGITAL">DIGITAL (WHATSAPP/MAIL)</SelectItem>
            <SelectItem value="IMPRESO">IMPRESO (PACIENTE)</SelectItem>
            <SelectItem value="AMBAS">AMBAS MODALIDADES</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-brand-700 h-14 text-white text-lg rounded-2xl shadow-xl">
        {loading ? "GUARDANDO..." : "REGISTRAR PROFESIONAL ✓"}
      </Button>
    </form>
  )
}