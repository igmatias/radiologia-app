"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { upsertBranch, upsertEquipment, deleteEquipment } from "@/actions/branches"
import { 
  Building2, MapPin, Phone, MonitorSmartphone, 
  Activity, Trash2, Plus, Copy, Save, Network, Globe
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function SedesClient({ initialBranches }: { initialBranches: any[] }) {
  const [branches, setBranches] = useState(initialBranches)
  const [selectedBranch, setSelectedBranch] = useState<any>(initialBranches[0] || null)
  const [isBranchLoading, setIsBranchLoading] = useState(false)
  const [isEqLoading, setIsEqLoading] = useState(false)

  // Estados para modal de Equipos / PCs
  const [isEqModalOpen, setIsEqModalOpen] = useState(false)
  // Agregamos ipAddress al estado inicial
  const [eqData, setEqData] = useState({ id: "", name: "", type: "RAYOS", room: "", anydeskId: "", ipAddress: "", tailscaleIp: "" })

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsBranchLoading(true)
    const formData = new FormData(e.target as HTMLFormElement)
    const data = {
      id: selectedBranch?.id,
      name: formData.get("name"),
      code: formData.get("code"),
      address: formData.get("address"),
      phone: formData.get("phone")
    }

    const res = await upsertBranch(data)
    if (res.success) {
      toast.success("Sede guardada correctamente")
      window.location.reload()
    } else {
      toast.error(res.error)
    }
    setIsBranchLoading(false)
  }

  const handleNewBranch = () => {
    setSelectedBranch({ id: "", name: "", code: "", address: "", phone: "", equipments: [] })
  }

  const openEqModal = (type: string, eq: any = null) => {
    if (eq) {
      setEqData({ ...eq, ipAddress: eq.ipAddress || "", tailscaleIp: eq.tailscaleIp || "" })
    } else {
      setEqData({ id: "", name: "", type, room: "", anydeskId: "", ipAddress: "", tailscaleIp: "" })
    }
    setIsEqModalOpen(true)
  }

  const handleSaveEquipment = async () => {
    if (!eqData.name || !eqData.room) return toast.error("El nombre y la sala son obligatorios")
    setIsEqLoading(true)

    const res = await upsertEquipment({ ...eqData, branchId: selectedBranch.id })
    if (res.success) {
      toast.success(eqData.type === 'PC' ? "Computadora guardada" : "Equipo guardado")
      setIsEqModalOpen(false)
      window.location.reload()
    } else {
      toast.error(res.error)
    }
    setIsEqLoading(false)
  }

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm("¿Eliminar este registro permanentemente?")) return
    const res = await deleteEquipment(id)
    if (res.success) {
      toast.success("Eliminado")
      window.location.reload()
    } else {
      toast.error(res.error)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado ✓`, { icon: "📋" });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* PANEL IZQUIERDO: LISTA DE SEDES */}
      <div className="lg:col-span-1 space-y-4">
        <Button onClick={handleNewBranch} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black italic uppercase h-12 rounded-xl shadow-lg">
          <Plus size={18} className="mr-2" /> Agregar Sede
        </Button>

        <div className="space-y-3">
          {branches.map(branch => (
            <Card 
              key={branch.id} 
              onClick={() => setSelectedBranch(branch)}
              className={`cursor-pointer transition-all border-2 rounded-xl ${selectedBranch?.id === branch.id ? 'border-brand-700 bg-brand-50 shadow-md' : 'border-slate-200 hover:border-brand-300'}`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedBranch?.id === branch.id ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-slate-800 leading-tight">{branch.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Cód: {branch.code}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* PANEL DERECHO: DETALLE DE LA SEDE */}
      {selectedBranch ? (
        <div className="lg:col-span-3 space-y-6">
          
          {/* INFORMACIÓN DE LA SEDE */}
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-5">
              <CardTitle className="font-black italic uppercase flex items-center gap-2 text-lg">
                <MapPin className="text-brand-500"/> Información de la Sede
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSaveBranch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">Nombre de Sede</Label>
                  <Input name="name" defaultValue={selectedBranch.name} placeholder="Ej: Quilmes Centro" className="h-12 font-bold uppercase border-2" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">Código Interno</Label>
                  <Input name="code" defaultValue={selectedBranch.code} placeholder="Ej: QUI-01" className="h-12 font-bold uppercase border-2" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">Dirección</Label>
                  <Input name="address" defaultValue={selectedBranch.address} className="h-12 font-bold border-2" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">Teléfono</Label>
                  <Input name="phone" defaultValue={selectedBranch.phone} className="h-12 font-bold border-2" />
                </div>
                <div className="md:col-span-2 flex justify-end mt-2">
                  <Button type="submit" disabled={isBranchLoading} className="bg-brand-700 hover:bg-brand-800 h-12 px-8 font-black uppercase italic rounded-xl shadow-lg">
                    <Save size={18} className="mr-2" /> {isBranchLoading ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* EQUIPAMIENTO Y CENTRO IT */}
          {selectedBranch.id && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* EQUIPOS DE RAYOS */}
              <Card className="border-none shadow-lg rounded-2xl overflow-hidden border-t-4 border-brand-700 flex flex-col h-[500px]">
                <div className="bg-slate-50 p-4 border-b flex justify-between items-center shrink-0">
                  <h3 className="font-black uppercase italic text-slate-800 flex items-center gap-2">
                    <Activity size={18} className="text-brand-700" /> Salas y Equipos
                  </h3>
                  <Button size="sm" onClick={() => openEqModal('RAYOS')} className="h-8 bg-brand-100 text-brand-700 hover:bg-brand-200 font-bold text-xs">+ Agregar</Button>
                </div>
                <CardContent className="p-0 overflow-y-auto flex-1">
                  <div className="divide-y divide-slate-100">
                    {selectedBranch.equipments?.filter((e: any) => e.type === 'RAYOS').length === 0 ? (
                      <p className="p-6 text-center text-slate-400 font-bold text-sm italic">No hay equipos registrados</p>
                    ) : (
                      selectedBranch.equipments?.filter((e: any) => e.type === 'RAYOS').map((eq: any) => (
                        <div key={eq.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                          <div>
                            <span className="text-[10px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded tracking-widest">{eq.room || 'S/D'}</span>
                            <p className="font-black text-slate-800 uppercase mt-1.5">{eq.name}</p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => openEqModal('RAYOS', eq)} className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"><MonitorSmartphone size={14}/></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteEquipment(eq.id)} className="text-brand-600 hover:bg-brand-50 h-8 w-8 p-0"><Trash2 size={14}/></Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* CENTRO IT */}
              <Card className="border-none shadow-lg rounded-2xl overflow-hidden border-t-4 border-blue-600 flex flex-col h-[500px]">
                <div className="bg-slate-50 p-4 border-b flex justify-between items-center shrink-0">
                  <h3 className="font-black uppercase italic text-slate-800 flex items-center gap-2">
                    <Network size={18} className="text-blue-600" /> Computadoras (IT)
                  </h3>
                  <Button size="sm" onClick={() => openEqModal('PC')} className="h-8 bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold text-xs">+ Agregar PC</Button>
                </div>
                <CardContent className="p-0 overflow-y-auto flex-1">
                  <div className="divide-y divide-slate-100">
                    {selectedBranch.equipments?.filter((e: any) => e.type === 'PC').length === 0 ? (
                      <p className="p-6 text-center text-slate-400 font-bold text-sm italic">No hay computadoras registradas</p>
                    ) : (
                      selectedBranch.equipments?.filter((e: any) => e.type === 'PC').map((eq: any) => (
                        <div key={eq.id} className="p-4 flex justify-between items-start hover:bg-slate-50 transition-colors group">
                          <div className="flex-1">
                            <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded tracking-widest border border-blue-200">{eq.room || 'S/D'}</span>
                            <p className="font-black text-slate-800 uppercase mt-1.5">{eq.name}</p>
                            
                            {/* ANYDESK BUTTON */}
                            {eq.anydeskId && (
                              <div 
                                onClick={() => copyToClipboard(eq.anydeskId, "Anydesk")}
                                className="mt-2 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm mr-2"
                                title="Copiar Anydesk"
                              >
                                <img src="https://anydesk.com/favicon.ico" alt="Anydesk" className="w-3 h-3 grayscale contrast-200" />
                                <span className="text-xs font-mono font-bold tracking-widest">{eq.anydeskId}</span>
                                <Copy size={12} className="text-slate-400"/>
                              </div>
                            )}

                            {/* IP ADDRESS BUTTON */}
                            {eq.ipAddress && (
                              <div 
                                onClick={() => copyToClipboard(eq.ipAddress, "IP")}
                                className="mt-2 inline-flex items-center gap-2 bg-white border-2 border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm"
                                title="Copiar Dirección IP"
                              >
                                <Globe size={12} className="text-blue-500"/>
                                <span className="text-xs font-mono font-bold">{eq.ipAddress}</span>
                                <Copy size={12} className="text-slate-300"/>
                              </div>
                            )}
                          </div>
                          
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 shrink-0 ml-2">
                            <Button variant="ghost" size="sm" onClick={() => openEqModal('PC', eq)} className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0 border shadow-sm"><MonitorSmartphone size={14}/></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteEquipment(eq.id)} className="text-brand-600 hover:bg-brand-50 h-8 w-8 p-0 border shadow-sm"><Trash2 size={14}/></Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      ) : (
        <div className="lg:col-span-3 flex flex-col items-center justify-center py-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Building2 size={64} className="text-slate-300 mb-4" />
          <h2 className="text-xl font-black uppercase text-slate-400">Seleccioná una Sede</h2>
          <p className="text-sm font-bold text-slate-400 mt-2">O creá una nueva desde el panel izquierdo.</p>
        </div>
      )}

      {/* MODAL UNIVERSAL PARA EQUIPOS Y PCS */}
      <Dialog open={isEqModalOpen} onOpenChange={setIsEqModalOpen}>
        <DialogContent className={`sm:max-w-[425px] bg-white rounded-3xl border-t-8 outline-none ${eqData.type === 'PC' ? 'border-blue-600' : 'border-brand-700'}`}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase">
              {eqData.id ? 'Editar' : 'Nuevo'} {eqData.type === 'PC' ? 'Computadora' : 'Equipo Clínico'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400">Ubicación / Sala</Label>
              <Input value={eqData.room} onChange={e => setEqData({...eqData, room: e.target.value.toUpperCase()})} placeholder="Ej: SALA 1, RECEPCIÓN..." className="h-12 font-bold uppercase border-2" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400">Nombre / Identificador</Label>
              <Input value={eqData.name} onChange={e => setEqData({...eqData, name: e.target.value.toUpperCase()})} placeholder={eqData.type === 'PC' ? "Ej: PC Recepción Nacho" : "Ej: Panorámico Sirona"} className="h-12 font-bold uppercase border-2" />
            </div>
            
            {eqData.type === 'PC' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400">Anydesk</Label>
                    <Input value={eqData.anydeskId} onChange={e => setEqData({...eqData, anydeskId: e.target.value})} placeholder="Ej: 123 456 789" className="h-12 font-mono font-bold tracking-widest border-2 bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400">IP Local</Label>
                    <Input value={eqData.ipAddress} onChange={e => setEqData({...eqData, ipAddress: e.target.value})} placeholder="192.168.1.50" className="h-12 font-mono font-bold border-2 bg-slate-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">IP Tailscale</Label>
                  <Input value={eqData.tailscaleIp} onChange={e => setEqData({...eqData, tailscaleIp: e.target.value})} placeholder="100.x.x.x" className="h-12 font-mono font-bold border-2 bg-slate-50" />
                </div>
              </>
            )}

            <Button onClick={handleSaveEquipment} disabled={isEqLoading} className={`w-full h-14 text-lg text-white font-black uppercase italic rounded-2xl shadow-xl mt-4 ${eqData.type === 'PC' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-brand-700 hover:bg-brand-800'}`}>
              {isEqLoading ? "GUARDANDO..." : "GUARDAR ✓"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}