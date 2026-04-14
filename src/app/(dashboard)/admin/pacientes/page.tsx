"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { searchOrdersGlobal } from "@/actions/search"

type Result = { id: string; patient: { dni: string; firstName: string | null; lastName: string | null } | null }

export default function PacientesPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    const res = await searchOrdersGlobal(query.trim())
    // Deduplicate by DNI
    const seen = new Set<string>()
    const unique: Result[] = []
    for (const r of (res.orders as any[])) {
      const dni = r.patient?.dni
      if (dni && !seen.has(dni)) { seen.add(dni); unique.push(r) }
    }
    setResults(unique)
    setSearched(true)
    setLoading(false)
  }

  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase text-slate-900 tracking-tight leading-none">Pacientes</h1>
            <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">Buscar por DNI, nombre o apellido</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex gap-3">
            <Input
              placeholder="DNI, nombre o apellido..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="h-11 font-bold border-2 text-slate-900"
              autoFocus
            />
            <Button onClick={handleSearch} disabled={loading}
              className="h-11 px-5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase">
              <Search size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {searched && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-400 px-1">
              {results.length} paciente{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </p>
            {results.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 py-14 text-center">
                <Users size={36} className="mx-auto text-slate-200 mb-3" />
                <p className="font-black uppercase text-slate-400 text-sm">Sin resultados</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                {results.map(r => (
                  <button
                    key={r.id}
                    onClick={() => router.push(`/admin/pacientes/${encodeURIComponent(r.patient!.dni)}`)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-black uppercase text-slate-900 text-sm">
                        {r.patient?.lastName || '—'}, {r.patient?.firstName || '—'}
                      </p>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">DNI {r.patient?.dni}</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
