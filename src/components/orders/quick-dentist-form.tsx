"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { importDentistsAction } from "@/actions/dentists"

export function QuickDentistForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ Nombre: "", Apellido: "", MatriculaProvincial: "", MatriculaNacional: "", Telefono: "", Email: "", deliveryMethod: "DIGITAL", digitalChannel: "WHATSAPP" });

  const handleSubmit = async () => {
    if (!data.Apellido || !data.Nombre) return toast.error("Completá nombre y apellido");
    setLoading(true);
    const res = await importDentistsAction([{
      firstName: data.Nombre,
      lastName: data.Apellido,
      matriculaProv: data.MatriculaProvincial,
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
        <Input placeholder="APELLIDO" value={data.Apellido} onChange={e => setData({...data, Apellido: e.target.value.toUpperCase()})} className="h-12 border-2"/>
        <Input placeholder="NOMBRE" value={data.Nombre} onChange={e => setData({...data, Nombre: e.target.value.toUpperCase()})} className="h-12 border-2"/>
      </div>
      <Button className="bg-brand-700 text-white h-14 uppercase" onClick={handleSubmit} disabled={loading}>GUARDAR PROFESIONAL ✓</Button>
    </div>
  )
}
