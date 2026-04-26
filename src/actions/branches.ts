"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/actions/auth"

// GUARDAR O CREAR SEDE
export async function upsertBranch(data: any) {
  const session = await getCurrentSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) return { success: false, error: "Sin permisos" };
  try {
    const branch = await prisma.branch.upsert({
      where: { id: data.id || 'new' },
      update: {
        name: data.name,
        code: data.code,
        address: data.address,
        phone: data.phone,
      },
      create: {
        name: data.name,
        code: data.code,
        address: data.address,
        phone: data.phone,
      }
    });
    revalidatePath("/admin/sedes");
    return { success: true, branch };
  } catch (error) {
    console.error("Error saving branch:", error);
    return { success: false, error: "Error al guardar la sede" };
  }
}

// GUARDAR O CREAR EQUIPO / PC
export async function upsertEquipment(data: any) {
  const session = await getCurrentSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) return { success: false, error: "Sin permisos" };
  try {
    let equipment;

    // Si tiene un ID real, lo actualizamos
    if (data.id && data.id !== "") {
      equipment = await prisma.equipment.update({
        where: { id: data.id },
        data: {
          name: data.name,
          type: data.type,
          room: data.room,
          anydeskId: data.anydeskId,
          ipAddress: data.ipAddress,
          tailscaleIp: data.tailscaleIp || null,
        }
      });
    } else {
      equipment = await prisma.equipment.create({
        data: {
          branchId: data.branchId,
          name: data.name,
          type: data.type,
          room: data.room,
          anydeskId: data.anydeskId,
          ipAddress: data.ipAddress,
          tailscaleIp: data.tailscaleIp || null,
        }
      });
    }

    revalidatePath("/admin/sedes");
    return { success: true, equipment };
  } catch (error) {
    console.error("Error saving equipment:", error);
    return { success: false, error: "Error interno al guardar el equipo" };
  }
}

// ELIMINAR EQUIPO
export async function deleteEquipment(id: string) {
  const session = await getCurrentSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) return { success: false, error: "Sin permisos" };
  try {
    await prisma.equipment.delete({ where: { id } });
    revalidatePath("/admin/sedes");
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se pudo eliminar" };
  }
}