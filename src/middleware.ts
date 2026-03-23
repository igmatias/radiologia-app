import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('radiologia-auth')?.value
  const path = request.nextUrl.pathname

  // 1. Si no está logueado y NO está en el login NI en el inicio -> ¡Al login!
  // 🔥 Le agregamos "&& path !== '/'" para que deje entrar a la Landing Page
  if (!authCookie && path !== '/login' && path !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Si ya está logueado, leemos quién es
  if (authCookie) {
    const session = JSON.parse(authCookie)
    const role = session.role // Puede ser: 'ADMIN', 'RECEPTIONIST', o 'TECHNICIAN'

    // Si va al login, lo mandamos a su panel correspondiente
    // 🔥 Sacamos el "path === '/'" de acá para que, si quiere, el empleado pueda ver la Landing Page igual
    if (path === '/login') {
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
      if (role === 'TECHNICIAN') return NextResponse.redirect(new URL('/tecnico', request.url))
      return NextResponse.redirect(new URL('/recepcion', request.url))
    }

    // --- REGLAS DE SEGURIDAD BLINDADAS ---

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

    // El ADMIN pasa siempre a todos lados, no le ponemos restricciones.
  }

  // Si todo está en orden, dejamos que la página cargue
  return NextResponse.next()
}

// Ignoramos los archivos del sistema, imágenes y los portales públicos
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * - api (rutas de API)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (ícono)
     * - login (pantalla de inicio de sesión de empleados)
     * - resultados (Portal público del paciente)
     * - portal-medico (PORTAL DE LOS ODONTÓLOGOS)
     * - la página de inicio ('/') <--- 🔥 NUEVO: Excluimos la raíz para evitar loops
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|resultados|portal-medico|$).*)",
    "/((?!api|_next/static|_next/image|favicon.ico|login|resultados|portal-medico|orden\\.pdf|$).*)",
  ],
};

