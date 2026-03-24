"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { upsertProcedure, deleteProcedure } from "@/actions/procedures"
import {
  LayoutGrid, Search, Plus, Pencil, Trash2, Tag, Hash, Settings2, ScanLine
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function EstudiosClient({ initialProcedures }: { initialProcedures: any[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Estado para el formulario
  const [formData, setFormData] = useState({ id: "", code: "", name: "", category: "", requiresTooth: false, optionsString: "" })

  const filteredProcedures = useMemo(() => {
    const search = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (!search) return initialProcedures;
    return initialProcedures.filter((p: any) => 
      p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search) ||
      p.code.toLowerCase().includes(search) ||
      (p.category && p.category.toLowerCase().includes(search))
    );
  }, [searchTerm, initialProcedures]);

  const openModal = (procedure: any = null) => {
    if (procedure) {
      setFormData({ 
        id: procedure.id, code: procedure.code, name: procedure.name, category: procedure.category || "",
        requiresTooth: procedure.requiresTooth || false,
        optionsString: procedure.options ? procedure.options.join(", ") : ""
      });
    } else {
      setFormData({ id: "", code: "", name: "", category: "", requiresTooth: false, optionsString: "" });
    }
    setIsModalOpen(true);
  }

  const handleSave = async () => {
    if (!formData.code || !formData.name) return toast.error("El código y el nombre son obligatorios");
    setIsLoading(true);

    // Convertimos el texto separado por comas en un array real limpio
    const optionsArray = formData.optionsString
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    const res = await upsertProcedure({
      id: formData.id,
      code: formData.code.toUpperCase(),
      name: formData.name.toUpperCase(),
      category: formData.category.toUpperCase(),
      requiresTooth: formData.requiresTooth,
      options: optionsArray
    });

    if (res.success) {
      toast.success(formData.id ? "Estudio actualizado ✓" : "Estudio creado ✓");
      setIsModalOpen(false);
      window.location.reload(); 
    } else { toast.error(res.error); }
    setIsLoading(false);
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Si ya fue usado, el sistema no lo permitirá.`)) return;
    const res = await deleteProcedure(id);
    if (res.success) { toast.success("Eliminado"); window.location.reload(); } else { toast.error(res.error); }
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER DE BÚSQUEDA Y BOTÓN AGREGAR */}
      <Card className="border-none shadow-md rounded-3xl bg-white overflow-hidden border-t-8 border-slate-900">
        <CardContent className="p-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input placeholder="Buscar por código o nombre..." className="pl-12 h-14 font-bold bg-slate-50 border-2 rounded-2xl text-slate-800" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Button onClick={() => openModal()} className="w-full md:w-auto h-14 bg-red-700 hover:bg-red-800 text-white font-black italic uppercase rounded-2xl px-8 shadow-lg"><Plus size={20} className="mr-2" /> Nuevo Estudio</Button>
        </CardContent>
      </Card>

      {/* TABLA DE ESTUDIOS */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b p-5"><CardTitle className="text-sm font-black uppercase text-slate-800 flex items-center gap-2"><LayoutGrid className="text-red-700" size={18}/> Catálogo Maestro ({filteredProcedures.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 z-10 shadow-sm text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr><th className="p-4 pl-6 border-b-2">Código</th><th className="p-4 border-b-2">Nombre de la Práctica</th><th className="p-4 border-b-2">Configuración</th><th className="p-4 pr-6 border-b-2 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProcedures.length === 0 ? (
                  <tr><td colSpan={4} className="p-10 text-center"><LayoutGrid size={48} className="text-slate-200 mx-auto mb-3" /><p className="text-slate-400 font-bold uppercase italic">No se encontraron estudios.</p></td></tr>
                ) : (
                  filteredProcedures.map((proc: any) => (
                    <tr key={proc.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 pl-6"><span className="inline-flex items-center gap-1 bg-slate-900 text-white text-xs font-black uppercase px-2.5 py-1 rounded-md tracking-widest shadow-sm"><Hash size={12} className="text-slate-400" /> {proc.code}</span></td>
                      <td className="p-4"><span className="font-black uppercase text-slate-800 block">{proc.name}</span>{proc.category && <span className="text-[9px] font-bold text-slate-400 uppercase">{proc.category}</span>}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {proc.requiresTooth && <span className="text-[9px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase border border-red-200 inline-flex items-center gap-1"><ScanLine size={10} /> Odontograma</span>}
                          {proc.options && proc.options.length > 0 && <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase border border-blue-200 inline-flex items-center gap-1"><Tag size={9} /> {proc.options.length} Opciones</span>}
                          {!proc.requiresTooth && (!proc.options || proc.options.length === 0) && <span className="text-[10px] font-bold text-slate-300 uppercase italic">Directo</span>}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right opacity-30 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => openModal(proc)} className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0 mr-1 border shadow-sm"><Pencil size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(proc.id, proc.name)} className="text-red-600 hover:bg-red-50 h-8 w-8 p-0 border shadow-sm"><Trash2 size={14} /></Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL CREAR / EDITAR */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white rounded-3xl border-t-8 border-red-700 p-8 outline-none">
          <DialogHeader><DialogTitle className="text-2xl font-black italic uppercase">{formData.id ? "Editar Estudio" : "Nuevo Estudio"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400">Código</Label><Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="Ej: 09.01.01" className="h-10 font-black uppercase border-2 bg-slate-50" /></div>
              <div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400">Categoría</Label><Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value.toUpperCase()})} placeholder="Opcional" className="h-10 font-bold uppercase border-2" /></div>
            </div>
            <div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400">Nombre de la Práctica</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="Ej: PERIAPICAL" className="h-12 font-bold uppercase border-2" /></div>
            
            {/* OPCIONES DINÁMICAS */}
            <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 space-y-4 mt-2">
              <h4 className="font-black text-sm uppercase text-slate-700 flex items-center gap-2"><Settings2 size={16}/> Configuración de Recepción</h4>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.requiresTooth} onChange={e => setFormData({...formData, requiresTooth: e.target.checked})} className="w-5 h-5 accent-red-700 cursor-pointer" />
                <span className="text-xs font-black uppercase text-slate-700">Lleva Odontograma (Selección de Piezas)</span>
              </label>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Opciones Múltiples (Separar con comas)</Label>
                <textarea value={formData.optionsString} onChange={e => setFormData({...formData, optionsString: e.target.value.toUpperCase()})} placeholder="Ej: RICKETTS, STEINER, BJORK" className="flex w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 resize-none h-16 shadow-inner" disabled={formData.requiresTooth}/>
                <p className="text-[9px] text-slate-400 font-bold italic leading-tight">Uso: Para Trazados (Ricketts, Steiner) o Posiciones (Frente, Perfil). Si activás Odontograma, esto se ignora.</p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={isLoading} className="w-full h-14 text-lg text-white font-black uppercase italic rounded-2xl shadow-xl mt-4 bg-red-700 hover:bg-red-800">{isLoading ? "GUARDANDO..." : "GUARDAR ✓"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}