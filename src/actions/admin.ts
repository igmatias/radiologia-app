'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/actions/auth"

async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session) return { error: "No autenticado" as const };
  if (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN') return { error: "Sin permisos" as const };
  return { session };
}

// 1. Actualizar o crear un precio para un estudio en una lista específica
export async function updateProcedurePrice(priceListId: string, procedureId: string, insuranceCoverage: number, patientCopay: number) {
  const auth = await requireAdmin(); if ('error' in auth) return { success: false, error: auth.error };
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
  const auth = await requireAdmin(); if ('error' in auth) return { success: false, error: auth.error };
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
  const auth = await requireAdmin(); if ('error' in auth) return { success: false, error: auth.error };
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

// 4. Actualizar solo el código personalizado de una práctica para una OS
export async function updatePriceCustomCode(priceListId: string, procedureId: string, customCode: string) {
  const auth = await requireAdmin(); if ('error' in auth) return { success: false, error: auth.error };
  try {
    await prisma.price.upsert({
      where: { priceListId_procedureId: { priceListId, procedureId } },
      update: { customCode: customCode.trim() || null },
      create: {
        priceListId,
        procedureId,
        amount: 0,
        insuranceCoverage: 0,
        patientCopay: 0,
        customCode: customCode.trim() || null
      }
    })
    revalidatePath("/admin/obras-sociales")
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar código:", error)
    return { success: false, error: "Error al guardar el código" }
  }
}

// 5. Actualizar edad máxima de ortodoncia para una Obra Social
export async function updateMaxAgeOrtodoncia(osId: string, maxAge: number | null) {
  const auth = await requireAdmin(); if ('error' in auth) return { success: false, error: auth.error };
  try {
    await prisma.obraSocial.update({
      where: { id: osId },
      data: { maxAgeOrtodoncia: maxAge }
    })
    revalidatePath("/admin/obras-sociales")
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar edad máxima:", error)
    return { success: false, error: "Error al guardar" }
  }
}

// 6. CRUD de variantes (sub-selecciones) de Obra Social
export async function createOSVariant(obraSocialId: string, name: string) {
  const auth = await requireAdmin(); if ('error' in auth) return { success: false, error: auth.error };
  try {
    await prisma.obraSocialVariant.create({ data: { obraSocialId, name: name.toUpperCase().trim() } })
    revalidatePath("/admin/obras-sociales")
    return { success: true }
  } catch (error) {
    console.error("Error al crear variante:", error)
    return { success: false, error: "Error al crear variante" }
  }
}

export async function deleteOSVariant(variantId: string) {
  const auth = await requireAdmin(); if ('error' in auth) return { success: false, error: auth.error };
  try {
    await prisma.obraSocialVariant.delete({ where: { id: variantId } })
    revalidatePath("/admin/obras-sociales")
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar variante:", error)
    return { success: false, error: "No se puede eliminar, tiene órdenes asociadas" }
  }
}

// 7. Actualizar día de cierre de una Obra Social
export async function updateObraSocialClosingDay(osId: string, closingDay: number | null) {
  const auth = await requireAdmin(); if ('error' in auth) return { success: false, error: auth.error };
  try {
    await prisma.obraSocial.update({
      where: { id: osId },
      data: { closingDay }
    })
    revalidatePath("/admin/obras-sociales")
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar día de cierre:", error)
    return { success: false, error: "Error al guardar" }
  }
}

// 8. CRUD de períodos de facturación
export async function createBillingPeriod(obraSocialId: string, name: string, startDate: string, endDate: string) {
  const auth = await requireAdmin(); if ('error' in auth) return { success: false, error: auth.error };
  try {
    const period = await prisma.billingPeriod.create({
      data: {
        obraSocialId,
        name: name.trim().toUpperCase(),
        startDate: new Date(startDate + "T00:00:00"),
        endDate: new Date(endDate + "T23:59:59"),
      }
    })
    revalidatePath("/admin/obras-sociales")
    return { success: true, period }
  } catch (error) {
    console.error("Error al crear período:", error)
    return { success: false, error: "Error al crear período" }
  }
}

export async function updateBillingPeriod(periodId: string, name: string, startDate: string, endDate: string) {
  const auth = await requireAdmin(); if ('error' in auth) return { success: false, error: auth.error };
  try {
    const period = await prisma.billingPeriod.update({
      where: { id: periodId },
      data: {
        name: name.trim().toUpperCase(),
        startDate: new Date(startDate + "T00:00:00"),
        endDate: new Date(endDate + "T23:59:59"),
      }
    })
    revalidatePath("/admin/obras-sociales")
    return { success: true, period }
  } catch (error) {
    console.error("Error al actualizar período:", error)
    return { success: false, error: "Error al actualizar período" }
  }
}

export async function deleteBillingPeriod(periodId: string) {
  const auth = await requireAdmin(); if ('error' in auth) return { success: false, error: auth.error };
  try {
    await prisma.billingPeriod.delete({ where: { id: periodId } })
    revalidatePath("/admin/obras-sociales")
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar período:", error)
    return { success: false, error: "Error al eliminar período" }
  }
}

// 9. Importación masiva de Odontólogos desde CSV
export async function importDentists(data: any[]) {
  const auth = await requireAdmin(); if ('error' in auth) return { success: false, error: auth.error };
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