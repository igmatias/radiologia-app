import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { unsealData } from 'iron-session'

const SESSION_SECRET = process.env.SESSION_SECRET as string

type SessionData = {
  id?: string
  role?: 'SUPERADMIN' | 'ADMIN' | 'RECEPTIONIST' | 'TECHNICIAN'
}

type DentistSessionData = {
  dentistId?: string
}

async function getStaffSession(request: NextRequest): Promise<SessionData | null> {
  const cookie = request.cookies.get('radiologia-auth')?.value
  if (!cookie) return null
  try {
    const data = await unsealData<SessionData>(cookie, { password: SESSION_SECRET })
    return data.id ? data : null
  } catch {
    return null
  }
}

async function getDentistSession(request: NextRequest): Promise<DentistSessionData | null> {
  const cookie = request.cookies.get('dentist_session')?.value
  if (!cookie) return null
  try {
    const data = await unsealData<DentistSessionData>(cookie, { password: SESSION_SECRET })
    return data.dentistId ? data : null
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ── Portal médico: panel requiere sesión de dentista ──────────────────────
  if (path.startsWith('/portal-medico/panel')) {
    const dentistSession = await getDentistSession(request)
    if (!dentistSession) {
      return NextResponse.redirect(new URL('/portal-medico', request.url))
    }
    return NextResponse.next()
  }

  // ── Rutas de staff: requieren sesión de usuario ───────────────────────────
  const session = await getStaffSession(request)

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', path)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.role

  // Si ya está logueado e intenta entrar al login → redirigir a su área
  if (path === '/login') {
    if (role === 'SUPERADMIN' || role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
    if (role === 'TECHNICIAN') return NextResponse.redirect(new URL('/tecnico', request.url))
    return NextResponse.redirect(new URL('/recepcion', request.url))
  }

  // SUPERADMIN: acceso total, sin restricciones
  if (role === 'SUPERADMIN') return NextResponse.next()

  // RECEPTIONIST: solo puede estar en /recepcion, /caja, /pacientes, /ordenes
  if (role === 'RECEPTIONIST') {
    if (path.startsWith('/admin') || path.startsWith('/tecnico')) {
      return NextResponse.redirect(new URL('/recepcion', request.url))
    }
  }

  // TECHNICIAN: puede estar en /tecnico y /entregas
  if (role === 'TECHNICIAN') {
    if (path.startsWith('/admin') || path.startsWith('/recepcion')) {
      return NextResponse.redirect(new URL('/tecnico', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|login|resultados|portal-medico(?!/panel)|print|hola|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp3|pdf|txt)$|$).*)",
  ],
}
