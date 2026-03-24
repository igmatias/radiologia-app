import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const response = NextResponse.next()

  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  const isAuthenticated = !!session.id

  // 1. Si no está autenticado -> al login
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const role = session.role

  // 2. Si ya está logueado e intenta entrar al login -> redirigir a su área
  if (path === '/login') {
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
    if (role === 'TECHNICIAN') return NextResponse.redirect(new URL('/tecnico', request.url))
    return NextResponse.redirect(new URL('/recepcion', request.url))
  }

  // 3. Regla para RECEPTIONIST: Solo puede estar en /recepcion
  if (role === 'RECEPTIONIST') {
    if (path.startsWith('/admin') || path.startsWith('/tecnico')) {
      return NextResponse.redirect(new URL('/recepcion', request.url))
    }
  }

  // 4. Regla para TECHNICIAN: Puede estar en /tecnico y en /entregas
  if (role === 'TECHNICIAN') {
    if (path.startsWith('/admin') || path.startsWith('/recepcion')) {
      return NextResponse.redirect(new URL('/tecnico', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|resultados|portal-medico|orden\\.pdf|$).*)",
  ],
};
