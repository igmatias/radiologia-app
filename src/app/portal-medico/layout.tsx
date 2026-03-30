import type { Metadata, Viewport } from "next"
import SwRegister from "./sw-register"

export const metadata: Metadata = {
  title: "I-R Dental - Portal Médico",
  description: "Portal de odontólogos - I-R Dental Radiología",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "I-R Portal",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#BA2C66",
}

export default function PortalMedicoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <SwRegister />
    </>
  )
}
