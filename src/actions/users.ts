"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
// Si usás bcrypt para encriptar contraseñas, descomentá la línea de abajo:
// import bcrypt from "bcryptjs" 

export async function upsertUser(data: { id?: string, name: string, username: string, role: string, branchId?: string, password?: string }) {
  try {
    const userData: any = {
      name: data.name.toUpperCase(),
      username: data.username.toLowerCase(),
      role: data.role,
      branchId: data.branchId || null,
    };

    // Si el administrador escribió una contraseña nueva, la actualizamos
    if (data.password && data.password.trim() !== "") {
      // userData.password = await bcrypt.hash(data.password, 10); // <-- Usá esto si encriptás
      userData.password = data.password; // <-- Usá esto si guardás en texto plano
    }

    if (data.id && data.id !== "") {
      // MODO EDICIÓN
      await prisma.user.update({
        where: { id: data.id },
        data: userData
      });
    } else {
      // MODO CREACIÓN
      if (!data.password) return { success: false, error: "La contraseña es obligatoria para usuarios nuevos." };
      
      await prisma.user.create({
        data: userData
      });
    }

    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving user:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "El nombre de usuario ya está en uso. Elegí otro." };
    }
    return { success: false, error: "Error interno al guardar el usuario" };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se puede eliminar el usuario porque tiene registros asociados." };
  }
}