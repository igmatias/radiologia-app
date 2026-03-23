import ResultadosClient from "./resultados-client"

export default function ResultadosPage({ params }: { params: { code: string } }) {
  // Acá es donde la magia ocurre: params.code atrapa el link largo de la URL
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <ResultadosClient accessCode={params.code} />
    </div>
  )
}