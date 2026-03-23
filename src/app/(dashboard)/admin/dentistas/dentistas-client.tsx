"use client"
import { useState, useMemo } from "react"
import { Button as UIButton } from "@/components/ui/button" 
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Papa from "papaparse"
import { importDentistsAction, deleteDentist, cleanDuplicateDentists, updateDentistAction } from "@/actions/dentists"
import { Upload, Trash2, UserPlus, Search, Loader2, Sparkles, Edit } from "lucide-react"
import QuickDentistForm from "@/components/admin/dentist-form"

export default function DentistasClient({ initialDentists = [] }: any) {
  const [dentists, setDentists] = useState(initialDentists)
  const [filter, setFilter] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  
  // Estado para controlar qué dentista estamos editando
  const [editingDentist, setEditingDentist] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const filtered = useMemo(() => {
    const search = filter.toLowerCase().trim()
    if (!search) return dentists

    return dentists.filter((d: any) => {
      const ln = (d.lastName || "").toLowerCase()
      const fn = (d.firstName || "").toLowerCase()
      const mat = (d.matriculaProv || "").toString().toLowerCase()
      const fullName = `${ln} ${fn}`

      return ln.includes(search) || fn.includes(search) || fullName.includes(search) || mat.includes(search)
    })
  }, [filter, dentists])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const res = await importDentistsAction(results.data)
        if (res.success) {
          toast.success("Importación exitosa")
          window.location.reload()
        } else {
          toast.error(res.error)
          setIsUploading(false)
        }
      }
    })
  }

  const handleClean = async () => {
    if(!confirm("¿Limpiar duplicados?")) return
    setIsCleaning(true)
    const res = await cleanDuplicateDentists()
    if (res.success) {
      toast.success("Base de datos limpia")
      window.location.reload()
    }
    setIsCleaning(false)
  }

  const handleDelete = async (id: string) => {
    if(!confirm("¿Eliminar odontólogo?")) return
    await deleteDentist(id)
    setDentists(dentists.filter((d: any) => d.id !== id))
    toast.success("Eliminado")
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const res = await updateDentistAction(editingDentist.id, editingDentist)
    if (res.success) {
      toast.success("Datos actualizados")
      // Actualizamos el estado local para no tener que recargar la página
      setDentists(dentists.map((d: any) => d.id === editingDentist.id ? editingDentist : d))
      setEditingDentist(null)
    } else {
      toast.error("Error al actualizar")
    }
    setIsSaving(false)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter flex items-center gap-3">
          <UserPlus className="text-red-700" size={32} /> Gestión de Odontólogos
        </h1>
        <div className="flex gap-3">
          <UIButton variant="outline" onClick={handleClean} disabled={isCleaning} className="border-2 border-amber-500 text-amber-600 font-black italic uppercase text-xs rounded-xl">
             {isCleaning ? <Loader2 className="animate-spin mr-2" size={14} /> : <Sparkles className="mr-2" size={14} />} Limpiar Duplicados
          </UIButton>
          <label className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-2 hover:bg-slate-800 transition-all text-sm">
            <Upload size={18} /> IMPORTAR CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
          <Dialog>
            <DialogTrigger asChild>
              <UIButton className="bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow-lg transition-all text-sm">
                <UserPlus size={18} className="mr-2"/> NUEVO PROFESIONAL
              </UIButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white rounded-3xl border-t-8 border-red-700 p-0 overflow-hidden">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-xl font-black italic uppercase text-center">Nuevo Odontólogo</DialogTitle>
              </DialogHeader>
              <QuickDentistForm onSuccess={() => window.location.reload()} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Escribe para buscar (Apellido, Nombre o Matrícula)..." 
              className="pl-10 h-12 bg-white border-2 rounded-2xl focus:ring-red-700 font-bold" 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100 uppercase font-black italic">
              <TableRow>
                <TableHead className="px-6 py-4">Profesional</TableHead>
                <TableHead>Matrículas</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead className="text-right px-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((d: any) => (
                  <TableRow key={d.id} className="hover:bg-red-50/50 transition-colors">
                    <TableCell className="font-bold uppercase text-sm px-6 py-4">{d.lastName}, {d.firstName}</TableCell>
                    <TableCell className="text-xs font-mono">{d.matriculaProv || '-'} / {d.matriculaNac || '-'}</TableCell>
                    <TableCell className="text-xs text-slate-600 font-medium">{d.email || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-red-100 text-red-700 rounded-md italic">
                          {d.resultPreference || 'AMBAS'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">
                          Vía: {d.deliveryMethod || 'E-MAIL'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <UIButton variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600" onClick={() => setEditingDentist(d)}>
                        <Edit size={18} />
                      </UIButton>
                      <UIButton variant="ghost" size="icon" className="text-slate-400 hover:text-red-700" onClick={() => handleDelete(d.id)}>
                        <Trash2 size={18} />
                      </UIButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-bold italic uppercase">No se encontraron resultados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL DE EDICIÓN */}
      <Dialog open={!!editingDentist} onOpenChange={(open) => !open && setEditingDentist(null)}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-3xl border-t-8 border-blue-600">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic uppercase text-center text-slate-900">
              Editar Profesional
            </DialogTitle>
          </DialogHeader>
          {editingDentist && (
            <form onSubmit={handleUpdate} className="space-y-4 p-4 font-black uppercase italic">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] text-slate-400">Apellido</Label>
                  <Input 
                    value={editingDentist.lastName || ''} 
                    onChange={e => setEditingDentist({...editingDentist, lastName: e.target.value})}
                    className="h-12 border-2 uppercase font-bold" required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-slate-400">Nombre</Label>
                  <Input 
                    value={editingDentist.firstName || ''} 
                    onChange={e => setEditingDentist({...editingDentist, firstName: e.target.value})}
                    className="h-12 border-2 uppercase font-bold" required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] text-slate-400">Matrícula Prov.</Label>
                  <Input 
                    value={editingDentist.matriculaProv || ''} 
                    onChange={e => setEditingDentist({...editingDentist, matriculaProv: e.target.value})}
                    className="h-12 border-2 font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-slate-400">E-Mail</Label>
                  <Input 
                    type="email" 
                    value={editingDentist.email || ''} 
                    onChange={e => setEditingDentist({...editingDentist, email: e.target.value})}
                    className="h-12 border-2 font-bold" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] text-slate-400">Preferencia</Label>
                  <Select value={editingDentist.resultPreference || 'Ambas'} onValueChange={v => setEditingDentist({...editingDentist, resultPreference: v})}>
                    <SelectTrigger className="h-12 border-2 font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="font-bold uppercase italic">
                      <SelectItem value="Digital">DIGITAL</SelectItem>
                      <SelectItem value="Impresa">IMPRESA</SelectItem>
                      <SelectItem value="Ambas">AMBAS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-slate-400">Medio Envío</Label>
                  <Select value={editingDentist.deliveryMethod || 'E-Mail'} onValueChange={v => setEditingDentist({...editingDentist, deliveryMethod: v})}>
                    <SelectTrigger className="h-12 border-2 font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="font-bold uppercase italic">
                      <SelectItem value="E-Mail">E-MAIL</SelectItem>
                      <SelectItem value="WhatsApp">WHATSAPP</SelectItem>
                      <SelectItem value="Paciente">PACIENTE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <UIButton type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-white text-lg rounded-2xl shadow-xl transition-all mt-4">
                {isSaving ? "GUARDANDO..." : "GUARDAR CAMBIOS ✓"}
              </UIButton>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}