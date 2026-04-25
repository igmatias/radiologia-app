"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/actions/auth"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { revalidatePath } from "next/cache"

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function getActiveTemplate() {
  try {
    return await prisma.reportTemplate.findFirst({ where: { isActive: true } })
  } catch {
    return null
  }
}

export async function getAllTemplates() {
  const session = await getCurrentSession()
  if (!session) return []
  try {
    return await prisma.reportTemplate.findMany({ orderBy: { createdAt: 'desc' } })
  } catch {
    return []
  }
}

export async function saveTemplate(formData: FormData) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, error: "Sin permisos" }
  }
  const file = formData.get('file') as File | null
  const name = (formData.get('name') as string) || 'Template'
  const marginTop = parseInt(formData.get('marginTop') as string) || 113
  const marginLeft = parseInt(formData.get('marginLeft') as string) || 95
  const marginRight = parseInt(formData.get('marginRight') as string) || 95
  const marginBottom = parseInt(formData.get('marginBottom') as string) || 113
  const templateId = formData.get('templateId') as string | null

  try {
    let backgroundImageUrl: string | undefined
    if (file && file.size > 0) {
      const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
      if (!ALLOWED.includes(file.type)) return { success: false, error: "Solo JPG, PNG o WebP" }
      if (file.size > 10 * 1024 * 1024) return { success: false, error: "La imagen supera 10 MB" }
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const key = `templates/${crypto.randomUUID()}-${cleanName}`
      await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }))
      let baseUrl = process.env.R2_PUBLIC_URL!
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
      backgroundImageUrl = `${baseUrl}/${key}`
    }

    if (templateId) {
      await prisma.reportTemplate.update({
        where: { id: templateId },
        data: {
          name,
          ...(backgroundImageUrl ? { backgroundImageUrl } : {}),
          marginTop,
          marginLeft,
          marginRight,
          marginBottom,
        },
      })
    } else {
      await prisma.reportTemplate.create({
        data: { name, backgroundImageUrl: backgroundImageUrl ?? null, marginTop, marginLeft, marginRight, marginBottom },
      })
    }
    revalidatePath('/admin/tomografia-template')
    return { success: true }
  } catch (error) {
    console.error('saveTemplate error:', error)
    return { success: false, error: "Error al guardar template" }
  }
}

export async function setActiveTemplate(id: string) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, error: "Sin permisos" }
  }
  try {
    await prisma.reportTemplate.updateMany({ data: { isActive: false } })
    await prisma.reportTemplate.update({ where: { id }, data: { isActive: true } })
    revalidatePath('/admin/tomografia-template')
    return { success: true }
  } catch {
    return { success: false, error: "Error al activar template" }
  }
}

export async function deleteTemplate(id: string) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
    return { success: false, error: "Sin permisos" }
  }
  try {
    await prisma.reportTemplate.delete({ where: { id } })
    revalidatePath('/admin/tomografia-template')
    return { success: true }
  } catch {
    return { success: false, error: "Error al eliminar template" }
  }
}
