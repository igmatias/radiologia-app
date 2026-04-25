import { getCurrentSession } from "@/actions/auth"
import { redirect } from "next/navigation"
import ImportClient from "./import-client"
import { WifiOff, Download } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ImportarOfflinePage() {
  const session = await getCurrentSession()
  if (!session) redirect('/login')
  if (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN') redirect('/recepcion')

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black italic text-slate-800 tracking-tighter flex items-center gap-3">
            <WifiOff className="text-amber-500" size={32} /> MODO EMERGENCIA
          </h1>
          <p className="text-slate-500 text-sm mt-1">Descargá el archivo offline o importá una sesión trabajada sin conexión</p>
        </div>
        <a
          href="/api/offline-bundle"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-black uppercase text-sm px-6 py-3 rounded-xl transition-all shadow-md"
        >
          <Download size={16} /> Descargar EMERGENCIA.html
        </a>
      </div>

      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
        <p className="text-sm font-bold text-amber-800">
          <strong>¿Cómo funciona?</strong><br />
          1. Descargá el archivo <code className="bg-amber-100 px-1 rounded">EMERGENCIA.html</code> y guardalo en el escritorio.<br />
          2. Si se corta internet, abrí ese archivo desde el navegador y trabajá normalmente.<br />
          3. Cuando vuelva internet, exportá el archivo <code className="bg-amber-100 px-1 rounded">.json</code> desde el modo emergencia y subilo acá.<br />
          4. <strong>Actualizá el archivo offline regularmente</strong> (cada semana o cuando hay pacientes nuevos).
        </p>
      </div>

      <div>
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-700 mb-4">Importar sesión offline</h2>
        <ImportClient />
      </div>
    </div>
  )
}
