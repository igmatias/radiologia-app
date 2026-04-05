"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { getCurrentSession } from "@/actions/auth"

// 1. GESTIÓN DE PERSONAL INTERNO
export async function saveStaffUser(data: any) {
  const session = await getCurrentSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) return { success: false, error: "Sin permisos" };
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

      // Solo hashear si se proporcionó una nueva contraseña
      if (data.pin && data.pin.trim() !== "") {
        const hashed = await bcrypt.hash(data.pin, 12);
        updateData.password = hashed;  // Guardamos en el campo nuevo
        updateData.pin = hashed;       // Mantenemos pin en sync para compat
        updateData.mustResetPassword = true; // Forzar cambio en próximo login
      }

      await prisma.user.update({
        where: { id: data.id },
        data: updateData,
      });
    } else {
      // Crear usuario nuevo — siempre requiere contraseña
      if (!data.pin || data.pin.trim() === "") {
        return { success: false, error: "La contraseña inicial es obligatoria." };
      }
      if (data.pin.trim().length < 6) {
        return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
      }
      const hashed = await bcrypt.hash(data.pin, 12);
      await prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          pin: hashed,              // Legacy field — mantenemos en sync
          password: hashed,         // Nuevo campo
          mustResetPassword: true,  // Primer login requiere cambio de contraseña
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
  const session = await getCurrentSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) return { success: false, error: "Sin permisos" };
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
