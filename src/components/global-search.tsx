"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Hash, User, FileText, ArrowRight, Clock } from "lucide-react"
import { searchOrdersGlobal } from "@/actions/search"

const STATUS_LABELS: Record<string, string> = {
  CREADA: 'Creada', EN_ESPERA: 'En espera', EN_ATENCION: 'En atención',
  PROCESANDO: 'Procesando', LISTO_PARA_ENTREGA: 'Lista', ENTREGADA: 'Entregada',
  ANULADA: 'Anulada', ENVIADA_DIGITAL: 'Digital', DEMORADA: 'Demorada',
}
const STATUS_COLORS: Record<string, string> = {
  CREADA: 'bg-blue-100 text-blue-700',
  EN_ESPERA: 'bg-yellow-100 text-yellow-700',
  EN_ATENCION: 'bg-orange-100 text-orange-700',
  PROCESANDO: 'bg-purple-100 text-purple-700',
  LISTO_PARA_ENTREGA: 'bg-green-100 text-green-700',
  ENTREGADA: 'bg-emerald-100 text-emerald-700',
  ANULADA: 'bg-red-100 text-red-600',
  ENVIADA_DIGITAL: 'bg-sky-100 text-sky-700',
  DEMORADA: 'bg-amber-100 text-amber-700',
}

type Order = {
  id: string
  code: string | null
  status: string
  createdAt: string | Date
  patient: { dni: string; firstName: string | null; lastName: string | null } | null
  items: { procedure: { name: string } | null }[]
}

export default function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const close = useCallback(() => {
    setOpen(false); setQuery(''); setResults([]); setSelected(0)
  }, [])

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setOpen(o => !o)
      }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [close])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await searchOrdersGlobal(query.trim())
      setResults((res.orders ?? []) as Order[])
      setSelected(0)
      setLoading(false)
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const navigateTo = useCallback((order: Order) => {
    close()
    if (order.patient?.dni) {
      router.push(`/admin/pacientes/${encodeURIComponent(order.patient.dni)}`)
    }
  }, [close, router])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) navigateTo(results[selected])
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 px-2.5 sm:px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
      title="Búsqueda global (Ctrl+K)"
    >
      <Search size={14} />
      <span className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
        Buscar
        <kbd className="bg-neutral-700 text-neutral-400 text-[9px] px-1.5 py-0.5 rounded font-mono">Ctrl K</kbd>
      </span>
    </button>
  )

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={close} />

      {/* Modal */}
      <div className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">

          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por DNI, nombre, código de orden..."
              className="flex-1 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none"
            />
            {loading && <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin shrink-0" />}
            <button onClick={close} className="text-slate-400 hover:text-slate-600 shrink-0"><X size={16} /></button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {results.map((order, i) => (
                <button
                  key={order.id}
                  onClick={() => navigateTo(order)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${i === selected ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <User size={14} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900 uppercase truncate">
                        {order.patient?.lastName}, {order.patient?.firstName}
                      </span>
                      <span className="text-xs font-bold text-slate-400">DNI {order.patient?.dni}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {order.code && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                          <Hash size={9} /> {order.code}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock size={9} /> {new Date(order.createdAt).toLocaleDateString('es-AR')}
                      </span>
                      {order.items.slice(0, 2).map((item, j) => (
                        <span key={j} className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">
                          {item.procedure?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full shrink-0 ${STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <ArrowRight size={14} className="text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <FileText size={28} className="mx-auto text-slate-200 mb-2" />
              <p className="text-sm font-bold text-slate-400">Sin resultados para "{query}"</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 bg-slate-50">
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><kbd className="bg-white border border-slate-200 px-1 rounded text-[9px] font-mono">↑↓</kbd> navegar</span>
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><kbd className="bg-white border border-slate-200 px-1 rounded text-[9px] font-mono">↵</kbd> abrir</span>
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><kbd className="bg-white border border-slate-200 px-1 rounded text-[9px] font-mono">Esc</kbd> cerrar</span>
          </div>
        </div>
      </div>
    </>
  )
}
