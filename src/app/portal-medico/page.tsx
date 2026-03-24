"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { loginDentist, changeDentistPassword } from "@/actions/dentist-auth"
import { Lock, ArrowRight, ShieldCheck, ChevronLeft } from "lucide-react"
import Link from "next/link"

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
        toast.success("¡Bienvenido al Portal Profesional!")
        router.push("/portal-medico/panel")
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
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Botón para volver a la Home */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 text-neutral-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors z-20"
      >
        <ChevronLeft size={16} /> Volver a la web
      </Link>

      {/* Fondo decorativo corporativo (Estilo I-R Dental) */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=1920')] opacity-10 bg-cover bg-center mix-blend-luminosity z-0"></div>
      <div className="absolute top-0 left-0 w-full h-[120%] bg-gradient-to-b from-red-600/20 to-transparent skew-y-6 transform -translate-y-1/2 z-0 pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Logo / Cabecera */}
        <div className="text-center space-y-4 mb-8">
          <div className="mx-auto w-32 h-auto flex items-center justify-center mb-6">
            <img 
              src="/logo.png?v=1" 
              alt="I-R Dental Logo" 
              className="w-full h-auto brightness-0 invert" 
            />
          </div>
          <h1 className="text-2xl font-bold uppercase text-white tracking-widest">Portal Profesional</h1>
          <p className="text-xs font-semibold text-neutral-400">Acceso exclusivo para Odontólogos Derivantes</p>
        </div>

        {/* Tarjeta dinámica (Cambia según el paso) */}
        <Card className="border-t-4 border-t-red-600 shadow-2xl rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-8">
            
            {step === "LOGIN" ? (
              // --- FORMULARIO DE INGRESO ---
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h2 className="text-xl font-bold uppercase text-neutral-900">Iniciar Sesión</h2>
                  <div className="w-12 h-1 bg-red-600 mt-2 rounded-full"></div>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Matrícula (Prov. o Nac.)</label>
                    <Input 
                      placeholder="Ej: 12345" 
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      className="h-12 bg-neutral-50 border-neutral-200 focus-visible:ring-red-600 rounded-lg text-lg font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Contraseña</label>
                    <Input 
                      type="password" 
                      placeholder="Primer ingreso: tu apellido" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-neutral-50 border-neutral-200 focus-visible:ring-red-600 rounded-lg text-lg font-medium placeholder:text-sm"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-12 mt-6 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-lg shadow-lg hover:shadow-red-600/30 transition-all flex items-center justify-center gap-2 group"
                  >
                    {loading ? "Verificando..." : <>Ingresar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                  </Button>
                </form>
              </div>
            ) : (
              // --- FORMULARIO DE CAMBIO DE CLAVE (Primer Ingreso) ---
              <div className="animate-in slide-in-from-right-8 duration-500">
                <div className="mb-8 text-center flex flex-col items-center">
                  <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <Lock size={28} className="text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold uppercase text-neutral-900 leading-tight mb-2">Seguridad de la Cuenta</h2>
                  <p className="text-sm text-neutral-500">
                    Al ser tu primer ingreso, debés crear una contraseña segura y personal.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Nueva Contraseña</label>
                    <Input 
                      type="password" 
                      placeholder="Mínimo 6 caracteres" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-12 bg-neutral-50 border-neutral-200 focus-visible:ring-red-600 rounded-lg text-lg font-medium"
                      autoFocus
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-12 mt-6 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase tracking-wider rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 group"
                  >
                    {loading ? "Guardando..." : <>Guardar y Continuar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                  </Button>
                </form>
              </div>
            )}

          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-neutral-500 font-bold uppercase tracking-widest mt-8 flex items-center justify-center gap-1.5">
          <ShieldCheck size={16} className="text-red-500"/> 
          Plataforma Segura
        </p>

      </div>
    </div>
  )
}