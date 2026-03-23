import { prisma } from "@/lib/prisma"
import { DentistImport } from "@/components/admin/dentist-import"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Stethoscope, Mail, Phone, Hash } from "lucide-react"

export default async function AdminDentistsPage() {
  const dentists = await prisma.dentist.findMany({
    orderBy: { lastName: 'asc' }
  })

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black italic text-slate-900 tracking-tighter uppercase">Profesionales</h1>
          <p className="text-slate-500 font-medium">Gestión y base de datos de odontólogos derivantes.</p>
        </div>
      </div>

      {/* SECCIÓN DE IMPORTACIÓN */}
      <DentistImport />

      {/* LISTADO DE ODONTÓLOGOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dentists.map((d) => (
          <Card key={d.id} className="hover:shadow-md transition-shadow border-slate-100">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-red-50 p-2 rounded-lg">
                  <Stethoscope className="h-5 w-5 text-red-700" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-700 rounded uppercase">
                    {d.resultPreference || 'Sin pref.'}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase mt-1">
                    {d.deliveryMethod || 'Mail'}
                  </span>
                </div>
              </div>
              
              <h3 className="font-bold text-slate-800 uppercase">{d.lastName}, {d.firstName}</h3>
              
              <div className="mt-4 space-y-1.5 border-t pt-4">
                <div className="flex items-center text-xs text-slate-500 gap-2">
                  <Hash className="h-3 w-3" />
                  <span>MP: {d.matriculaProv || 'N/A'} | MN: {d.matriculaNac || 'N/A'}</span>
                </div>
                <div className="flex items-center text-xs text-slate-500 gap-2">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{d.email || 'Sin correo'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dentists.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed">
          <p className="text-slate-400 italic">No hay odontólogos cargados. Importa tu primer CSV arriba.</p>
        </div>
      )}
    </div>
  )
}