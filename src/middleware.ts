import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('radiologia-auth')?.value
  const path = request.nextUrl.pathname

  // 1. Si no está logueado y NO está en el login, NI en el inicio, NI pidiendo el PDF -> ¡Al login!
  if (!authCookie && path !== '/login' && path !== '/' && path !== '/orden.pdf') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Si ya está logueado, leemos quién es
  if (authCookie) {
    const session = JSON.parse(authCookie)
    const role = session.role

    if (path === '/login') {
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
      if (role === 'TECHNICIAN') return NextResponse.redirect(new URL('/tecnico', request.url))
      return NextResponse.redirect(new URL('/recepcion', request.url))
    }

    // Regla para RECEPTIONIST: Solo puede estar en /recepcion
    if (role === 'RECEPTIONIST') {
      if (path.startsWith('/admin') || path.startsWith('/tecnico')) {
        return NextResponse.redirect(new URL('/recepcion', request.url))
      }
    }

    // Regla para TECHNICIAN: Puede estar en /tecnico y en /entregas
    if (role === 'TECHNICIAN') {
      if (path.startsWith('/admin') || path.startsWith('/recepcion')) {
        return NextResponse.redirect(new URL('/tecnico', request.url))
      }
    }
  }

  return NextResponse.next()
}

// Dejamos UNA SOLA regla de matcher bien configurada
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|resultados|portal-medico|orden\\.pdf|$).*)",
  ],
};