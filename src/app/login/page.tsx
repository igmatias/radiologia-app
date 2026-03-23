"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { loginWithPin } from "@/actions/auth"
import { Lock, UserCircle } from "lucide-react"

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
      // Usamos EXACTAMENTE los roles de Prisma
      if (res.role === "ADMIN") router.push("/admin")
      else if (res.role === "TECHNICIAN") router.push("/tecnico")
      else router.push("/recepcion")
    } else {
      toast.error(res.error)
      setPin("") // Limpiamos el PIN si se equivocó
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-t-8 border-t-red-700 shadow-2xl rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mb-4">
              <Lock size={32} />
            </div>
            <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Acceso al Sistema</h1>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Centro Radiológico Quilmes</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Usuario</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-4 text-slate-400" size={20} />
                <Input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-14 border-2 font-black text-lg rounded-xl pl-12"
                  placeholder="EJ: GomezMaria"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">PIN de Seguridad (4 dígitos)</label>
              <Input 
                type="password" 
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))} // Solo permite números
                className="h-16 text-center text-4xl tracking-[1em] font-black border-2 rounded-xl"
                placeholder="••••"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-red-700 hover:bg-red-800 h-16 text-white text-xl font-black italic uppercase rounded-2xl shadow-xl transition-all">
              {loading ? "VERIFICANDO..." : "INGRESAR ✓"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}