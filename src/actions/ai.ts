"use server"

import Anthropic from "@anthropic-ai/sdk"
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

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { success: false, error: "API de IA no configurada. Agregá ANTHROPIC_API_KEY en las variables de entorno." }

  try {
    // Fetch the image and convert to base64
    const imgResponse = await fetch(imageUrl)
    if (!imgResponse.ok) throw new Error(`No se pudo obtener la imagen (HTTP ${imgResponse.status})`)

    const arrayBuffer = await imgResponse.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const contentType = imgResponse.headers.get("content-type") || "image/jpeg"
    // Anthropic accepts: image/jpeg, image/png, image/gif, image/webp
    const mediaType = (["image/jpeg","image/png","image/gif","image/webp"].includes(contentType)
      ? contentType
      : "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp"

    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 }
            },
            { type: "text", text: PROMPT }
          ]
        }
      ]
    })

    const analysis = message.content
      .filter(b => b.type === "text")
      .map(b => (b as any).text)
      .join("\n")

    return { success: true, analysis }
  } catch (error: any) {
    const msg = error?.message || String(error)
    console.error("Anthropic error:", msg)
    return { success: false, error: msg }
  }
}
