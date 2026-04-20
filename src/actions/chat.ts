"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/actions/auth"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

async function getSenderInfo() {
  const session = await getCurrentSession()
  if (!session) return null
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { branch: true },
  })
  return {
    session,
    senderName: user ? `${user.firstName} ${user.lastName}` : session.username,
    senderRole: session.role,
    branchName: user?.branch?.name ?? 'Administración',
    branchId: user?.branchId ?? null,
  }
}

export async function getMessages(channel = 'general') {
  const session = await getCurrentSession()
  if (!session) return { success: false, messages: [] }
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { toChannel: channel },
      orderBy: { createdAt: 'desc' },
      take: 60,
    })
    return { success: true, messages: messages.reverse() }
  } catch { return { success: false, messages: [] } }
}

export async function getNewMessages(afterId: string, channel = 'general') {
  const session = await getCurrentSession()
  if (!session) return { success: false, messages: [] }
  try {
    const after = await prisma.chatMessage.findUnique({ where: { id: afterId } })
    if (!after) return { success: true, messages: [] }
    const messages = await prisma.chatMessage.findMany({
      where: { toChannel: channel, createdAt: { gt: after.createdAt } },
      orderBy: { createdAt: 'asc' },
    })
    return { success: true, messages }
  } catch { return { success: false, messages: [] } }
}

export async function getLatestMessageId() {
  const session = await getCurrentSession()
  if (!session) return null
  try {
    const msg = await prisma.chatMessage.findFirst({ orderBy: { createdAt: 'desc' }, select: { id: true } })
    return msg?.id ?? null
  } catch { return null }
}

export async function sendMessage(content: string, channel = 'general') {
  const info = await getSenderInfo()
  if (!info) return { success: false, error: "No autenticado" }
  if (!content.trim()) return { success: false, error: "Mensaje vacío" }
  if (content.length > 2000) return { success: false, error: "Mensaje demasiado largo" }
  try {
    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        senderName: info.senderName,
        senderRole: info.senderRole,
        branchName: info.branchName,
        branchId: info.branchId,
        toChannel: channel,
      },
    })
    return { success: true, message }
  } catch { return { success: false, error: "Error al enviar mensaje" } }
}

export async function sendFileMessage(formData: FormData) {
  const info = await getSenderInfo()
  if (!info) return { success: false, error: "No autenticado" }

  const file = formData.get('file') as File | null
  const content = (formData.get('content') as string | null) ?? ''
  const channel = (formData.get('channel') as string | null) ?? 'general'

  if (!file) return { success: false, error: "No se recibió archivo" }
  if (file.size > 20 * 1024 * 1024) return { success: false, error: "El archivo supera 20 MB" }
  if (!process.env.R2_ENDPOINT || !process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL)
    return { success: false, error: "Almacenamiento no configurado" }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `chat/${crypto.randomUUID()}-${cleanName}`

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))

    let baseUrl = process.env.R2_PUBLIC_URL!
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
    const fileUrl = `${baseUrl}/${key}`

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim() || null,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        senderName: info.senderName,
        senderRole: info.senderRole,
        branchName: info.branchName,
        branchId: info.branchId,
        toChannel: channel,
      },
    })
    return { success: true, message }
  } catch (error) {
    console.error('Error al enviar archivo:', error)
    return { success: false, error: "Error al subir el archivo" }
  }
}
