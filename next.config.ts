import type { NextConfig } from "next"

const securityHeaders = [
  // Previene clickjacking — la app no puede embeberse en iframes externos
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Previene MIME-type sniffing — el browser respeta el Content-Type declarado
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controla cuanto info de referencia se manda al navegar a otros dominios
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Fuerza HTTPS por 1 año (solo aplica si el sitio esta en produccion con TLS)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Limita permisos de APIs del browser que la app no necesita
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Aplicar a todas las rutas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
