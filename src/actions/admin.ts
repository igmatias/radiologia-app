'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// 1. Actualizar o crear un precio para un estudio en una lista específica
export async function updateProcedurePrice(priceListId: string, procedureId: string, insuranceCoverage: number, patientCopay: number) {
  try {
    // Calculamos el total sumando la parte de la Obra Social + el Copago
    const totalAmount = insuranceCoverage + patientCopay;

    await prisma.price.upsert({
      where: {
        priceListId_procedureId: {
          priceListId,
          procedureId
        }
      },
      update: { 
        amount: totalAmount,
        insuranceCoverage: insuranceCoverage,
        patientCopay: patientCopay
      },
      create: {
        priceListId,
        procedureId,
        amount: totalAmount,
        insuranceCoverage: insuranceCoverage,
        patientCopay: patientCopay
      }
    })

    revalidatePath("/admin/obras-sociales")
    return { success: true }
  } catch (error) {
    console.error("Error updating price:", error)
    return { success: false, error: "Error interno al actualizar el precio" }
  }
}

// 2. Crear una nueva Obra Social con su propia lista de precios
export async function createObraSocial(name: string) {
  try {
    const newList = await prisma.priceList.create({
      data: { name: `Lista ${name}` }
    })

    await prisma.obraSocial.create({
      data: {
        name,
        priceListId: newList.id
      }
    })
    
    revalidatePath("/admin/obras-sociales")
    return { success: true }
  } catch (error) {
    console.error("Error al crear OS:", error)
    return { success: false }
  }
}

// 3. Eliminar una Obra Social (y su lista de precios si no tiene otras dependencias)
export async function deleteObraSocial(id: string) {
  try {
    const os = await prisma.obraSocial.findUnique({
      where: { id },
      select: { priceListId: true }
    })

    await prisma.obraSocial.delete({ where: { id } })
    
    if (os?.priceListId) {
      // Intentamos borrar la lista, si falla (porque otras OS la usan), no pasa nada
      try {
        await prisma.priceList.delete({ where: { id: os.priceListId } })
      } catch (e) {
        console.log("La lista de precios se mantiene porque está en uso.")
      }
    }

    revalidatePath("/admin/obras-sociales")
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar OS:", error)
    return { 
      success: false, 
      error: "No se puede eliminar porque tiene órdenes registradas." 
    }
  }
}

// 4. Importación masiva de Odontólogos desde CSV
export async function importDentists(data: any[]) {
  try {
    // Procesamos en bloque para mayor velocidad
    const operations = data.map((row) => {
      // Usamos la Matrícula Provincial como identificador único para evitar duplicados en la importación
      const mProv = row["Matricula Provincial"]?.toString() || "S/M";
      const mNac = row["Matricula Nacional"]?.toString() || "S/M";

      return prisma.dentist.upsert({
        where: { 
          // Si tu schema tiene la matriculaProv como unique, úsala aquí. 
          // Si no, upsert creará uno nuevo si no pasas ID.
          id: row.id || `import-${mProv}-${mNac}` 
        },
        update: {
          lastName: row.Apellido?.toString().toUpperCase().trim(),
          firstName: row.Nombre?.toString().toUpperCase().trim(),
          matriculaProv: mProv,
          matriculaNac: mNac,
          email: row["E-Mail"]?.toString().trim() || null,
          resultPreference: row["Prefiere recibir los resultados de manera"]?.toString().trim() || "DIGITAL",
          deliveryMethod: row["Medio Envio"]?.toString().trim() || "MAIL",
        },
        create: {
          lastName: row.Apellido?.toString().toUpperCase().trim(),
          firstName: row.Nombre?.toString().toUpperCase().trim(),
          matriculaProv: mProv,
          matriculaNac: mNac,
          email: row["E-Mail"]?.toString().trim() || null,
          resultPreference: row["Prefiere recibir los resultados de manera"]?.toString().trim() || "DIGITAL",
          deliveryMethod: row["Medio Envio"]?.toString().trim() || "MAIL",
        }
      })
    })

    await prisma.$transaction(operations)
    
    revalidatePath("/admin/odontologos")
    revalidatePath("/recepcion") // Revalidamos para que aparezcan en los Selects
    return { success: true }
  } catch (error) {
    console.error("Error crítico en importación:", error)
    return { success: false, error: "Error al procesar los datos del CSV" }
  }
}