"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import { getDentistSession } from "@/lib/session"

const PROMPT = `Sos un asistente especializado en descripción de imágenes radiológicas odontológicas.
Analizá objetivamente la imagen y describí:
- Estructuras dentales y óseas visibles
- Zonas de mayor o menor densidad radiológica
- Tejidos blandos observables
- Cualquier hallazgo o área de interés visible

Sé conciso pero completo. Escribí en español. No emitas diagnóstico clínico ni recomendaciones de tratamiento.
Finalizá siempre con: "⚠️ Este análisis es orientativo y no reemplaza el criterio clínico del profesional."`

export async function analyzeImageWithAI(imageUrl: string): Promise<{ success: boolean; analysis?: string; error?: string }> {
  const session = await getDentistSession()
  if (!session) return { success: false, error: "No autorizado" }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { success: false, error: "API de IA no configurada. Agregá GEMINI_API_KEY en las variables de entorno." }

  try {
    // Fetch the image and convert to base64
    const imgResponse = await fetch(imageUrl)
    if (!imgResponse.ok) throw new Error(`No se pudo obtener la imagen (HTTP ${imgResponse.status})`)

    const arrayBuffer = await imgResponse.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const mimeType = imgResponse.headers.get("content-type") || "image/jpeg"

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent([
      PROMPT,
      { inlineData: { data: base64, mimeType } }
    ])

    const analysis = result.response.text()
    return { success: true, analysis }
  } catch (error: any) {
    const msg = error?.message || String(error)
    console.error("Gemini error:", msg)
    // Devolvemos el mensaje real para facilitar el diagnóstico
    return { success: false, error: msg }
  }
}
