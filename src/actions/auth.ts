"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { getIronSession } from "iron-session"
import bcrypt from "bcryptjs"
import { sessionOptions, type SessionData } from "@/lib/session"
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit"

export async function loginWithPin(username: string, pin: string) {
  // Validación básica del PIN
  if (!/^\d{4}$/.test(pin)) {
    return { success: false, error: "PIN inválido." };
  }

  // Rate limiting por username
  const rateCheck = checkRateLimit(username);
  if (rateCheck.limited) {
    return {
      success: false,
      error: `Demasiados intentos fallidos. Intentá de nuevo en ${Math.ceil(rateCheck.retryAfterSeconds! / 60)} minutos.`,
    };
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) return { success: false, error: "Usuario o PIN incorrecto." };
    if (!user.isActive) return { success: false, error: "Usuario inactivo." };

    const pinValid = await bcrypt.compare(pin, user.pin);
    if (!pinValid) return { success: false, error: "Usuario o PIN incorrecto." };

    // Login exitoso: limpiar el rate limit
    clearRateLimit(username);

    // Crear sesión firmada con iron-session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.id = user.id;
    session.username = user.username;
    session.name = `${user.firstName} ${user.lastName}`;
    session.role = user.role;
    await session.save();

    return { success: true, role: user.role };

  } catch (error) {
    console.error("Error en login:", error);
    return { success: false, error: "Error interno del servidor." };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.destroy();
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.id) return null;
  return session;
}
