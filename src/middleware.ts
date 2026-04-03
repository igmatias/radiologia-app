import { NextRequest, NextResponse } from "next/server"
import { unsealData } from "iron-session"

const SESSION_SECRET = process.env.SESSION_SECRET as string

async function hasStaffSession(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get("radiologia-auth")?.value
  if (!cookie) return false
  try {
    const data = await unsealData<{ id?: string }>(cookie, { password: SESSION_SECRET })
    return !!data.id
  } catch {
    return false
  }
}

async function hasDentistSession(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get("dentist_session")?.value
  if (!cookie) return false
  try {
    const data = await unsealData<{ dentistId?: string }>(cookie, { password: SESSION_SECRET })
    return !!data.dentistId
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas protegidas para staff (recepción, técnico, admin, etc.)
  const staffRoutes = [
    "/admin",
    "/recepcion",
    "/tecnico",
    "/caja",
    "/configuracion",
    "/entregas",
    "/pacientes",
    "/ordenes",
  ]

  if (staffRoutes.some((r) => pathname.startsWith(r))) {
    if (!(await hasStaffSession(request))) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Panel del portal médico — requiere sesión de dentista
  if (pathname.startsWith("/portal-medico/panel")) {
    if (!(await hasDentistSession(request))) {
      return NextResponse.redirect(new URL("/portal-medico", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/recepcion/:path*",
    "/tecnico/:path*",
    "/caja/:path*",
    "/configuracion/:path*",
    "/entregas/:path*",
    "/pacientes/:path*",
    "/ordenes/:path*",
    "/portal-medico/panel/:path*",
  ],
}
