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

export function ToothBtn({ t, itemIndex, form, recalculate }: any) {
  const selected = form.watch(`items.${itemIndex}.teeth`) || [];
  const isSelected = selected.includes(t);
  return (
    <button type="button" onClick={() => {
        const next = isSelected ? selected.filter((tooth: number) => tooth !== t) : [...selected, t];
        const count = next.length || 1;
        const baseIns = form.getValues(`items.${itemIndex}.baseInsurance`);
        const basePat = form.getValues(`items.${itemIndex}.basePatient`);
        form.setValue(`items.${itemIndex}.teeth`, next);
        form.setValue(`items.${itemIndex}.insuranceCoverage`, baseIns * count);
        form.setValue(`items.${itemIndex}.patientCopay`, basePat * count);
        recalculate();
      }} className={`h-12 w-10 text-sm font-black rounded-lg border-2 transition-all shadow-sm ${isSelected ? "bg-brand-600 text-white border-brand-500 scale-110" : "bg-slate-800 text-slate-300 border-slate-700"}`}>{t}</button>
  );
}

export function StatCard({ title, value }: any) {
  return (
    <Card className="border-none shadow-md bg-white/60 backdrop-blur-md rounded-2xl h-full">
      <CardContent className="p-6"><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic">{title}</p><p className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase truncate">{value}</p></CardContent>
    </Card>
  )
}
