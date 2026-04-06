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

// Helpers individuales — todos habilitados por defecto (null = true)
export async function isAiAnalysisEnabled(): Promise<boolean> {
  const val = await getSetting("ai_analysis_enabled")
  return val === null ? true : val === "true"
}

export async function isPatientPortalEnabled(): Promise<boolean> {
  const val = await getSetting("patient_portal_enabled")
  return val === null ? true : val === "true"
}

export async function isDoctorPortalEnabled(): Promise<boolean> {
  const val = await getSetting("doctor_portal_enabled")
  return val === null ? true : val === "true"
}

export async function isEmailNotificationsEnabled(): Promise<boolean> {
  const val = await getSetting("email_notifications_enabled")
  return val === null ? true : val === "true"
}

export async function isMaintenanceModeEnabled(): Promise<boolean> {
  const val = await getSetting("maintenance_mode")
  return val === "true"
}

// Carga todos los settings de sistema en una sola query
export async function getAllSystemSettings() {
  const keys = [
    "ai_analysis_enabled",
    "patient_portal_enabled",
    "doctor_portal_enabled",
    "email_notifications_enabled",
    "maintenance_mode"
  ]
  try {
    const rows = await prisma.setting.findMany({ where: { key: { in: keys } } })
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]))
    return {
      aiAnalysis:           map["ai_analysis_enabled"]          ?? "true",
      patientPortal:        map["patient_portal_enabled"]        ?? "true",
      doctorPortal:         map["doctor_portal_enabled"]         ?? "true",
      emailNotifications:   map["email_notifications_enabled"]   ?? "true",
      maintenanceMode:      map["maintenance_mode"]              ?? "false",
    }
  } catch {
    return { aiAnalysis: "true", patientPortal: "true", doctorPortal: "true", emailNotifications: "true", maintenanceMode: "false" }
  }
}
