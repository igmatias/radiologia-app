"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getAdminDashboardData, retirarDeBoveda, getTechnicianStats } from "@/actions/admin-stats"
import { getDashboardMetrics } from "@/actions/finances" 
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TrendingUp, Activity, Calendar as CalendarIcon, Wallet,
  Banknote, Clock, MapPin, Vault, CheckCircle, Lock, Unlock,
  MinusCircle, Briefcase, Filter, Users, Landmark, Trophy, BarChart3, UserCog, Timer, Layers
} from "lucide-react"

export default function AdminClient({ branches }: { branches: any[] }) {
  // 🔥 ESCUDO ANTI-ERRORES DE HIDRATACIÓN
  const [isMounted, setIsMounted] = useState(false)

  // PESTAÑAS
  const [activeTab, setActiveTab] = useState<"TESORERIA" | "CLINICA" | "PERSONAL">("TESORERIA")

  // Filtros (Inicialmente vacíos para que el servidor no se confunda)
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [sedeFiltrada, setSedeFiltrada] = useState("ALL")
  
  // Datos y Estados
  const [data, setData] = useState<any>(null)
  const [metricsData, setMetricsData] = useState<any>(null)
  const [techStats, setTechStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [retiroModal, setRetiroModal] = useState(false)
  const [datosRetiro, setDatosRetiro] = useState({ branchId: "", amount: "", description: "" })

  // 🔥 Calculamos la fecha REAL solo en el navegador del usuario
  useEffect(() => {
    setIsMounted(true)
    const hoy = new Date();
    hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    const fechaLocal = hoy.toISOString().split('T')[0];
    
    setFechaInicio(fechaLocal)
    setFechaFin(fechaLocal)
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    const [resAdmin, resMetrics, resTech] = await Promise.all([
      getAdminDashboardData({
        fechaInicio: new Date(fechaInicio + "T00:00:00"),
        fechaFin: new Date(fechaFin + "T23:59:59"),
        branchId: sedeFiltrada
      }),
      getDashboardMetrics(fechaInicio, fechaFin, sedeFiltrada),
      getTechnicianStats({
        fechaInicio: new Date(fechaInicio + "T00:00:00"),
        fechaFin: new Date(fechaFin + "T23:59:59"),
        branchId: sedeFiltrada
      })
    ])

    if (resAdmin.success) setData(resAdmin.data)
    else toast.error("Error al cargar tesorería")

    if (resMetrics.success) setMetricsData(resMetrics.data)
    else toast.error("Error al cargar métricas clínicas")

    if (resTech.success) setTechStats(resTech.stats)

    setLoading(false)
  }

  // Se ejecuta solo si las fechas ya fueron calculadas
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      cargarDatos()
    }
  }, [fechaInicio, fechaFin, sedeFiltrada])

  const handleRetirarBoveda = async () => {
    if (!datosRetiro.branchId || !datosRetiro.amount || !datosRetiro.description) return toast.error("Completá todos los campos")
    setLoading(true)
    const res = await retirarDeBoveda(datosRetiro.branchId, parseFloat(datosRetiro.amount), datosRetiro.description)
    if (res.success) {
      toast.success("¡Retiro registrado al bolsillo con éxito! 💸")
      setRetiroModal(false)
      setDatosRetiro({ branchId: "", amount: "", description: "" })
      cargarDatos()
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  // Mientras el cliente calcula las fechas, mostramos pantalla vacía para no romper el HTML
  if (!isMounted) return null; 

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* 1. HEADER Y FILTROS GLOBALES */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <p className="text-xs font-black uppercase text-emerald-600 tracking-[0.3em] mb-1">Torre de Control</p>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
              <BarChart3 className="text-slate-900" size={32}/> Dashboard Manager
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-2 border border-slate-200">
              <span className="text-[10px] font-black uppercase text-slate-500 ml-3 mr-1"><CalendarIcon size={14}/></span>
              <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="h-12 border-none bg-white font-bold rounded-xl shadow-sm"/>
              <span className="text-xs font-bold text-slate-400">al</span>
              <Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="h-12 border-none bg-white font-bold rounded-xl shadow-sm"/>
            </div>
            
            <Select value={sedeFiltrada} onValueChange={setSedeFiltrada}>
              <SelectTrigger className="h-14 w-[200px] bg-slate-900 text-white border-none font-black uppercase text-xs rounded-2xl shadow-lg">
                {/* 🔥 SOLUCIÓN 2: Cambiamos <div> por <span> para no romper el HTML */}
                <span className="flex items-center gap-2"><Filter size={14}/> <SelectValue placeholder="Todas las sedes" /></span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-black text-xs uppercase">🌎 Todas las sedes</SelectItem>
                {branches.map(b => <SelectItem key={b.id} value={b.id} className="font-black text-xs uppercase">{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* PESTAÑAS (TABS) */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-2xl mt-8 shadow-inner border border-slate-200">
          <button onClick={() => setActiveTab("TESORERIA")} className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-[10px] sm:text-xs transition-all ${activeTab === "TESORERIA" ? 'bg-white text-slate-900 shadow-md border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
            💰 Tesorería y Cajas
          </button>
          <button onClick={() => setActiveTab("CLINICA")} className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-[10px] sm:text-xs transition-all ${activeTab === "CLINICA" ? 'bg-white text-slate-900 shadow-md border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
            🩺 Rendimiento Clínico
          </button>
          <button onClick={() => setActiveTab("PERSONAL")} className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-[10px] sm:text-xs transition-all ${activeTab === "PERSONAL" ? 'bg-white text-slate-900 shadow-md border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
            👩‍⚕️ Personal
          </button>
        </div>
      </div>

      {loading || !data || !metricsData ? (
        <div className="text-center py-20 animate-pulse font-black uppercase text-slate-400 tracking-widest flex flex-col items-center">
          <Activity size={40} className="mb-4 text-emerald-500" />
          Procesando bases de datos...
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          
          {/* =========================================================================
              PANTALLA 1: TESORERÍA Y CAJAS
              ========================================================================= */}
          {activeTab === "TESORERIA" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black uppercase italic text-slate-900 flex items-center gap-2"><Vault className="text-amber-500" size={28}/> Cajas Fuertes por Sede</h2>
                  <Button onClick={() => setRetiroModal(true)} className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black uppercase rounded-xl h-12 shadow-lg">
                    <Briefcase size={16} className="mr-2 hidden sm:block"/> Retirar al Bolsillo
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.bovedas.length === 0 ? (
                    <p className="text-xs font-bold text-slate-400 uppercase">No hay bóvedas registradas aún.</p>
                  ) : (
                    data.bovedas.map((boveda: any) => (
                      <Card key={boveda.id} className="border-none shadow-xl rounded-[2rem] bg-slate-900 text-white overflow-hidden relative">
                        <div className="absolute -right-6 -top-6 text-slate-800 opacity-50"><Vault size={120}/></div>
                        <CardContent className="p-6 relative z-10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-1.5"><MapPin size={12}/> Sede {boveda.branch.name}</p>
                          <p className="text-4xl font-black italic mt-2">${boveda.balance.toLocaleString('es-AR')}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-4 uppercase">Fondos acumulados intocables por el personal</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                  <Card className="border-none shadow-lg rounded-[2.5rem] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white h-full">
                    <CardContent className="p-8 flex flex-col justify-center h-full">
                      <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"><TrendingUp size={28} className="text-white"/></div>
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-100 mb-2">Ingresos Totales (Período)</p>
                      <h3 className="text-5xl font-black italic tracking-tighter">${data.totalFacturado.toLocaleString('es-AR')}</h3>
                      
                      <div className="mt-8 pt-6 border-t border-white/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-1">Gastos Operativos Registrados</p>
                        <p className="text-2xl font-black text-red-200">-${data.totalGastos.toLocaleString('es-AR')}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-8">
                  <Card className="border-none shadow-lg rounded-[2.5rem] bg-white h-full border border-slate-100">
                    <CardContent className="p-8">
                      <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-6">Desglose por Método de Pago</h3>
                      <div className="space-y-5">
                        {data.porcentajes.length === 0 ? (
                          <p className="text-center text-slate-400 font-bold uppercase mt-10">No hay cobros en este período</p>
                        ) : (
                          data.porcentajes.map((item: any, idx: number) => (
                            <div key={idx}>
                              <div className="flex justify-between items-end mb-2">
                                <span className="font-black uppercase text-slate-800 text-sm">{item.metodo.replace('_', ' ')}</span>
                                <div className="text-right">
                                  <span className="font-bold text-slate-500 text-xs mr-3">${item.monto.toLocaleString('es-AR')}</span>
                                  <span className="font-black text-emerald-600 text-lg">{item.porcentaje}%</span>
                                </div>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${item.metodo === 'EFECTIVO' ? 'bg-emerald-500' : item.metodo === 'MERCADOPAGO' ? 'bg-[#009EE3]' : item.metodo.includes('TARJETA') ? 'bg-blue-500' : 'bg-amber-500'}`} 
                                  style={{ width: `${item.porcentaje}%` }}
                                ></div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-lg rounded-[2.5rem] bg-white border-t-8 border-slate-900">
                  <CardContent className="p-6 md:p-8">
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-slate-900 mb-6 flex items-center gap-2"><Activity className="text-slate-900"/> Cajas de Mostrador</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {data.cajasDiarias.length === 0 ? (
                        <p className="text-xs font-bold text-slate-400 uppercase text-center py-10">No hay cajas registradas en este período</p>
                      ) : (
                        data.cajasDiarias.map((caja: any) => (
                          <div key={caja.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-black uppercase text-slate-900">{caja.branch.name}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">{new Date(caja.date).toLocaleDateString('es-AR')} • Abierta por {caja.openedBy}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${caja.status === 'ABIERTA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                {caja.status === 'ABIERTA' ? <Unlock size={10}/> : <Lock size={10}/>} {caja.status}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 mt-2">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Arrancó con</p>
                                <p className="font-bold text-slate-700">${caja.startBalance.toLocaleString('es-AR')}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{caja.status === 'ABIERTA' ? 'Dinero Esperado' : 'Cierre Declarado'}</p>
                                <p className="font-black text-lg text-slate-900">${(caja.endBalance || 0).toLocaleString('es-AR')}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg rounded-[2.5rem] bg-white border-t-8 border-red-600">
                  <CardContent className="p-6 md:p-8">
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-slate-900 mb-6 flex items-center gap-2"><MinusCircle className="text-red-600"/> Gastos y Retiros</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {data.movimientos.length === 0 ? (
                        <p className="text-xs font-bold text-slate-400 uppercase text-center py-10">No hay gastos en este período</p>
                      ) : (
                        data.movimientos.map((m: any) => (
                          <div key={m.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${m.type === 'RETIRO_DUENO' ? 'bg-slate-900 text-white' : m.type === 'A_CAJA_FUERTE' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                                {m.type === 'RETIRO_DUENO' ? <Briefcase size={16}/> : m.type === 'A_CAJA_FUERTE' ? <Vault size={16}/> : <MinusCircle size={16}/>}
                              </div>
                              <div>
                                <p className="text-xs font-black uppercase text-slate-900">{m.description}</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5 flex items-center gap-1">
                                  {new Date(m.createdAt).toLocaleDateString('es-AR')} • {m.branch.name} • <span className="text-slate-800 font-black">{m.type.replace('_', ' ')}</span>
                                </p>
                              </div>
                            </div>
                            <p className="text-base font-black text-red-600 italic">-${m.amount.toLocaleString('es-AR')}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* =========================================================================
              PANTALLA 2: RENDIMIENTO CLÍNICO
              ========================================================================= */}
          {activeTab === "CLINICA" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-lg bg-blue-600 text-white rounded-[2.5rem] border-b-8 border-blue-800 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                  <div className="absolute -right-6 -top-6 opacity-20 group-hover:scale-110 transition-transform"><Landmark size={120}/></div>
                  <CardContent className="p-8 relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-1">A Facturar O.S.</p>
                    <h3 className="text-5xl font-black italic tracking-tighter truncate">${metricsData.totalObrasSociales.toLocaleString('es-AR')}</h3>
                    <p className="text-xs font-bold text-blue-100 mt-2 opacity-80">Rendimiento en Mutuales</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-[2.5rem] border-l-8 border-slate-900 relative overflow-hidden hover:shadow-lg transition-all">
                  <CardContent className="p-8 h-full flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Pacientes Atendidos</p>
                        <h3 className="text-5xl font-black italic tracking-tighter text-slate-900">{metricsData.totalPacientes}</h3>
                      </div>
                      <div className="bg-slate-100 p-4 rounded-2xl text-slate-500"><Users size={28}/></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-[2.5rem] border-l-8 border-red-700 relative overflow-hidden hover:shadow-lg transition-all">
                  <CardContent className="p-8 h-full flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Estudios Realizados</p>
                        <h3 className="text-5xl font-black italic tracking-tighter text-slate-900">{metricsData.totalEstudios}</h3>
                      </div>
                      <div className="bg-red-50 p-4 rounded-2xl text-red-700"><Activity size={28}/></div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Distribuidos en {metricsData.totalOrdenes} órdenes creadas</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white border-t-8 border-amber-500 overflow-hidden flex flex-col p-6 md:p-8 relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                  
                  <div className="relative z-10 flex-1">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
                      <Trophy className="text-amber-500" size={32} /> Top Derivaciones
                    </h3>
                    
                    {metricsData.topDentists?.length === 0 ? (
                      <p className="text-sm font-bold text-slate-400 uppercase text-center mt-10">No hay derivaciones en este período</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {metricsData.topDentists?.map((doc: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                            <div className="flex items-center gap-4 overflow-hidden">
                              <span className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-xs font-black ${
                                idx === 0 ? 'bg-amber-500 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 
                                idx === 1 ? 'bg-slate-300 text-slate-800' : 
                                idx === 2 ? 'bg-orange-400 text-orange-950' : 
                                'bg-slate-700 text-slate-400'
                              }`}>
                                {idx + 1}
                              </span>
                              <p className="text-xs font-bold uppercase truncate pr-2">{doc.name}</p>
                            </div>
                            <span className="text-sm font-black italic bg-slate-950 px-3 py-1.5 rounded-xl text-emerald-400 shrink-0 border border-emerald-900/50">
                              {doc.count} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* =========================================================================
              PANTALLA 3: ESTADÍSTICAS DEL PERSONAL
              ========================================================================= */}
          {activeTab === "PERSONAL" && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3 mb-2">
                <UserCog className="text-slate-900" size={28}/>
                <h2 className="text-2xl font-black uppercase italic text-slate-900">Estadísticas del Personal Técnico</h2>
              </div>

              {techStats.length === 0 ? (
                <Card className="border-none shadow-lg rounded-[2.5rem] bg-white">
                  <CardContent className="p-12 text-center">
                    <UserCog size={48} className="text-slate-200 mx-auto mb-4"/>
                    <p className="font-black uppercase text-slate-400">No hay órdenes asignadas a técnicos en este período</p>
                    <p className="text-xs text-slate-400 mt-2">Asigná técnicos a las órdenes desde el panel de técnico</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {techStats.map((tech: any, idx: number) => (
                    <Card key={idx} className="border-none shadow-md rounded-[2rem] bg-white overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          {/* Nombre y sede */}
                          <div className={`p-6 md:w-64 shrink-0 flex flex-col justify-center ${idx === 0 ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg mb-3 ${idx === 0 ? 'bg-amber-500 text-amber-950' : 'bg-slate-200 text-slate-700'}`}>
                              {idx + 1}
                            </div>
                            <p className={`font-black uppercase text-lg leading-tight ${idx === 0 ? 'text-white' : 'text-slate-900'}`}>{tech.name}</p>
                            <p className={`text-xs font-bold uppercase mt-1 flex items-center gap-1 ${idx === 0 ? 'text-slate-400' : 'text-slate-500'}`}>
                              <MapPin size={10}/> {tech.branchName}
                            </p>
                          </div>

                          {/* Métricas */}
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
                            <div className="p-5 flex flex-col justify-center">
                              <div className="flex items-center gap-2 mb-1"><Layers size={14} className="text-slate-400"/><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Órdenes</span></div>
                              <p className="text-3xl font-black italic text-slate-900">{tech.totalOrdenes}</p>
                            </div>
                            <div className="p-5 flex flex-col justify-center">
                              <div className="flex items-center gap-2 mb-1"><Activity size={14} className="text-slate-400"/><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estudios</span></div>
                              <p className="text-3xl font-black italic text-slate-900">{tech.totalEstudios}</p>
                            </div>
                            <div className="p-5 flex flex-col justify-center">
                              <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-blue-400"/><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Espera hasta atención</span></div>
                              {tech.avgTiempoAtencion !== null ? (
                                <p className="text-3xl font-black italic text-blue-600">{tech.avgTiempoAtencion}<span className="text-sm font-bold ml-1">min</span></p>
                              ) : (
                                <p className="text-sm font-bold text-slate-300 uppercase">Sin dato</p>
                              )}
                            </div>
                            <div className="p-5 flex flex-col justify-center">
                              <div className="flex items-center gap-2 mb-1"><Timer size={14} className="text-emerald-400"/><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tiempo de realización</span></div>
                              {tech.avgTiempoProceso !== null ? (
                                <p className="text-3xl font-black italic text-emerald-600">{tech.avgTiempoProceso}<span className="text-sm font-bold ml-1">min</span></p>
                              ) : (
                                <p className="text-sm font-bold text-slate-300 uppercase">Sin dato</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* MODAL DE RETIRO DE BÓVEDA */}
      <Dialog open={retiroModal} onOpenChange={setRetiroModal}>
        <DialogContent className="sm:max-w-[450px] bg-white rounded-[3rem] border-none shadow-2xl p-8">
          <DialogHeader>
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4"><Briefcase size={32}/></div>
            <DialogTitle className="text-3xl font-black italic uppercase text-slate-900 leading-none">Retirar Dinero</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-6">
            <p className="text-sm font-bold text-slate-500 uppercase leading-relaxed">
              Estás por retirar plata física de una de las Cajas Fuertes.
            </p>
            
            <Select value={datosRetiro.branchId} onValueChange={v => setDatosRetiro({...datosRetiro, branchId: v})}>
              <SelectTrigger className="h-14 font-black uppercase text-sm rounded-2xl border-2">
                <span className="flex items-center"><SelectValue placeholder="¿De qué sede sacás?" /></span>
              </SelectTrigger>
              <SelectContent>
                {branches.map(b => <SelectItem key={b.id} value={b.id} className="font-black uppercase">{b.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Monto a retirar ($)</label>
              <Input type="number" placeholder="Ej: 500000" value={datosRetiro.amount} onChange={e => setDatosRetiro({...datosRetiro, amount: e.target.value})} className="h-16 rounded-2xl border-2 bg-slate-50 font-black text-3xl text-slate-900 mt-1"/>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Descripción (Obligatorio)</label>
              <Input placeholder="Ej: Retiro Juan, Pago de alquiler..." value={datosRetiro.description} onChange={e => setDatosRetiro({...datosRetiro, description: e.target.value})} className="h-14 rounded-2xl border-2 font-bold mt-1"/>
            </div>

            <Button onClick={handleRetirarBoveda} disabled={loading} className="w-full h-16 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl mt-4">
              Confirmar Retiro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}