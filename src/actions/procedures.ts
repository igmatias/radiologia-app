"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/actions/auth"

export async function upsertProcedure(data: { id?: string, code: string, name: string, category?: string, requiresTooth?: boolean, options?: string[], extraPhotoPrice?: number }) {
  const session = await getCurrentSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) return { success: false, error: "Sin permisos" };
  try {
    let procedure;

    if (data.id && data.id !== "") {
      procedure = await prisma.procedure.update({
        where: { id: data.id },
        data: {
          code: data.code,
          name: data.name,
          category: data.category,
          requiresTooth: data.requiresTooth || false,
          options: data.options || [],
          extraPhotoPrice: data.extraPhotoPrice || 0,
        }
      });
    } else {
      procedure = await prisma.procedure.create({
        data: {
          code: data.code,
          name: data.name,
          category: data.category,
          requiresTooth: data.requiresTooth || false,
          options: data.options || [],
          extraPhotoPrice: data.extraPhotoPrice || 0,
        }
      });
    }

    revalidatePath("/admin/estudios");
    revalidatePath("/admin/obras-sociales"); 
    return { success: true, procedure };
  } catch (error: any) {
    console.error("Error saving procedure:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "Ese código de estudio ya existe. Debe ser único." };
    }
    return { success: false, error: "Error interno al guardar el estudio" };
  }
}

export async function deleteProcedure(id: string) {
  const session = await getCurrentSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) return { success: false, error: "Sin permisos" };
  try {
    await prisma.procedure.delete({
      where: { id }
    });
    
    revalidatePath("/admin/estudios");
    revalidatePath("/admin/obras-sociales");
    return { success: true };
  } catch (error) {
    console.error("Error deleting procedure:", error);
    return { success: false, error: "No se puede eliminar este estudio porque ya tiene precios u órdenes de pacientes asociadas. Te sugerimos cambiarle el nombre a '(INACTIVO) '." };
  }
}

export async function getProcedures() {
  try {
    const procedures = await prisma.procedure.findMany({ orderBy: { code: 'asc' } });
    return { success: true, procedures };
  } catch (error) {
    return { success: false, error: "Error al cargar los estudios" };
  }
}