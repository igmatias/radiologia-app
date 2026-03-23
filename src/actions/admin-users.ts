"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// 1. GESTIÓN DE PERSONAL INTERNO
export async function saveStaffUser(data: any) {
  try {
    if (data.id) {
      // Actualizar usuario existente
      await prisma.user.update({
        where: { id: data.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          pin: data.pin,
          role: data.role,
          branchId: data.branchId || null,
          isActive: data.isActive
        }
      });
    } else {
      // Crear usuario nuevo
      await prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          pin: data.pin,
          role: data.role,
          branchId: data.branchId || null,
          isActive: true
        }
      });
    }
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error: any) {
    console.error("Error guardando usuario:", error);
    // Si el error es por username duplicado, Prisma tira el código P2002
    if (error.code === 'P2002') return { success: false, error: "Ese nombre de usuario ya existe." };
    return { success: false, error: "Ocurrió un error al guardar el personal." };
  }
}

// 2. BLANQUEO DE CLAVES PARA ODONTÓLOGOS
export async function resetDentistPassword(dentistId: string, newPassword: string) {
  try {
    await prisma.dentist.update({
      where: { id: dentistId },
      data: { 
        password: newPassword, 
        mustChangePassword: true // Lo obligamos a cambiarla cuando entre
      }
    });
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error) {
    console.error("Error blanqueando clave:", error);
    return { success: false, error: "No se pudo blanquear la clave." };
  }
}