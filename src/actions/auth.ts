"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { getIronSession } from "iron-session"
import bcrypt from "bcryptjs"
import { sessionOptions, type SessionData } from "@/lib/session"
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit"

export async function loginWithPin(username: string, credential: string) {
  // Validación básica: mínimo 4 caracteres (compat con PINs viejos y nuevas contraseñas)
  if (!credential || credential.trim().length < 4) {
    return { success: false, error: "Credencial inválida." };
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

    if (!user) return { success: false, error: "Usuario o contraseña incorrectos." };
    if (!user.isActive) return { success: false, error: "Usuario inactivo." };

    // Si el usuario ya tiene contraseña nueva, usarla; sino usar el PIN legacy
    const hashToCheck = user.password ?? user.pin;
    const credentialValid = await bcrypt.compare(credential, hashToCheck);
    if (!credentialValid) return { success: false, error: "Usuario o contraseña incorrectos." };

    // Login exitoso: limpiar el rate limit
    clearRateLimit(username);

    // Si debe cambiar contraseña, devolver flag antes de crear sesión
    if (user.mustResetPassword) {
      return { success: true, requirePasswordChange: true, userId: user.id };
    }

    // Crear sesión firmada con iron-session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.id = user.id;
    session.username = user.username;
    session.name = `${user.firstName} ${user.lastName}`;
    session.role = user.role;
    await session.save();

    return { success: true, requirePasswordChange: false, role: user.role };

  } catch (error) {
    console.error("Error en login:", error);
    return { success: false, error: "Error interno del servidor." };
  }
}

export async function changeUserPassword(userId: string, newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 12);
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        mustResetPassword: false,
      },
    });

    // Crear sesión ahora que el cambio fue exitoso
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.id = user.id;
    session.username = user.username;
    session.name = `${user.firstName} ${user.lastName}`;
    session.role = user.role;
    await session.save();

    return { success: true, role: user.role };
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    return { success: false, error: "No se pudo actualizar la contraseña." };
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
