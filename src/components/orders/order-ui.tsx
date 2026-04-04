"use client"

import { Card, CardContent } from "@/components/ui/card"

export function Step({ num, label, active, current }: any) {
  return (
    <div className={`flex items-center gap-3 transition-all ${active ? 'opacity-100' : 'opacity-30 grayscale'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border-2 transition-all ${current ? 'bg-brand-700 text-white border-brand-700 shadow-lg scale-110' : active ? 'bg-white text-brand-700 border-brand-700' : 'bg-slate-100 text-slate-400 border-transparent'}`}>{num}</div>
      <div className="flex flex-col uppercase italic"><span className={`text-[8px] font-black tracking-widest ${current ? 'text-brand-700' : 'text-slate-400'}`}>PASO {num}</span><span className={`text-base font-black ${current ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span></div>
    </div>
  )
}

export function Line({ active }: { active: boolean }) { return <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${active ? 'bg-brand-700 shadow-sm' : 'bg-slate-200'}`} /> }

// ─── Lógica de placas periapicales ──────────────────────────────────────────
// Orden de los dientes en el arco (de derecha a izquierda, siguiendo la clínica)
const UPPER_ORDER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_ORDER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

// Dientes anteriores: hasta 4 caben en la misma placa
const ANTERIOR_TEETH = new Set([11, 12, 21, 22, 41, 42, 31, 32])

/**
 * Calcula la cantidad mínima de placas necesarias para cubrir
 * los dientes seleccionados. Lógica:
 * - Posteriores: hasta 2 dientes adyacentes por placa
 * - Anteriores (11,12,21,22 / 41,42,31,32): hasta 4 adyacentes por placa
 */
export function countPeriapicalFilms(selectedTeeth: number[]): number {
  if (selectedTeeth.length === 0) return 1
  const selected = new Set(selectedTeeth)
  let films = 0

  for (const archOrder of [UPPER_ORDER, LOWER_ORDER]) {
    const archSelected = archOrder.filter(t => selected.has(t))
    let i = 0
    while (i < archSelected.length) {
      films++
      const isAnterior = ANTERIOR_TEETH.has(archSelected[i])
      const maxOnFilm = isAnterior ? 4 : 2
      let covered = 1
      while (covered < maxOnFilm && i + covered < archSelected.length) {
        const currPos = archOrder.indexOf(archSelected[i + covered - 1])
        const nextPos = archOrder.indexOf(archSelected[i + covered])
        if (nextPos === currPos + 1) {
          covered++
        } else {
          break
        }
      }
      i += covered
    }
  }

  return films
}

export function isPeriapicalLike(name?: string): boolean {
  if (!name) return false
  const n = name.toLowerCase()
  return n.includes('periapical')
}

export function isBitewingLike(name?: string): boolean {
  if (!name) return false
  const n = name.toLowerCase()
  return n.includes('bite wing') || n.includes('bite-wing') || n.includes('bitewing')
}

/**
 * Normaliza un diente al arco superior (canónico).
 * Bite-wing: upper + lower opuestos comparten el mismo film,
 * por lo que 37 → 27, 31 → 21, 41 → 11, etc.
 */
export function getCanonicalTooth(tooth: number): number {
  if (tooth >= 31 && tooth <= 38) return tooth - 10  // inf-izq → sup-izq  (31→21 … 38→28)
  if (tooth >= 41 && tooth <= 48) return tooth - 30  // inf-der → sup-der  (41→11 … 48→18)
  return tooth
}

/** Devuelve el diente opuesto en el otro arco (para bite-wing). */
export function getOppositeTooth(tooth: number): number {
  if (tooth >= 11 && tooth <= 18) return tooth + 30  // sup-der → inf-der  (11→41 … 18→48)
  if (tooth >= 21 && tooth <= 28) return tooth + 10  // sup-izq → inf-izq  (21→31 … 28→38)
  if (tooth >= 31 && tooth <= 38) return tooth - 10  // inf-izq → sup-izq  (31→21 … 38→28)
  if (tooth >= 41 && tooth <= 48) return tooth - 30  // inf-der → sup-der  (41→11 … 48→18)
  return tooth
}

/**
 * Cuenta placas bite-wing: primero colapsa cada par diente/opuesto
 * en un único canónico y luego aplica el mismo algoritmo greedy
 * de periapicales sobre los canónicos únicos.
 */
export function countBitewingFilms(selectedTeeth: number[]): number {
  if (selectedTeeth.length === 0) return 1
  const canonical = [...new Set(selectedTeeth.map(getCanonicalTooth))]
  return countPeriapicalFilms(canonical)
}

// ────────────────────────────────────────────────────────────────────────────

export function ToothBtn({ t, itemIndex, form, recalculate, procedureName }: any) {
  const selected = form.watch(`items.${itemIndex}.teeth`) || [];
  const isSelected = selected.includes(t);
  const isPeri = isPeriapicalLike(procedureName)
  const isBW   = isBitewingLike(procedureName)
  // Bite-wing: el diente opuesto está seleccionado → este está "cubierto" en el mismo film
  const isPaired = isBW && !isSelected && selected.includes(getOppositeTooth(t))

  const cls = isSelected
    ? "bg-brand-600 text-white border-brand-500 scale-110"
    : isPaired
    ? "bg-amber-900/70 text-amber-300 border-amber-600/70 scale-105"
    : "bg-slate-800 text-slate-300 border-slate-700"

  return (
    <button type="button" title={isPaired ? `Cubierto con ${getOppositeTooth(t)}` : undefined}
      onClick={() => {
        const next = isSelected ? selected.filter((tooth: number) => tooth !== t) : [...selected, t];
        const count = isPeri ? countPeriapicalFilms(next)
                    : isBW  ? countBitewingFilms(next)
                    : (next.length || 1)
        const baseIns = form.getValues(`items.${itemIndex}.baseInsurance`);
        const basePat = form.getValues(`items.${itemIndex}.basePatient`);
        form.setValue(`items.${itemIndex}.teeth`, next);
        form.setValue(`items.${itemIndex}.insuranceCoverage`, baseIns * count);
        form.setValue(`items.${itemIndex}.patientCopay`, basePat * count);
        recalculate();
      }} className={`h-12 w-10 text-sm font-black rounded-lg border-2 transition-all shadow-sm ${cls}`}>{t}</button>
  );
}

export function StatCard({ title, value }: any) {
  return (
    <Card className="border-none shadow-md bg-white/60 backdrop-blur-md rounded-2xl h-full">
      <CardContent className="p-6"><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic">{title}</p><p className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase truncate">{value}</p></CardContent>
    </Card>
  )
}
