"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { getIronSession } from "iron-session"
import bcrypt from "bcryptjs"
import { dentistSessionOptions, type DentistSessionData } from "@/lib/session"
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit"

// 1. FUNCIÓN PARA INICIAR SESIÓN
export async function loginDentist(matricula: string, pass: string) {
  const rateCheck = checkRateLimit(`dentist:${matricula}`);
  if (rateCheck.limited) {
    return {
      success: false,
      error: `Demasiados intentos fallidos. Intentá de nuevo en ${Math.ceil(rateCheck.retryAfterSeconds! / 60)} minutos.`,
    };
  }

  try {
    const dentist = await prisma.dentist.findFirst({
      where: {
        OR: [
          { matriculaProv: matricula },
          { matriculaNac: matricula }
        ]
      }
    });

    if (!dentist) {
      return { success: false, error: "No se encontró ningún profesional con esa matrícula." };
    }

    // Si no tiene password seteada, la clave por defecto es el apellido
    let passwordValid = false;
    if (!dentist.password) {
      // Clave por defecto: apellido (solo si mustChangePassword es true)
      passwordValid = dentist.mustChangePassword && dentist.lastName.toLowerCase() === pass.toLowerCase();
    } else {
      passwordValid = await bcrypt.compare(pass, dentist.password);
    }

    if (!passwordValid) {
      return { success: false, error: "Contraseña incorrecta." };
    }

    clearRateLimit(`dentist:${matricula}`);

    if (dentist.mustChangePassword) {
      return { success: true, requirePasswordChange: true, dentistId: dentist.id };
    }

    const cookieStore = await cookies();
    const session = await getIronSession<DentistSessionData>(cookieStore, dentistSessionOptions);
    session.dentistId = dentist.id;
    await session.save();

    return { success: true, requirePasswordChange: false };
  } catch (error) {
    console.error("Error en login médico:", error);
    return { success: false, error: "Ocurrió un error en el servidor." };
  }
}

// 2. FUNCIÓN PARA CAMBIAR LA CLAVE (PRIMER INGRESO)
export async function changeDentistPassword(dentistId: string, newPassword: string) {
  try {
    await prisma.dentist.update({
      where: { id: dentistId },
      data: {
        password: await bcrypt.hash(newPassword, 12),
        mustChangePassword: false,
      },
    });

    const cookieStore = await cookies();
    const session = await getIronSession<DentistSessionData>(cookieStore, dentistSessionOptions);
    session.dentistId = dentistId;
    await session.save();

    return { success: true };
  } catch (error) {
    console.error("Error al cambiar password:", error);
    return { success: false, error: "No se pudo actualizar la contraseña." };
  }
}

// 3. FUNCIÓN PARA CERRAR SESIÓN DEL MÉDICO
export async function logoutDentist() {
  const cookieStore = await cookies();
  const session = await getIronSession<DentistSessionData>(cookieStore, dentistSessionOptions);
  session.destroy();
  return { success: true };
}

export async function uploadDentistBannerAction(dentistId: string, formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file || !file.size) return { success: false, error: 'No se recibió imagen' }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) return { success: false, error: 'Formato no permitido. Usá JPG, PNG o WebP.' }
    if (file.size > 2 * 1024 * 1024) return { success: false, error: 'La imagen no puede superar 2 MB.' }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = `banners/${dentistId}/${crypto.randomUUID()}-${cleanName}`

    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
    const s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      }
    })

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))

    let baseUrl = process.env.R2_PUBLIC_URL!
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
    const bannerUrl = `${baseUrl}/${key}`

    await prisma.dentist.update({ where: { id: dentistId }, data: { bannerUrl } })
    return { success: true, bannerUrl }
  } catch (error) {
    console.error('Error subiendo banner:', error)
    return { success: false, error: 'No se pudo subir la imagen' }
  }
}

export async function updateDentistProfile(dentistId: string, data: any) {
  try {
    await prisma.dentist.update({
      where: { id: dentistId },
      data: {
        phone: data.phone,
        email: data.email,
        deliveryMethod: data.deliveryMethod,
        resultPreference: data.resultPreference,
        ...(data.firstName  ? { firstName:    data.firstName.trim()  } : {}),
        ...(data.lastName   ? { lastName:     data.lastName.trim()   } : {}),
        ...(data.matriculaProv !== undefined ? { matriculaProv: data.matriculaProv || null } : {}),
        ...(data.matriculaNac  !== undefined ? { matriculaNac:  data.matriculaNac  || null } : {}),
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    return { success: false };
  }
}
