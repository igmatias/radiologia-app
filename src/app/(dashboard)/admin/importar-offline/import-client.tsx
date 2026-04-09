"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { importOfflineSession } from "@/actions/offline"
import { Upload, FileJson, CheckCircle, AlertTriangle, Download } from "lucide-react"

export default function ImportClient() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        setPreview(data)
      } catch {
        toast.error("Archivo inválido — no es un JSON válido")
        setFile(null)
      }
    }
    reader.readAsText(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.json')) handleFile(f)
    else toast.error("Soltá un archivo .json")
  }

  const handleImport = async () => {
    if (!preview) return
    setLoading(true)
    const res = await importOfflineSession(preview)
    setLoading(false)
    if (res.success) {
      setResult(res)
      toast.success(`Importación completada: ${res.ordersCreated} órdenes`)
    } else {
      toast.error(res.error || "Error al importar")
    }
  }

  return (
    <div className="space-y-6">

      {/* Drop zone */}
      {!preview && (
        <Card className="border-none shadow-md rounded-2xl">
          <CardContent className="p-0">
            <div
              className="border-4 border-dashed border-slate-200 rounded-2xl p-16 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-black uppercase text-slate-500 tracking-tight">Arrastrar o hacer click</p>
              <p className="text-sm text-slate-400 mt-2">Subí el archivo <strong>.json</strong> exportado desde el modo emergencia</p>
              <input
                ref={inputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {preview && !result && (
        <Card className="border-none shadow-md rounded-2xl border-t-4 border-amber-400">
          <CardHeader className="bg-amber-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-800 flex items-center gap-2">
              <FileJson size={16} /> Vista previa del archivo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Sede", value: preview.branchName || preview.branchId || "Sin especificar" },
                { label: "Órdenes", value: preview.orders?.length ?? 0 },
                { label: "Mov. de caja", value: preview.cajaMovimientos?.length ?? 0 },
                { label: "Generado", value: preview.dataGeneratedAt ? new Date(preview.dataGeneratedAt).toLocaleString('es-AR') : "?" },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                  <div className="text-2xl font-black text-slate-800">{s.value}</div>
                  <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Preview de órdenes */}
            {preview.orders?.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Órdenes a importar</p>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {preview.orders.map((o: any, i: number) => (
                    <div key={i} className="flex justify-between items-center px-4 py-2.5">
                      <div>
                        <p className="text-sm font-black uppercase text-slate-800">{o.patientLastName}, {o.patientFirstName}</p>
                        <p className="text-xs text-slate-500">DNI: {o.patientDni} · {o.obraSocialName || 'Particular'} · {o.items?.length} práctica/s</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">${Number(o.patientAmount || 0).toLocaleString('es-AR')}</p>
                        <p className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleImport}
                disabled={loading}
                className="flex-1 h-14 bg-brand-700 hover:bg-brand-800 text-white font-black uppercase text-sm rounded-xl"
              >
                {loading ? "Importando..." : `Importar ${preview.orders?.length || 0} órdenes`}
              </Button>
              <Button
                variant="outline"
                className="h-14 px-6 border-2 font-black uppercase text-sm rounded-xl"
                onClick={() => { setPreview(null); setFile(null) }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {result && (
        <Card className="border-none shadow-md rounded-2xl border-t-4 border-emerald-500">
          <CardHeader className="bg-emerald-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-800 flex items-center gap-2">
              <CheckCircle size={16} /> Importación completada
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Órdenes creadas", value: result.ordersCreated, color: "text-brand-700" },
                { label: "Pacientes nuevos", value: result.patientsCreated, color: "text-violet-700" },
                { label: "Mov. de caja", value: result.cajaCreated, color: "text-emerald-700" },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                  <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {result.log?.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Log</p>
                <div className="max-h-48 overflow-y-auto bg-slate-900 rounded-xl p-4 space-y-1">
                  {result.log.map((l: string, i: number) => (
                    <p key={i} className="text-xs font-mono text-emerald-400">{l}</p>
                  ))}
                </div>
              </div>
            )}

            {result.errors?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
                <p className="text-[10px] font-black uppercase text-red-700 tracking-widest mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Errores ({result.errors.length})
                </p>
                {result.errors.map((e: string, i: number) => (
                  <p key={i} className="text-xs text-red-600">{e}</p>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full border-2 font-black uppercase rounded-xl h-12"
              onClick={() => { setPreview(null); setFile(null); setResult(null) }}
            >
              Importar otro archivo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
