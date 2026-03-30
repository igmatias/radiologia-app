"use client"

import { useEffect, useState } from "react"

export default function SwRegister() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }

    // Leer el evento capturado por el script inline del layout
    const checkPrompt = () => {
      if ((window as any)._pwaInstallEvent) {
        setShowBanner(true)
      }
    }

    // Verificar inmediatamente y también escuchar si llega después
    checkPrompt()
    const handler = (e: any) => {
      e.preventDefault()
      ;(window as any)._pwaInstallEvent = e
      setShowBanner(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    const prompt = (window as any)._pwaInstallEvent
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === "accepted") {
      setShowBanner(false)
      ;(window as any)._pwaInstallEvent = null
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-3 bg-neutral-900 border border-neutral-700 rounded-2xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-72x72.png" alt="I-R Dental" className="w-10 h-10 rounded-xl" />
        <div>
          <p className="text-white font-black text-sm">Instalar I-R Portal</p>
          <p className="text-neutral-400 text-xs">Accedé rápido desde tu pantalla de inicio</p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => setShowBanner(false)} className="text-neutral-400 text-xs px-3 py-2 rounded-lg hover:bg-neutral-800">Ahora no</button>
        <button onClick={handleInstall} className="bg-[#BA2C66] text-white text-xs font-black px-4 py-2 rounded-xl">Instalar</button>
      </div>
    </div>
  )
}
