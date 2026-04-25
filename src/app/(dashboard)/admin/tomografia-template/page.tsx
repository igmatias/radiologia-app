"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getAllTemplates, saveTemplate, setActiveTemplate, deleteTemplate } from "@/actions/report-templates"
import { UploadCloud, CheckCircle2, Trash2, ScanLine, Star, Loader2, Eye } from "lucide-react"

export default function TomografiaTemplatePage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    marginTop: '113',
    marginLeft: '95',
    marginRight: '95',
    marginBottom: '113',
    file: null as File | null,
    preview: '',
  })

  const load = async () => {
    const t = await getAllTemplates()
    setTemplates(t)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const reset = () => {
    setForm({ name: '', marginTop: '113', marginLeft: '95', marginRight: '95', marginBottom: '113', file: null, preview: '' })
    setEditingId(null)
  }

  const handleEdit = (t: any) => {
    setEditingId(t.id)
    setForm({
      name: t.name,
      marginTop: String(t.marginTop),
      marginLeft: String(t.marginLeft),
      marginRight: String(t.marginRight),
      marginBottom: String(t.marginBottom),
      file: null,
      preview: t.backgroundImageUrl || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error("Ingresá un nombre para el template")
    setSaving(true)
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('marginTop', form.marginTop)
    fd.append('marginLeft', form.marginLeft)
    fd.append('marginRight', form.marginRight)
    fd.append('marginBottom', form.marginBottom)
    if (form.file) fd.append('file', form.file)
    if (editingId) fd.append('templateId', editingId)
    const res = await saveTemplate(fd)
    if (res.success) {
      toast.success(editingId ? 'Template actualizado ✓' : 'Template creado ✓')
      reset()
      await load()
    } else {
      toast.error(res.error)
    }
    setSaving(false)
  }

  const handleActivate = async (id: string) => {
    const res = await setActiveTemplate(id)
    if (res.success) { toast.success('Template activado ✓'); await load() }
    else toast.error(res.error)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este template?')) return
    const res = await deleteTemplate(id)
    if (res.success) { toast.success('Eliminado'); await load() }
    else toast.error(res.error)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="bg-brand-600 p-2 rounded-xl"><ScanLine size={20} className="text-white" /></div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Template de Informes TC3D</h1>
          <p className="text-sm text-slate-500">Gestión del template de fondo para generar PDFs de informes</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="font-black text-base uppercase text-slate-700">{editingId ? 'Editar Template' : 'Nuevo Template'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-xs font-black uppercase text-slate-500">Nombre del Template</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Template Principal 2025" className="mt-1 h-11 rounded-2xl border-2" />
            </div>
          </div>

          {/* Image upload */}
          <div>
            <Label className="text-xs font-black uppercase text-slate-500 mb-2 block">
              Imagen de Fondo A4 (JPG/PNG — tamaño A4: 794×1123 px aprox.)
            </Label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-brand-400 rounded-2xl p-6 cursor-pointer transition-colors group">
              {form.preview ? (
                <img src={form.preview} alt="preview" className="max-h-48 object-contain rounded-xl mb-2" />
              ) : (
                <UploadCloud size={32} className="text-slate-300 group-hover:text-brand-400 mb-2 transition-colors" />
              )}
              <span className="text-xs font-bold text-slate-500">
                {form.preview ? 'Cambiar imagen' : 'Clic para subir imagen de fondo A4'}
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setForm(prev => ({ ...prev, file: f, preview: URL.createObjectURL(f) }))
                }} />
            </label>
          </div>

          {/* Margins */}
          <div>
            <Label className="text-xs font-black uppercase text-slate-500 mb-2 block">
              Márgenes del área de texto (en píxeles · 1cm ≈ 38px)
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['marginTop', 'marginLeft', 'marginRight', 'marginBottom'] as const).map(key => (
                <div key={key}>
                  <Label className="text-xs text-slate-400 capitalize">{key.replace('margin', '').toLowerCase()}</Label>
                  <Input type="number" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="mt-1 h-10 rounded-xl border-2 text-center font-mono" />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Estos márgenes definen desde dónde empieza el texto del informe sobre la imagen de fondo.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving} className="rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black h-11 px-6">
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {editingId ? 'Actualizar Template' : 'Crear Template'}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={reset} className="rounded-2xl h-11">Cancelar</Button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="space-y-3">
        <h2 className="font-black text-base uppercase text-slate-700">Templates guardados</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 py-8 justify-center">
            <Loader2 size={20} className="animate-spin" /> Cargando...
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
            Sin templates creados aún
          </div>
        ) : (
          templates.map(t => (
            <div key={t.id} className={`bg-white rounded-2xl border-2 p-5 flex items-center gap-4 ${t.isActive ? 'border-brand-300 bg-brand-50/30' : 'border-slate-200'}`}>
              {t.backgroundImageUrl ? (
                <img src={t.backgroundImageUrl} alt="" className="w-16 h-20 object-cover rounded-xl border border-slate-200 shrink-0" />
              ) : (
                <div className="w-16 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center shrink-0">
                  <ScanLine size={20} className="text-slate-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-black text-slate-800">{t.name}</p>
                  {t.isActive && <span className="text-[10px] bg-brand-600 text-white px-2 py-0.5 rounded-full font-black uppercase">Activo</span>}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Márgenes: top {t.marginTop}px · left {t.marginLeft}px · right {t.marginRight}px · bottom {t.marginBottom}px
                </p>
                <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString('es-AR')}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {t.backgroundImageUrl && (
                  <a href={t.backgroundImageUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs w-full"><Eye size={12} className="mr-1" /> Ver</Button>
                  </a>
                )}
                {!t.isActive && (
                  <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs border-brand-300 text-brand-700 hover:bg-brand-50"
                    onClick={() => handleActivate(t.id)}>
                    <Star size={12} className="mr-1" /> Activar
                  </Button>
                )}
                <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs" onClick={() => handleEdit(t)}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" className="rounded-xl h-8 text-xs text-red-500 hover:bg-red-50"
                  onClick={() => handleDelete(t.id)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
