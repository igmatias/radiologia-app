"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { getIronSession } from "iron-session"
import bcrypt from "bcryptjs"
import { dentistSessionOptions, type DentistSessionData } from "@/lib/session"
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit"

// 1. FUNCIÓN PARA INICIAR SESIÓN
export async function loginDentist(matricula: string, pass: string) {
  const rateCheck = checkRateLimit(`dentist:${matricula}`);
  if (rateCheck.limited) {
    return {
      success: false,
      error: `Demasiados intentos fallidos. Intentá de nuevo en ${Math.ceil(rateCheck.retryAfterSeconds! / 60)} minutos.`,
    };
  }

  try {
    const dentist = await prisma.dentist.findFirst({
      where: {
        OR: [
          { matriculaProv: matricula },
          { matriculaNac: matricula }
        ]
      }
    });

    if (!dentist) {
      return { success: false, error: "No se encontró ningún profesional con esa matrícula." };
    }

    // Si no tiene password seteada, la clave por defecto es el apellido
    let passwordValid = false;
    if (!dentist.password) {
      // Clave por defecto: apellido (solo si mustChangePassword es true)
      passwordValid = dentist.mustChangePassword && dentist.lastName.toLowerCase() === pass.toLowerCase();
    } else {
      passwordValid = await bcrypt.compare(pass, dentist.password);
    }

    if (!passwordValid) {
      return { success: false, error: "Contraseña incorrecta." };
    }

    clearRateLimit(`dentist:${matricula}`);

    if (dentist.mustChangePassword) {
      return { success: true, requirePasswordChange: true, dentistId: dentist.id };
    }

    const cookieStore = await cookies();
    const session = await getIronSession<DentistSessionData>(cookieStore, dentistSessionOptions);
    session.dentistId = dentist.id;
    await session.save();

    return { success: true, requirePasswordChange: false };
  } catch (error) {
    console.error("Error en login médico:", error);
    return { success: false, error: "Ocurrió un error en el servidor." };
  }
}

// 2. FUNCIÓN PARA CAMBIAR LA CLAVE (PRIMER INGRESO)
export async function changeDentistPassword(dentistId: string, newPassword: string) {
  try {
    await prisma.dentist.update({
      where: { id: dentistId },
      data: {
        password: await bcrypt.hash(newPassword, 12),
        mustChangePassword: false,
      },
    });

    const cookieStore = await cookies();
    const session = await getIronSession<DentistSessionData>(cookieStore, dentistSessionOptions);
    session.dentistId = dentistId;
    await session.save();

    return { success: true };
  } catch (error) {
    console.error("Error al cambiar password:", error);
    return { success: false, error: "No se pudo actualizar la contraseña." };
  }
}

// 3. FUNCIÓN PARA CERRAR SESIÓN DEL MÉDICO
export async function logoutDentist() {
  const cookieStore = await cookies();
  const session = await getIronSession<DentistSessionData>(cookieStore, dentistSessionOptions);
  session.destroy();
  return { success: true };
}

export async function updateDentistProfile(dentistId: string, data: any) {
  try {
    await prisma.dentist.update({
      where: { id: dentistId },
      data: {
        phone: data.phone,
        email: data.email,
        deliveryMethod: data.deliveryMethod,
        resultPreference: data.resultPreference,
        ...(data.firstName  ? { firstName:    data.firstName.trim()  } : {}),
        ...(data.lastName   ? { lastName:     data.lastName.trim()   } : {}),
        ...(data.matriculaProv !== undefined ? { matriculaProv: data.matriculaProv || null } : {}),
        ...(data.matriculaNac  !== undefined ? { matriculaNac:  data.matriculaNac  || null } : {}),
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    return { success: false };
  }
}
