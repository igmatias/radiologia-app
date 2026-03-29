"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { loginWithPin } from "@/actions/auth"
import { Lock, UserCircle, ArrowRight, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || pin.length !== 4) {
      return toast.error("Ingresá tu usuario y el PIN de 4 dígitos")
    }

    setLoading(true)
    const res = await loginWithPin(username, pin)

    if (res.success) {
      toast.success("¡Bienvenido/a!")
      const role = res.role as string
      if (role === "SUPERADMIN") router.push("/admin")
      else if (role === "ADMIN") router.push("/admin/reportes")
      else if (role === "TECHNICIAN") router.push("/tecnico")
      else router.push("/recepcion")
    } else {
      toast.error(res.error)
      setPin("")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Volver a la web */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-neutral-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors z-20"
      >
        ← Volver a la web
      </Link>

      {/* Cubos 3D animados */}
      <div className="cubes-bg" aria-hidden="true">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="cube" style={{
            '--i': i,
            '--x': `${10 + (i * 6.5) % 85}%`,
            '--delay': `${(i * 1.3) % 8}s`,
            '--size': `${30 + (i * 17) % 60}px`,
            '--duration': `${8 + (i * 2.1) % 12}s`,
          } as React.CSSProperties} />
        ))}
      </div>

      <div className="w-full max-w-md z-10 space-y-3 sm:space-y-5">

        {/* Logo */}
        <div className="text-center space-y-2 mb-3 sm:mb-6">
          <div className="mx-auto w-24 sm:w-32 h-auto flex items-center justify-center mb-2 sm:mb-4">
            <img
              src="/logo.png?v=1"
              alt="I-R Dental Logo"
              className="w-full h-auto"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold uppercase text-white tracking-widest">Acceso al Sistema</h1>
          <p className="text-xs font-semibold text-neutral-400">Panel interno — Solo personal autorizado</p>
        </div>

        {/* Card */}
        <Card className="border-t-4 border-t-brand-600 shadow-2xl rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-5 sm:p-8">
            <div className="mb-5 sm:mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center shrink-0">
                  <Lock size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase text-neutral-900">Iniciar Sesión</h2>
                  <div className="w-10 h-1 bg-brand-600 mt-1 rounded-full" />
                </div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Usuario</label>
                <div className="relative">
                  <UserCircle className="absolute left-4 top-3.5 text-neutral-400" size={18} />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 border-2 font-bold text-base rounded-xl pl-11 focus-visible:ring-brand-600"
                    placeholder="Ej: GomezMaria"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-neutral-500 tracking-wider">PIN de Seguridad (4 dígitos)</label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="h-12 text-center text-3xl tracking-[1em] font-bold border-2 rounded-xl focus-visible:ring-brand-600"
                  placeholder="••••"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-3 sm:mt-5 bg-brand-600 hover:bg-brand-700 text-white font-bold uppercase tracking-wider rounded-lg shadow-lg hover:shadow-brand-600/30 transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? "Verificando..." : <> Ingresar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-neutral-500 font-bold uppercase tracking-widest mt-3 sm:mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck size={16} className="text-brand-500" />
          Plataforma Segura
        </p>
      </div>
    </div>
  )
}
