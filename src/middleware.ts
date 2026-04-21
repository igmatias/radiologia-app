import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { sessionOptions, SessionData } from "@/lib/session"

// Rutas públicas exactas
const PUBLIC_PATHS = new Set(["/", "/login", "/hola"])

// Prefijos de rutas públicas (portal del odontólogo, resultados)
const PUBLIC_PREFIXES = [
  "/resultados/",
  "/portal-medico",
  "/api/public/",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas exactas
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next()

  // Permitir prefijos públicos
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next()

  // Fast-path: si no hay cookie, redirigir sin parsear
  if (!request.cookies.has("radiologia-auth")) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Validar sesión completa con iron-session
  const response = NextResponse.next()
  try {
    const session = await getIronSession<SessionData>(
      request,
      response,
      sessionOptions
    )
    if (!session.id) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }
  } catch {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Aplica middleware a todas las rutas excepto recursos estáticos y
     * archivos internos de Next.js.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt).*)",
  ],
}
