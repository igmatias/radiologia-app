"use server"

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/actions/auth"

// Conectamos nuestra app con Cloudflare R2
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function getPresignedUrl(fileName: string, contentType: string, orderId: string) {
  // Fix — verificar sesion antes de generar firma S3
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }

  try {
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
      console.error("[R2] Variables de entorno faltantes:", {
        R2_ENDPOINT: !!process.env.R2_ENDPOINT,
        R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME,
        R2_PUBLIC_URL: !!process.env.R2_PUBLIC_URL,
      })
      return { success: false, error: "Almacenamiento no configurado. Contactá al administrador." }
    }
    // Fix — crypto.randomUUID() en vez de Date.now() para evitar colisiones
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${orderId}/${crypto.randomUUID()}-${cleanFileName}`

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: uniqueFileName,
      ContentType: contentType,
    })

    // Generamos un link temporal (válido por 1 hora) para subir el archivo
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })

    // Armamos la URL pública final donde se va a poder ver la placa
    let baseUrl = process.env.R2_PUBLIC_URL!
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
    const publicUrl = `${baseUrl}/${uniqueFileName}`

    return { success: true, signedUrl, publicUrl }
  } catch (error) {
    console.error("Error al generar firma S3:", error)
    return { success: false, error: "No se pudo conectar con el servidor de imágenes" }
  }
}

// Esta función anota el link público en la historia clínica (la Orden)
export async function saveImageToOrder(orderId: string, publicUrl: string, label?: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { imageMetadata: true } })
    const meta = (order?.imageMetadata as Record<string, string> | null) ?? {}
    if (label) meta[publicUrl] = label

    await prisma.order.update({
      where: { id: orderId },
      data: {
        images: { push: publicUrl },
        imageMetadata: meta
      }
    })
    revalidatePath("/tecnico")
    revalidatePath("/entregas")
    return { success: true }
  } catch (error) {
    console.error("Error al guardar imagen en DB:", error)
    return { success: false, error: "No se pudo guardar la placa en la base de datos" }
  }
}

export async function updateImageLabel(orderId: string, imageUrl: string, label: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { imageMetadata: true } })
    const meta = (order?.imageMetadata as Record<string, string> | null) ?? {}
    if (label.trim()) {
      meta[imageUrl] = label.trim()
    } else {
      delete meta[imageUrl]
    }
    await prisma.order.update({ where: { id: orderId }, data: { imageMetadata: meta } })
    revalidatePath("/tecnico")
    revalidatePath("/entregas")
    return { success: true }
  } catch (error) {
    return { success: false, error: "No se pudo actualizar la etiqueta" }
  }
}

export async function deleteImageFromOrder(orderId: string, imageUrl: string) {
  // Fix — verificar sesion
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }

  try {
    // 1. Buscamos la orden actual
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { images: true }
    });

    if (!order) throw new Error("Orden no encontrada");

    // 2. Filtramos el array para quitar la URL que queremos borrar
    const updatedImages = order.images.filter(img => img !== imageUrl);

    // 3. Actualizamos la orden en la base de datos
    await prisma.order.update({
      where: { id: orderId },
      data: { images: updatedImages }
    });

    // 4. Refrescamos la ruta para que desaparezca de la pantalla
    revalidatePath("/tecnico");
    revalidatePath("/entregas");

    return { success: true };
  } catch (error) {
    console.error("Error al borrar imagen:", error);
    return { success: false, error: "No se pudo eliminar la imagen." };
  }
}

// Esta función recibe el archivo directamente desde el cliente (FormData)
// Lo sube a Cloudflare R2 y guarda el link en la orden de Prisma
export async function uploadDelayedImage(formData: FormData) {
  // Fix — verificar sesion
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }

  try {
    const file = formData.get("file") as File;
    const orderId = formData.get("orderId") as string;
    const label = formData.get("label") as string | null;

    if (!file || !orderId) {
      return { success: false, error: "Faltan datos del archivo o la orden." };
    }

    // 1. Convertimos el archivo a Buffer para que AWS-SDK lo entienda
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Fix — crypto.randomUUID() en vez de Date.now()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${orderId}/diferido-${crypto.randomUUID()}-${cleanFileName}`;

    // 3. Subimos directamente a R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3.send(command);

    // 4. Armamos la URL pública
    let baseUrl = process.env.R2_PUBLIC_URL!;
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const publicUrl = `${baseUrl}/${uniqueFileName}`;

    // 5. Guardamos en la base de datos
    const orderData = await prisma.order.findUnique({ where: { id: orderId }, select: { imageMetadata: true } })
    const meta = (orderData?.imageMetadata as Record<string, string> | null) ?? {}
    if (label) meta[publicUrl] = label

    await prisma.order.update({
      where: { id: orderId },
      data: { images: { push: publicUrl }, imageMetadata: meta }
    });

    // 6. Refrescamos las vistas para que aparezca la imagen al instante
    revalidatePath("/entregas");
    revalidatePath("/tecnico");

    return { success: true, url: publicUrl };

  } catch (error) {
    console.error("Error en uploadDelayedImage:", error);
    return { success: false, error: "Hubo un problema al subir la imagen al servidor." };
  }
}

export async function saveExternalLinkToOrder(orderId: string, link: string) {
  // Fix — verificar sesion
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }

  // Fix — validacion de URL: solo se aceptan URLs https://
  try {
    const parsed = new URL(link)
    if (parsed.protocol !== 'https:') {
      return { success: false, error: "Solo se permiten enlaces HTTPS." }
    }
  } catch {
    return { success: false, error: "El enlace no es una URL válida." }
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { externalLink: link }
    })
    revalidatePath("/tecnico")
    revalidatePath("/entregas")
    return { success: true }
  } catch (error: any) {
    console.error("Error al guardar link:", error)
    return { success: false, error: "No se pudo guardar el enlace." }
  }
}
