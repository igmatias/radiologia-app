"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { importDentistsAction } from "@/actions/dentists"

export default function QuickDentistForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    Nombre: "", Apellido: "", MatriculaProvincial: "", MatriculaNacional: "",
    Telefono: "", Email: "", deliveryMethod: "DIGITAL", digitalChannel: "WHATSAPP"
  });

  const handleSubmit = async () => {
    if (!data.Apellido || !data.Nombre) return toast.error("Completá nombre y apellido");
    setLoading(true);
    const res = await importDentistsAction([{
      firstName: data.Nombre,
      lastName: data.Apellido,
      matriculaProv: data.MatriculaProvincial,
      matriculaNac: data.MatriculaNacional,
      phone: data.Telefono,
      email: data.Email,
      deliveryMethod: data.deliveryMethod,
      resultPreference: data.digitalChannel,
      isActive: true
    }]);
    if (res.success) { toast.success("Profesional guardado"); onSuccess(); }
    setLoading(false);
  };

  return (
    <div className="bg-white p-8 font-black uppercase italic rounded-3xl flex flex-col gap-6">
      <h3 className="text-2xl border-b-2 border-brand-700 pb-2">Nuevo Profesional</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input placeholder="APELLIDO *" value={data.Apellido} onChange={e => setData({...data, Apellido: e.target.value.toUpperCase()})} className="h-12 border-2"/>
        <Input placeholder="NOMBRE *" value={data.Nombre} onChange={e => setData({...data, Nombre: e.target.value.toUpperCase()})} className="h-12 border-2"/>
        <Input placeholder="MATRÍCULA PROVINCIAL" value={data.MatriculaProvincial} onChange={e => setData({...data, MatriculaProvincial: e.target.value.toUpperCase()})} className="h-12 border-2"/>
        <Input placeholder="MATRÍCULA NACIONAL" value={data.MatriculaNacional} onChange={e => setData({...data, MatriculaNacional: e.target.value.toUpperCase()})} className="h-12 border-2"/>
        <Input placeholder="TELÉFONO" value={data.Telefono} onChange={e => setData({...data, Telefono: e.target.value})} className="h-12 border-2"/>
        <Input placeholder="EMAIL" type="email" value={data.Email} onChange={e => setData({...data, Email: e.target.value.toLowerCase()})} className="h-12 border-2 lowercase not-italic"/>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] text-slate-500">Entrega de Resultados</Label>
          <Select value={data.deliveryMethod} onValueChange={(v) => setData({...data, deliveryMethod: v})}>
            <SelectTrigger className="h-12 border-2 font-black uppercase"><SelectValue /></SelectTrigger>
            <SelectContent className="font-black uppercase">
              <SelectItem value="DIGITAL">Digital</SelectItem>
              <SelectItem value="IMPRESA">Impresa</SelectItem>
              <SelectItem value="AMBAS">Ambas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] text-slate-500">Canal Digital</Label>
          <Select value={data.digitalChannel} onValueChange={(v) => setData({...data, digitalChannel: v})}>
            <SelectTrigger className="h-12 border-2 font-black uppercase"><SelectValue /></SelectTrigger>
            <SelectContent className="font-black uppercase">
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="PORTAL">Portal Médico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button className="bg-brand-700 text-white h-14 uppercase" onClick={handleSubmit} disabled={loading}>
        GUARDAR PROFESIONAL ✓
      </Button>
    </div>
  )
}
