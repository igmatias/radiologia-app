"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function getSetting(key: string): Promise<string | null> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } })
    return s?.value ?? null
  } catch { return null }
}

export async function setSetting(key: string, value: string): Promise<{ success: boolean }> {
  const session = await getSession()
  if (!session || !["ADMIN", "SUPERADMIN"].includes(session.role)) {
    return { success: false }
  }
  try {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })
    revalidatePath("/admin")
    return { success: true }
  } catch { return { success: false } }
}

export async function isAiAnalysisEnabled(): Promise<boolean> {
  const val = await getSetting("ai_analysis_enabled")
  // Habilitado por defecto si no hay setting
  return val === null ? true : val === "true"
}
