import ResultadosClient from "./resultados-client"
import { isPatientPortalEnabled } from "@/actions/settings"

export default async function ResultadosPage({ params }: { params: { code: string } }) {
  const enabled = await isPatientPortalEnabled()
  if (!enabled) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔧</div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight mb-2">Portal temporalmente no disponible</h1>
          <p className="text-slate-400 text-sm">Estamos realizando tareas de mantenimiento. Por favor intentá más tarde o comunicate con el centro.</p>
          <p className="text-brand-400 font-bold text-sm mt-4">0810 333 4507</p>
        </div>
      </div>
    )
  }
  return <ResultadosClient />
}
