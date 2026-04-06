"use server"

import OpenAI from "openai"
import { getDentistSession } from "@/lib/session"

const PROMPT = `Sos un asistente de descripción de imágenes radiológicas odontológicas. Tu tarea es describir ÚNICAMENTE lo que es claramente visible en la imagen, sin inferir ni suponer estructuras que no estés seguro de ver.

Reglas estrictas:
- Describí solo lo que observás con certeza. Si algo no es claramente visible, no lo menciones.
- No asumas la presencia de piezas dentarias, hueso u otras estructuras si no las ves con claridad.
- Si la imagen es de baja calidad, angulada o incompleta, indicalo.
- Describí zonas de alta densidad (blanco/gris claro) y baja densidad (gris oscuro/negro) con precisión.
- Si observás alguna zona anómala, asimetría o área de densidad inusual, describila con detalle y ubicación.
- Sé preciso con la ubicación: superior/inferior, izquierda/derecha, zona anterior/posterior.
- Escribí en español, en tono técnico pero claro.
- No emitas diagnóstico ni recomendación de tratamiento.

Finalizá siempre con: "⚠️ Este análisis es orientativo y no reemplaza el criterio clínico del profesional."`

export async function analyzeImageWithAI(imageUrl: string): Promise<{ success: boolean; analysis?: string; error?: string }> {
  const session = await getDentistSession()
  if (!session) return { success: false, error: "No autorizado" }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { success: false, error: "API de IA no configurada. Agregá OPENAI_API_KEY en las variables de entorno." }

  try {
    const client = new OpenAI({ apiKey })

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: imageUrl, detail: "high" } }
          ]
        }
      ]
    })

    const analysis = response.choices[0]?.message?.content ?? ""
    return { success: true, analysis }

  } catch (error: any) {
    const msg = error?.message || String(error)
    console.error("OpenAI error:", msg)
    return { success: false, error: msg }
  }
}
