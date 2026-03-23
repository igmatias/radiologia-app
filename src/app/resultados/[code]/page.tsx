import ResultadosClient from "./resultados-client"

export default function ResultadosPage({ params }: { params: { code: string } }) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      {/* Acá estaba el error, ahora llamamos al componente limpio */}
      <ResultadosClient />
    </div>
  )
}