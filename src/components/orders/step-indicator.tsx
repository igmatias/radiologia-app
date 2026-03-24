"use client"

export function Step({ num, label, active, current }: any) {
  return (
    <div className={`flex items-center gap-3 transition-all ${active ? 'opacity-100' : 'opacity-30 grayscale'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border-2 transition-all ${current ? 'bg-red-700 text-white border-red-700 shadow-lg scale-110' : active ? 'bg-white text-red-700 border-red-700' : 'bg-slate-100 text-slate-400 border-transparent'}`}>{num}</div>
      <div className="flex flex-col uppercase italic"><span className={`text-[8px] font-black tracking-widest ${current ? 'text-red-700' : 'text-slate-400'}`}>PASO {num}</span><span className={`text-base font-black ${current ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span></div>
    </div>
  )
}

export function Line({ active }: { active: boolean }) {
  return <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${active ? 'bg-red-700 shadow-sm' : 'bg-slate-200'}`} />
}
