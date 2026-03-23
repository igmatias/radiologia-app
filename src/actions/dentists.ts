"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function importDentistsAction(data: any[]) {
  try {
    // Usamos una transacción para procesar todos los registros juntos
    const operations = data.map((d) => {
      // Función auxiliar para buscar columnas ignorando mayúsculas/minúsculas y espacios
      const getVal = (names: string[]) => {
        const key = Object.keys(d).find(k => names.includes(k.trim()));
        return key ? d[key]?.toString().trim() : null;
      };

      const lastName = getVal(["Apellido", "APELLIDO"]) || "SIN APELLIDO";
      const firstName = getVal(["Nombre", "NOMBRE"]) || "SIN NOMBRE";

      // Usamos create porque en el CSV no tenemos IDs fijos
      return prisma.dentist.create({
        data: {
          lastName,
          firstName,
          matriculaProv: getVal(["Matricula Provincial", "Matrícula Provincial", "Matricula"]),
          matriculaNac: getVal(["Matricula Nacional", "Matrícula Nacional"]),
          email: getVal(["E-Mail", "Email", "Mail"]),
          resultPreference: getVal(["Prefiere recibir los resultados de manera", "Preferencia"]) || "Ambas",
          deliveryMethod: getVal(["Medio Envio", "Medio de Envio", "Envio"]) || "WhatsApp",
          isActive: true
        }
      });
    });

    await prisma.$transaction(operations);

    revalidatePath("/admin/dentistas");
    revalidatePath("/recepcion");
    
    return { success: true, count: data.length };
  } catch (error: any) {
    console.error("Error importando odontólogos:", error);
    
    if (error.code === 'P2002') {
      return { success: false, error: "Existen registros duplicados en el archivo." };
    }
    
    return { success: false, error: "No se pudo procesar el archivo. Revisa el formato." };
  }
}

export async function deleteDentist(id: string) {
  try {
    await prisma.dentist.delete({
      where: { id }
    });
    revalidatePath("/admin/dentistas");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando:", error);
    throw new Error("No se pudo eliminar el profesional");
  }
}

export async function cleanDuplicateDentists() {
  try {
    // Buscamos todos los odontólogos
    const allDentists = await prisma.dentist.findMany();
    const seen = new Set();
    const toDelete = [];

    for (const d of allDentists) {
      const identifier = `${d.firstName?.trim()}-${d.lastName?.trim()}`.toLowerCase();
      if (seen.has(identifier)) {
        toDelete.push(d.id);
      } else {
        seen.add(identifier);
      }
    }

    if (toDelete.length > 0) {
      await prisma.dentist.deleteMany({
        where: { id: { in: toDelete } }
      });
    }
    
    revalidatePath("/admin/dentistas");
    return { success: true, deletedCount: toDelete.length };
  } catch (error) {
    return { success: false, error: "No se pudo limpiar" };
  }
}

export async function updateDentistAction(id: string, data: any) {
  try {
    await prisma.dentist.update({
      where: { id },
      data: {
        lastName: data.lastName?.trim(),
        firstName: data.firstName?.trim(),
        matriculaProv: data.matriculaProv,
        matriculaNac: data.matriculaNac,
        email: data.email,
        resultPreference: data.resultPreference,
        deliveryMethod: data.deliveryMethod,
      }
    });
    
    revalidatePath("/admin/dentistas");
    revalidatePath("/recepcion"); // Para que Nacho también vea los cambios al instante
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar:", error);
    return { success: false, error: "No se pudo actualizar el profesional" };
  }
}