"use server"

import OpenAI from "openai"
import { getDentistSession } from "@/lib/session"
import { isAiAnalysisEnabled } from "@/actions/settings"

const PROMPT = `Sos un asistente especializado en descripción de imágenes radiológicas odontológicas. Describí con precisión lo que observás en la imagen.

Seguí esta estructura:

## Tipo de radiografía
Identificá el tipo (periapical, panorámica, bitewing, etc.) y la calidad técnica de la imagen.

## Estructuras presentes
Listá las estructuras claramente visibles: piezas dentarias (indicá número aproximado y ubicación), implantes, prótesis, materiales de restauración, hueso alveolar, seno maxilar, cóndilo, etc. No menciones estructuras que no veas con claridad.

## Análisis de densidades
- Zonas radiopacas (blanco/gris claro): describí qué estructuras las generan y su distribución
- Zonas radiolúcidas (gris oscuro/negro): describí con precisión cualquier área de menor densidad, especialmente en la periferia de raíces, implantes o hueso alveolar — esto es crítico
- Niveles óseos: evaluá el nivel de la cresta ósea alveolar y si hay signos de pérdida ósea

## Hallazgos relevantes
Describí cualquier hallazgo que se desvíe de lo normal:
- Zonas radiolúcidas periapicales o periimplantarias (posible reabsorción ósea)
- Asimetrías óseas
- Imágenes inusuales en seno maxilar, cóndilo u otras estructuras
- Materiales con apariencia irregular
Si no hay hallazgos anómalos evidentes, indicalo explícitamente.

Reglas:
- Describí solo lo que ves con certeza. Si algo es dudoso, indicalo como "posible" o "no concluyente".
- Sé específico con ubicaciones: superior/inferior, derecha/izquierda, sector anterior/posterior, número de pieza aproximado.
- Tono técnico en español.
- No emitas diagnóstico definitivo ni recomendación de tratamiento.

Finalizá siempre con: "⚠️ Este análisis es orientativo y no reemplaza el criterio clínico del profesional."`

export async function analyzeImageWithAI(imageUrl: string): Promise<{ success: boolean; analysis?: string; error?: string }> {
  const session = await getDentistSession()
  if (!session) return { success: false, error: "No autorizado" }

  const enabled = await isAiAnalysisEnabled()
  if (!enabled) return { success: false, error: "El análisis con IA está desactivado temporalmente." }

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
