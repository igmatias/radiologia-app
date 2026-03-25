"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { importDentists } from "@/actions/admin"
import { toast } from "sonner"
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react"

export function DentistImport() {
  const [loading, setLoading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar que sea CSV
    if (!file.name.endsWith('.csv')) {
      toast.error("Por favor, selecciona un archivo .CSV")
      return
    }

    setLoading(true)
    const reader = new FileReader()
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split("\n")
        // Limpiamos cabeceras de comillas y espacios
        const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ''))
        
        const data = lines.slice(1)
          .filter(line => line.trim() !== "")
          .map(line => {
            const values = line.split(",").map(v => v.trim().replace(/"/g, ''))
            return headers.reduce((obj: any, header, i) => {
              obj[header] = values[i]
              return obj
            }, {})
          })

        const res = await importDentists(data)
        if (res.success) {
          toast.success(`Proceso finalizado: Base de datos actualizada.`)
          window.location.reload() // Recargamos para ver los cambios
        } else {
          toast.error("Error al procesar el archivo en el servidor")
        }
      } catch (err) {
        toast.error("Error de formato en el CSV")
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col md:flex-row items-center gap-6 shadow-sm">
      <div className="bg-green-50 p-4 rounded-full">
        <FileSpreadsheet className="h-8 w-8 text-green-600" />
      </div>
      <div className="flex-1 text-center md:text-left">
        <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">Importar Odontólogos</h3>
        <p className="text-sm text-slate-500 max-w-md">
          El archivo debe tener las columnas: <span className="font-mono text-brand-600 text-[11px]">Apellido, Nombre, Matricula Provincial, Matricula Nacional, E-Mail...</span>
        </p>
      </div>
      <div className="relative group">
        <Input 
          type="file" 
          accept=".csv" 
          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
          onChange={handleFileUpload}
          disabled={loading}
        />
        <Button disabled={loading} className="bg-slate-900 text-white hover:bg-black px-8 font-bold uppercase italic">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4 mr-2" /> Subir CSV</>}
        </Button>
      </div>
    </div>
  )
}