"use server"

import OpenAI from "openai"
import { getDentistSession } from "@/lib/session"
import { isAiAnalysisEnabled } from "@/actions/settings"

const PROMPT = `Actúa como un Consultor Senior en Radiología Dental. Tu misión es realizar un análisis clínico profundo y detallado de la imagen proporcionada, manteniendo un tono estrictamente profesional y constructivo.

DIRECTRICES DE COMUNICACIÓN:

Enfoque Clínico Directo: No realices comentarios, críticas ni observaciones sobre la técnica de toma, la calidad de la imagen, la exposición o el posicionamiento. Asume que la calidad es la adecuada para el análisis y concéntrate exclusivamente en el contenido anatómico y patológico.

Lenguaje de Especialidad: Utiliza terminología técnica avanzada (ej. trabeculado óseo, densidades mixtas, relación con el canal mandibular, neumatización de senos, etc.).

Análisis de Evidencia: Describe con precisión lo que es visible. Si una zona requiere mayor detalle, sugiérelo como un "paso clínico siguiente" (ej: "Se recomienda complementar con CBCT para visualización 3D") en lugar de mencionar limitaciones de la imagen actual.

ESTRUCTURA DEL INFORME:

## Hallazgos Anatómicos
Descripción de las estructuras presentes (maxilar, mandíbula, ATM, senos paranasales) y su estado general.

## Evaluación de Tejidos Duros
Estado del reborde alveolar, densidad ósea y presencia de hallazgos particulares (si hay implantes, restos radiculares o tratamientos previos).

## Caracterización de Anomalías
Si detectas una lesión o variante anatómica, detallá su localización exacta, apariencia (radiolúcida/radiopaca) y relación con estructuras nobles (nervios, senos, fosas).

## Hipótesis Diagnósticas
Presentá diagnósticos diferenciales ordenados por relevancia clínica.

## Sugerencias de Seguimiento
Recomendaciones para el profesional remitente.

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
          role: "system",
          content: "Sos un asistente de radiología dental integrado en un sistema de gestión clínica profesional. Tu función es asistir a odontólogos y especialistas en la descripción técnica de imágenes radiológicas. Siempre respondés en español con terminología clínica apropiada."
        },
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
