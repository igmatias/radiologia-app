"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

// 1. GESTIÓN DE PERSONAL INTERNO
export async function saveStaffUser(data: any) {
  try {
    if (data.id) {
      // Actualizar usuario existente
      const updateData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        role: data.role,
        branchId: data.branchId || null,
        isActive: data.isActive,
      };

      // Solo hashear si se proporcionó un nuevo PIN
      if (data.pin) {
        updateData.pin = await bcrypt.hash(data.pin, 12);
      }

      await prisma.user.update({
        where: { id: data.id },
        data: updateData,
      });
    } else {
      // Crear usuario nuevo
      await prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          pin: await bcrypt.hash(data.pin, 12),
          role: data.role,
          branchId: data.branchId || null,
          isActive: true,
        },
      });
    }
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error: any) {
    console.error("Error guardando usuario:", error);
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
        password: await bcrypt.hash(newPassword, 12),
        mustChangePassword: true,
      },
    });
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error) {
    console.error("Error blanqueando clave:", error);
    return { success: false, error: "No se pudo blanquear la clave." };
  }
}
