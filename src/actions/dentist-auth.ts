"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

// 1. FUNCIÓN PARA INICIAR SESIÓN
export async function loginDentist(matricula: string, pass: string) {
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

    const isDefaultPassword = !dentist.password && dentist.lastName.toLowerCase() === pass.toLowerCase();
    const isCustomPassword = dentist.password === pass; 

    if (!isDefaultPassword && !isCustomPassword) {
      return { success: false, error: "Contraseña incorrecta." };
    }

    if (dentist.mustChangePassword) {
       return { success: true, requirePasswordChange: true, dentistId: dentist.id };
    }

    // 🔥 SOLUCIÓN: Agregamos await
    const cookieStore = await cookies();
    cookieStore.set("dentist_session", dentist.id, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        path: "/",
        maxAge: 60 * 60 * 24 * 30 
    });

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
        password: newPassword, 
        mustChangePassword: false 
      }
    });
    
    // 🔥 SOLUCIÓN: Agregamos await
    const cookieStore = await cookies();
    cookieStore.set("dentist_session", dentistId, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        path: "/",
        maxAge: 60 * 60 * 24 * 30 
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar password:", error);
    return { success: false, error: "No se pudo actualizar la contraseña." };
  }
}

// 3. FUNCIÓN PARA CERRAR SESIÓN DEL MÉDICO
export async function logoutDentist() {
  // 🔥 SOLUCIÓN: Agregamos await
  const cookieStore = await cookies();
  cookieStore.delete("dentist_session");
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
        resultPreference: data.resultPreference
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    return { success: false };
  }
}