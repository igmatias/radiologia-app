"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { loginDentist, changeDentistPassword } from "@/actions/dentist-auth"
import { Stethoscope, Lock, ArrowRight, ShieldCheck } from "lucide-react"

export default function PortalMedicoLogin() {
  const router = useRouter()
  
  // Estados para el paso 1 (Login)
  const [matricula, setMatricula] = useState("")
  const [password, setPassword] = useState("")
  
  // Estados para el paso 2 (Cambio de clave)
  const [step, setStep] = useState<"LOGIN" | "CHANGE_PASSWORD">("LOGIN")
  const [dentistId, setDentistId] = useState("")
  const [newPassword, setNewPassword] = useState("")
  
  const [loading, setLoading] = useState(false)

  // Maneja el botón de Entrar
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matricula || !password) return toast.error("Completá todos los campos")

    setLoading(true)
    const res = await loginDentist(matricula.trim(), password.trim())
    
    if (res.success) {
      if (res.requirePasswordChange) {
        // Le pedimos que cambie la clave
        setDentistId(res.dentistId!)
        setStep("CHANGE_PASSWORD")
        toast("Primer ingreso detectado", { description: "Por seguridad, debés crear una nueva contraseña." })
      } else {
        // Entra directo al panel
        toast.success("¡Bienvenido al Portal!")
        router.push("/portal-medico/panel") // <--- Acá lo mandaremos en el próximo paso
      }
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  // Maneja el botón de Guardar Nueva Clave
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) return toast.error("La contraseña debe tener al menos 6 caracteres")

    setLoading(true)
    const res = await changeDentistPassword(dentistId, newPassword)
    
    if (res.success) {
      toast.success("Contraseña actualizada con éxito", { icon: "🔒" })
      router.push("/portal-medico/panel")
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Fondo decorativo corporativo */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-red-700/10 skew-y-6 transform -translate-y-20"></div>

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Logo / Cabecera */}
        <div className="text-center space-y-2 mb-8">
          <div className="mx-auto bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
            <Stethoscope size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">Tu Clínica</h1>
          <p className="text-xs font-bold uppercase text-red-400 tracking-[0.3em]">Portal de Profesionales</p>
        </div>

        {/* Tarjeta dinámica (Cambia según el paso) */}
        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
          <CardContent className="p-8">
            
            {step === "LOGIN" ? (
              // --- FORMULARIO DE INGRESO ---
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 space-y-1">
                  <h2 className="text-xl font-black uppercase text-slate-900">Iniciar Sesión</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Acceso exclusivo para Odontólogos Derivantes</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Matrícula (Prov. o Nac.)</label>
                    <Input 
                      placeholder="Ej: 12345" 
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      className="h-14 font-bold bg-slate-50 border-2 border-slate-100 focus-visible:ring-red-700 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Contraseña</label>
                    <Input 
                      type="password" 
                      placeholder="Si es tu primera vez, ingresá tu apellido" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 font-bold bg-slate-50 border-2 border-slate-100 focus-visible:ring-red-700 rounded-xl"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 mt-4 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic rounded-xl shadow-lg transition-all"
                  >
                    {loading ? "Verificando..." : "Ingresar"}
                  </Button>
                </form>
              </div>
            ) : (
              // --- FORMULARIO DE CAMBIO DE CLAVE (Primer Ingreso) ---
              <div className="animate-in slide-in-from-right-8 duration-500">
                <div className="mb-6 space-y-2 text-center">
                  <div className="mx-auto bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <Lock size={28} className="text-amber-600" />
                  </div>
                  <h2 className="text-xl font-black uppercase text-slate-900 leading-tight">Actualizá tu <br/>Contraseña</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase px-4">
                    Por motivos de seguridad, es necesario que crees una clave personal.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nueva Contraseña</label>
                    <Input 
                      type="password" 
                      placeholder="Mínimo 6 caracteres" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-14 font-bold bg-slate-50 border-2 border-slate-100 focus-visible:ring-amber-500 rounded-xl"
                      autoFocus
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 mt-4 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase italic rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? "Guardando..." : <>Guardar y Continuar <ArrowRight size={16}/></>}
                  </Button>
                </form>
              </div>
            )}

          </CardContent>
        </Card>
        
        <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-8">
          <ShieldCheck size={14} className="inline mr-1 mb-0.5"/> 
          Plataforma Segura
        </p>

      </div>
    </div>
  )
}