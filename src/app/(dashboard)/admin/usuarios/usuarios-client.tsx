"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { saveStaffUser, resetDentistPassword } from "@/actions/admin-users"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import {
  Users, Key, ShieldCheck, UserPlus, MapPin, CheckCircle2, XCircle, Search, User, Lock, AtSign, Building2
} from "lucide-react"
import ToothIcon from "@/components/icons/tooth-icon"

export default function UsuariosClient({ initialUsers, initialDentists, branches }: any) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"PERSONAL" | "ODONTOLOGOS">("PERSONAL")
  
  // Estados para Modal de Personal
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>({})
  const [loading, setLoading] = useState(false)

  // Estados para Modal de Claves de Odontólogos y Buscador
  const [pwdModalOpen, setPwdModalOpen] = useState(false)
  const [selectedDentist, setSelectedDentist] = useState<any>(null)
  const [newPassword, setNewPassword] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // --- LÓGICA PERSONAL ---
  const openUserModal = (user: any = null) => {
    if (user) {
      setEditingUser(user)
    } else {
      setEditingUser({ firstName: "", lastName: "", username: "", pin: "", role: "RECEPTIONIST", branchId: "", isActive: true })
    }
    setUserModalOpen(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser.firstName || !editingUser.username || !editingUser.pin) {
      return toast.error("Completá los campos obligatorios")
    }
    setLoading(true)
    const res = await saveStaffUser(editingUser)
    if (res.success) {
      toast.success("Personal guardado correctamente ✓")
      setUserModalOpen(false)
      router.refresh()
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  // --- LÓGICA ODONTÓLOGOS ---
  const handleResetPassword = async () => {
    if (newPassword.length < 4) return toast.error("La clave debe tener al menos 4 caracteres")
    setLoading(true)
    const res = await resetDentistPassword(selectedDentist.id, newPassword)
    if (res.success) {
      toast.success(`Clave de Dr. ${selectedDentist.lastName} blanqueada ✓`)
      setPwdModalOpen(false)
      setNewPassword("")
      router.refresh()
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  // Filtrado de Odontólogos
  const filteredDentists = initialDentists.filter((d: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${d.lastName} ${d.firstName}`.toLowerCase();
    const reverseName = `${d.firstName} ${d.lastName}`.toLowerCase();
    const matricula = d.matriculaProv?.toLowerCase() || "";
    return fullName.includes(searchLower) || reverseName.includes(searchLower) || matricula.includes(searchLower);
  });

  // Si no hay búsqueda, mostramos solo los primeros 12 para no saturar la pantalla
  const displayedDentists = searchTerm ? filteredDentists : filteredDentists.slice(0, 12);

  return (
    <div className="space-y-6">
      
      {/* PESTAÑAS */}
      <div className="flex bg-slate-200 p-1.5 rounded-2xl w-full max-w-lg shadow-inner border border-slate-300">
        <button 
          onClick={() => setActiveTab("PERSONAL")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase text-xs transition-all ${activeTab === "PERSONAL" ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <ShieldCheck size={16}/> Personal Interno
        </button>
        <button 
          onClick={() => setActiveTab("ODONTOLOGOS")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase text-xs transition-all ${activeTab === "ODONTOLOGOS" ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <ToothIcon size={16}/> Odontólogos
        </button>
      </div>

      {/* =========================================
          PANTALLA 1: PERSONAL INTERNO 
          ========================================= */}
      {activeTab === "PERSONAL" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-end">
            <Button onClick={() => openUserModal()} className="bg-brand-700 hover:bg-brand-800 text-white font-black uppercase italic h-12 px-6 rounded-xl shadow-md">
              <UserPlus size={18} className="mr-2"/> Nuevo Usuario
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialUsers.map((u: any) => (
              <Card key={u.id} className={`border-none shadow-lg rounded-[2rem] overflow-hidden border-t-8 ${u.isActive ? 'border-emerald-500' : 'border-slate-300 opacity-60'}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded shadow-sm ${
                      u.role === 'SUPERADMIN' ? 'bg-brand-700 text-white' :
                      u.role === 'ADMIN' ? 'bg-slate-900 text-white' :
                      u.role === 'TECHNICIAN' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {u.role === 'SUPERADMIN' ? '★ SuperAdmin' : u.role === 'ADMIN' ? 'Admin' : u.role === 'TECHNICIAN' ? 'Técnico' : 'Recepcionista'}
                    </span>
                    {u.isActive ? <CheckCircle2 size={18} className="text-emerald-500"/> : <XCircle size={18} className="text-slate-400"/>}
                  </div>
                  <h3 className="text-xl font-black uppercase text-slate-900 leading-tight">
                    {u.lastName}, {u.firstName}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">Usuario: <span className="text-slate-800">{u.username}</span></p>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-3 flex items-center gap-1">
                    <MapPin size={12}/> {u.branch ? u.branch.name : 'Múltiples Sedes'}
                  </p>
                  
                  <Button onClick={() => openUserModal(u)} variant="outline" className="w-full mt-4 border-2 font-black uppercase text-[10px] h-10">
                    Editar Accesos
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* =========================================
          PANTALLA 2: ODONTÓLOGOS (BLANQUEO)
          ========================================= */}
      {activeTab === "ODONTOLOGOS" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Key size={24} className="text-amber-600 shrink-0"/>
              <p className="text-xs font-bold text-amber-800 uppercase leading-tight max-w-xl">
                Desde aquí podés asignarle una nueva contraseña temporal a un odontólogo. Al ingresar, el sistema le pedirá que cree una nueva por seguridad.
              </p>
            </div>
            
            {/* 🔥 NUEVO BUSCADOR */}
            <div className="relative w-full md:w-80 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600/50" size={18} />
              <Input
                placeholder="Buscar por apellido o matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 border-2 border-amber-200 focus-visible:ring-amber-500 rounded-xl font-bold bg-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedDentists.map((d: any) => (
              <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:border-amber-300 transition-colors">
                <h4 className="text-sm font-black uppercase text-slate-900 truncate" title={`${d.lastName}, ${d.firstName}`}>
                  Dr. {d.lastName}, {d.firstName}
                </h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 mb-4">MP: {d.matriculaProv || 'S/D'} • MN: {d.matriculaNac || 'S/D'}</p>
                
                <Button 
                  onClick={() => { setSelectedDentist(d); setPwdModalOpen(true); }}
                  variant="outline" 
                  className="mt-auto border-2 border-brand-100 text-brand-700 hover:bg-brand-50 font-black uppercase text-[10px] h-10"
                >
                  <Key size={14} className="mr-2"/> Blanquear Clave
                </Button>
              </div>
            ))}
          </div>

          {/* MENSAJES DE ESTADO DEL BUSCADOR */}
          {!searchTerm && initialDentists.length > 12 && (
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
              Mostrando 12 de {initialDentists.length} odontólogos. Usá el buscador para encontrar al resto.
            </p>
          )}
          {searchTerm && displayedDentists.length === 0 && (
            <p className="text-center text-sm font-black text-slate-400 uppercase mt-10">
              No se encontraron resultados para "{searchTerm}"
            </p>
          )}
        </div>
      )}

      {/* MODAL: EDITAR PERSONAL */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="sm:max-w-[460px] bg-white rounded-2xl border-none p-0 overflow-hidden outline-none">
          {/* Header */}
          <div className="bg-slate-900 px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center shrink-0">
              <UserPlus size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Gestión de Accesos</p>
              <DialogTitle className="text-lg font-black italic uppercase text-white leading-none">
                {editingUser.id ? "Editar Usuario" : "Nuevo Usuario"}
              </DialogTitle>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><User size={10}/> Nombre</Label>
                <Input placeholder="Ej: Juan" value={editingUser.firstName || ""} onChange={e => setEditingUser({...editingUser, firstName: e.target.value})} className="h-11 border-2 bg-slate-50 font-bold focus-visible:ring-brand-600"/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Apellido</Label>
                <Input placeholder="Ej: Pérez" value={editingUser.lastName || ""} onChange={e => setEditingUser({...editingUser, lastName: e.target.value})} className="h-11 border-2 bg-slate-50 font-bold focus-visible:ring-brand-600"/>
              </div>
            </div>

            {/* Usuario y PIN */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><AtSign size={10}/> Usuario</Label>
                <Input placeholder="Ej: juan.p" value={editingUser.username || ""} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="h-11 border-2 bg-slate-50 font-bold focus-visible:ring-brand-600"/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><Lock size={10}/> PIN</Label>
                <Input placeholder="Ej: 1234" value={editingUser.pin || ""} onChange={e => setEditingUser({...editingUser, pin: e.target.value})} className="h-11 border-2 bg-slate-50 font-bold focus-visible:ring-brand-600"/>
              </div>
            </div>

            {/* Rol */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><ShieldCheck size={10}/> Rol</Label>
              <Select value={editingUser.role} onValueChange={v => setEditingUser({...editingUser, role: v})}>
                <SelectTrigger className="h-11 border-2 bg-slate-50 font-bold uppercase text-xs focus:ring-brand-600">
                  <SelectValue placeholder="Seleccioná un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEPTIONIST" className="font-bold text-xs">Recepcionista</SelectItem>
                  <SelectItem value="TECHNICIAN" className="font-bold text-xs">Técnico/a</SelectItem>
                  <SelectItem value="ADMIN" className="font-bold text-xs">Administrador</SelectItem>
                  <SelectItem value="SUPERADMIN" className="font-bold text-xs text-brand-700">★ Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sede */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><Building2 size={10}/> Sede Asignada</Label>
              <Select value={editingUser.branchId || "ALL"} onValueChange={v => setEditingUser({...editingUser, branchId: v === "ALL" ? "" : v})}>
                <SelectTrigger className="h-11 border-2 bg-slate-50 font-bold text-xs uppercase focus:ring-brand-600">
                  <SelectValue placeholder="Sede asignada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="font-bold text-xs uppercase text-slate-500">Sin restricción — Múltiples Sedes</SelectItem>
                  {branches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id} className="font-bold text-xs uppercase">{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Activar/Desactivar (solo al editar) */}
            {editingUser.id && (
              <button
                onClick={() => setEditingUser({...editingUser, isActive: !editingUser.isActive})}
                className={`w-full h-10 rounded-xl font-black uppercase text-xs border-2 transition-all ${editingUser.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
              >
                {editingUser.isActive ? "Desactivar usuario" : "✓ Reactivar usuario"}
              </button>
            )}

            <Button onClick={handleSaveUser} disabled={loading} className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-black uppercase rounded-xl shadow-md border-b-4 border-brand-800 active:border-b-0 active:translate-y-px transition-all">
              {loading ? "Guardando..." : "Guardar accesos"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: BLANQUEAR CLAVE ODONTOLOGO */}
      <Dialog open={pwdModalOpen} onOpenChange={setPwdModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white rounded-[2rem] border-t-8 border-brand-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase text-slate-900">Blanquear Contraseña</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <p className="text-xs font-bold text-slate-600">
              Estás por asignarle una nueva clave a <span className="text-slate-900 font-black uppercase">Dr. {selectedDentist?.lastName}</span>.
            </p>
            
            <Input 
              type="text"
              placeholder="Escribí una nueva clave temporal..." 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              className="h-14 border-2 bg-slate-50 font-bold text-lg"
            />

            <Button onClick={handleResetPassword} disabled={loading} className="w-full h-14 bg-brand-700 hover:bg-brand-800 text-white font-black uppercase italic rounded-xl shadow-md text-sm">
              {loading ? "Actualizando..." : "Confirmar Nueva Clave"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}