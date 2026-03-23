export default function RecepcionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Sacamos cualquier grid o flex que dividía la pantalla en 2
    <div className="min-h-screen bg-slate-50/50">
      {/* El contenido principal de tu app ahora ocupa todo el ancho */}
      <main className="w-full h-full">
        {children}
      </main>
    </div>
  )
}