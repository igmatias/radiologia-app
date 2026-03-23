"use server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function loginWithPin(username: string, pin: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) return { success: false, error: "Usuario no encontrado" };
    if (!user.isActive) return { success: false, error: "Usuario inactivo" };
    if (user.pin !== pin) return { success: false, error: "PIN incorrecto" };

    // Creamos la sesión 
    const sessionData = {
      id: user.id,
      username: user.username,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role
    };

    // CORRECCIÓN NEXT.JS 15: Ahora cookies() necesita un await
    const cookieStore = await cookies();
    
    cookieStore.set("radiologia-auth", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12, // 12 horas de turno
      path: "/",
    });

    return { success: true, role: user.role };
    
  } catch (error: any) {
    // Ahora mandamos el error real a la consola y a la pantalla para no estar a ciegas
    console.error("Error en login detallado:", error);
    return { success: false, error: `Error interno: ${error.message || 'Desconocido'}` };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("radiologia-auth");
}

// Agregá esto al final de src/actions/auth.ts
export async function getCurrentSession() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("radiologia-auth")?.value;
  if (!authCookie) return null;
  return JSON.parse(authCookie);
}