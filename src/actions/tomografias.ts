"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/actions/auth"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { revalidatePath } from "next/cache"
import { startOfDateAR, endOfDateAR } from "@/lib/dates"
import { updateOrderStatusAction } from "@/actions/orders"
import { markAsDelivered, markAsDelayed } from "@/actions/deliveries"

export { updateOrderStatusAction, markAsDelivered, markAsDelayed }

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

// Filtro de órdenes con procedimientos de tomografía (código 09.03.x o nombre TC3D)
export async function getTomografias(filters: {
  branchId?: string
  startDate?: string
  endDate?: string
  deliveryStartDate?: string
  deliveryEndDate?: string
  search?: string
  sortBy?: 'createdAt' | 'deliveryDate'
  sortDir?: 'asc' | 'desc'
}) {
  const session = await getCurrentSession()
  if (!session) return { success: false, orders: [] }
  try {
    const where: any = {
      status: { not: 'ANULADA' },
      items: {
        some: {
          procedure: {
            OR: [
              { code: { startsWith: '09.03' } },
              { name: { startsWith: 'TC3D' } },
            ],
          },
        },
      },
    }
    if (filters.branchId && filters.branchId !== 'ALL') where.branchId = filters.branchId
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = startOfDateAR(filters.startDate)
      if (filters.endDate) where.createdAt.lte = endOfDateAR(filters.endDate)
    }
    if (filters.deliveryStartDate || filters.deliveryEndDate) {
      where.tomografiaData = { deliveryDate: {} }
      if (filters.deliveryStartDate) where.tomografiaData.deliveryDate.gte = startOfDateAR(filters.deliveryStartDate)
      if (filters.deliveryEndDate) where.tomografiaData.deliveryDate.lte = endOfDateAR(filters.deliveryEndDate)
    }
    if (filters.search?.trim()) {
      const s = filters.search.trim()
      where.OR = [
        { patient: { lastName: { contains: s, mode: 'insensitive' } } },
        { patient: { firstName: { contains: s, mode: 'insensitive' } } },
        { patient: { dni: { contains: s } } },
        { code: { contains: s, mode: 'insensitive' } },
      ]
    }

    const sortBy = filters.sortBy ?? 'createdAt'
    const sortDir = filters.sortDir ?? 'desc'
    const orderBy: any = sortBy === 'deliveryDate'
      ? { tomografiaData: { deliveryDate: sortDir } }
      : { createdAt: sortDir }

    const orders = await prisma.order.findMany({
      where,
      include: {
        patient: true,
        branch: true,
        dentist: true,
        items: { include: { procedure: true } },
        payments: true,
        tomografiaData: true,
      },
      orderBy,
      take: 300,
    })
    return { success: true, orders }
  } catch (error) {
    console.error('getTomografias error:', error)
    return { success: false, orders: [] }
  }
}

export async function uploadTomoFile(formData: FormData) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  const file = formData.get('file') as File | null
  const orderId = formData.get('orderId') as string
  const tipo = (formData.get('tipo') as string) || 'study' // 'study' | 'derivacion'
  const customName = (formData.get('customName') as string | null)?.trim() || ''
  if (!file || !orderId) return { success: false, error: "Datos inválidos" }
  if (file.size > 50 * 1024 * 1024) return { success: false, error: "El archivo supera 50 MB" }
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!ALLOWED.includes(file.type)) return { success: false, error: "Solo JPG, PNG, WebP o PDF" }
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    // Use custom name (if provided) as the display name while preserving extension
    const ext = file.name.match(/\.[^.]+$/)?.[0] || ''
    const displayName = customName
      ? customName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ._-]/g, '_').trim() + (ext && !customName.toLowerCase().endsWith(ext.toLowerCase()) ? ext : '')
      : file.name
    const cleanName = displayName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `tomografias/${orderId}/${crypto.randomUUID()}-${cleanName}`
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))
    let baseUrl = process.env.R2_PUBLIC_URL!
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
    const publicUrl = `${baseUrl}/${key}`
    await prisma.tomografiaData.upsert({
      where: { orderId },
      create: {
        orderId,
        ...(tipo === 'derivacion' ? { derivacionFiles: [publicUrl] } : { studyFiles: [publicUrl] }),
      },
      update: tipo === 'derivacion'
        ? { derivacionFiles: { push: publicUrl } }
        : { studyFiles: { push: publicUrl } },
    })
    revalidatePath('/tomografias')
    return { success: true, url: publicUrl, fileName: displayName, fileType: file.type }
  } catch (error) {
    console.error('uploadTomoFile error:', error)
    return { success: false, error: "Error al subir archivo" }
  }
}

export async function removeTomoFile(orderId: string, fileUrl: string, tipo: 'study' | 'derivacion') {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  try {
    const data = await prisma.tomografiaData.findUnique({ where: { orderId } })
    if (!data) return { success: false, error: "No encontrado" }
    const update = tipo === 'derivacion'
      ? { derivacionFiles: data.derivacionFiles.filter((f: string) => f !== fileUrl) }
      : { studyFiles: data.studyFiles.filter((f: string) => f !== fileUrl) }
    await prisma.tomografiaData.update({ where: { orderId }, data: update })
    revalidatePath('/tomografias')
    return { success: true }
  } catch {
    return { success: false, error: "Error al eliminar archivo" }
  }
}

export async function addTomoLink(orderId: string, link: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  if (!link.startsWith('http')) return { success: false, error: "URL inválida (debe empezar con http)" }
  try {
    await prisma.tomografiaData.upsert({
      where: { orderId },
      create: { orderId, studyLinks: [link] },
      update: { studyLinks: { push: link } },
    })
    revalidatePath('/tomografias')
    return { success: true }
  } catch {
    return { success: false, error: "Error al agregar link" }
  }
}

export async function removeTomoLink(orderId: string, link: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  try {
    const data = await prisma.tomografiaData.findUnique({ where: { orderId } })
    if (!data) return { success: false, error: "No encontrado" }
    await prisma.tomografiaData.update({
      where: { orderId },
      data: { studyLinks: data.studyLinks.filter((l: string) => l !== link) },
    })
    revalidatePath('/tomografias')
    return { success: true }
  } catch {
    return { success: false, error: "Error al eliminar link" }
  }
}

export async function saveReportHtml(orderId: string, html: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  try {
    await prisma.tomografiaData.upsert({
      where: { orderId },
      create: { orderId, reportHtml: html },
      update: { reportHtml: html },
    })
    revalidatePath('/tomografias')
    return { success: true }
  } catch {
    return { success: false, error: "Error al guardar informe" }
  }
}

export async function deleteReport(orderId: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  try {
    await prisma.tomografiaData.update({
      where: { orderId },
      data: { reportHtml: null, reportPdfUrl: null, reportGeneratedAt: null },
    })
    revalidatePath('/tomografias')
    return { success: true }
  } catch {
    return { success: false, error: "Error al eliminar informe" }
  }
}

export async function saveReportPdf(orderId: string, formData: FormData) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  const pdfFile = formData.get('pdf') as File | null
  if (!pdfFile) return { success: false, error: "PDF no recibido" }
  try {
    const bytes = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const key = `tomografias/${orderId}/informe-${Date.now()}.pdf`
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    }))
    let baseUrl = process.env.R2_PUBLIC_URL!
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
    const pdfUrl = `${baseUrl}/${key}`
    await prisma.tomografiaData.upsert({
      where: { orderId },
      create: { orderId, reportPdfUrl: pdfUrl, reportGeneratedAt: new Date() },
      update: { reportPdfUrl: pdfUrl, reportGeneratedAt: new Date() },
    })
    revalidatePath('/tomografias')
    return { success: true, pdfUrl }
  } catch (error) {
    console.error('saveReportPdf error:', error)
    return { success: false, error: "Error al guardar PDF" }
  }
}

export async function updateDeliveryDate(orderId: string, deliveryDate: string | null) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: "No autenticado" }
  try {
    const date = deliveryDate ? new Date(deliveryDate) : null
    await prisma.tomografiaData.upsert({
      where: { orderId },
      create: { orderId, deliveryDate: date },
      update: { deliveryDate: date },
    })
    revalidatePath('/tomografias')
    return { success: true }
  } catch {
    return { success: false, error: "Error al guardar fecha" }
  }
}

// Para el portal del paciente/dentista: obtener datos tomo de una orden
export async function getTomoDataForOrder(orderId: string) {
  try {
    return await prisma.tomografiaData.findUnique({ where: { orderId } })
  } catch {
    return null
  }
}
