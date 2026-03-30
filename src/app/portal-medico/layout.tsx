import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "I-R Dental - Portal Médico",
  description: "Portal de odontólogos - I-R Dental Radiología",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "I-R Portal",
    startupImage: "/icons/icon-512x512.png",
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
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      {children}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', { scope: '/portal-medico' })
              })
            }
          `,
        }}
      />
    </>
  )
}
