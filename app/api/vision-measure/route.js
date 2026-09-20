import { NextResponse } from 'next/server'
import { VISION_API_KEY, GROQ_MODEL, GEMINI_MODEL } from '@/lib/config/vision'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const SYSTEM_VISION_PROMPT = `You are an expert optical measurement reader for passive H₂S dosimetry badges.

This image shows a wristwatch-style badge with a dial/face containing:
- Three horizontal colored strips (bars) stacked vertically, labeled A, B, R (top to bottom)
- A printed millimeter ruler scale at the bottom of the dial (marked 0, 5, 10, 15, 20, 25, 30 mm or up to 50 mm)

Each strip contains a colored stain (purple/pink/orange gradient) that starts from the left edge (0 mm mark) and extends rightward to some point along the ruler.

YOUR TASK: For each strip, measure where the RIGHT EDGE (leading front) of the colored stain falls on the mm ruler.

MEASUREMENT PROCEDURE:
1. Look at Strip A (top, labeled "High Humident" or "A"): Find where the colored region ends. Project straight down to the ruler. Read the mm value.
2. Look at Strip B (middle, labeled "Low Humident" or "B"): Find where the colored region ends. Project straight down to the ruler. Read the mm value.
3. Look at Strip R (bottom, labeled "Integrity" or "R"): Find where the colored region ends. Project straight down to the ruler. Read the mm value. If this strip has NO color/stain at all (completely white/blank), report 0.0 mm.

CRITICAL RULES:
- Read the ACTUAL ruler tick marks visible in the image. Do NOT guess or hallucinate values.
- Each mm on the ruler corresponds to a printed tick mark. Count the ticks carefully.
- If a strip's stain front falls BETWEEN two tick marks, interpolate (e.g., 12.5 mm).
- For Strip R (Integrity): If there is ANY visible stain/color (length > 0 mm), set integrity_status to "FAIL".
  Only if Strip R is completely blank/white/unstained (0.0 mm), set integrity_status to "PASS".
- If the image is blank, has no strips, or is unreadable, set all values to 0.0 and confidence to 0.5.

Respond ONLY with valid JSON:
{
  "laneA_mm": <number 0.0 to 50.0>,
  "laneB_mm": <number 0.0 to 50.0>,
  "laneR_mm": <number 0.0 to 50.0>,
  "integrity_status": "PASS" or "FAIL",
  "tilt_angle_deg": 0.0,
  "confidence": <number 0.5 to 1.0>,
  "notes": "<brief explanation of how you read each strip against the ruler ticks>"
}`

export async function POST(req) {
  try {
    const body = await req.json()
    const { image, apiKey: clientApiKey } = body

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'NO_IMAGE', message: 'No image provided for analysis.' },
        { status: 400 }
      )
    }

    const apiKey = (VISION_API_KEY && VISION_API_KEY.trim()) ||
      process.env.GROQ_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GROQ_API_KEY ||
      (clientApiKey && clientApiKey.trim())

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_API_KEY',
          message: 'No Vision API key configured.',
        },
        { status: 400 }
      )
    }

    const isGroq = apiKey.startsWith('gsk_') || (!apiKey.startsWith('AIza') && process.env.GROQ_API_KEY)
    const isGemini = apiKey.startsWith('AIza')

    let parsedResult = null
    let providerName = 'groq'

    if (isGroq || (!isGemini && !apiKey.startsWith('AIza'))) {
      providerName = 'groq'
      parsedResult = await callGroqVision(apiKey, image)
    } else {
      providerName = 'gemini'
      parsedResult = await callGeminiVision(apiKey, image)
    }

    // Sanitize and clamp
    const laneA_mm = Math.max(0.0, Math.min(50.0, Math.round((parseFloat(parsedResult.laneA_mm) || 0.0) * 10) / 10))
    const laneB_mm = Math.max(0.0, Math.min(50.0, Math.round((parseFloat(parsedResult.laneB_mm) || 0.0) * 10) / 10))
    const laneR_mm = Math.max(0.0, Math.min(50.0, Math.round((parseFloat(parsedResult.laneR_mm) || 0.0) * 10) / 10))

    // Poka-yoke: Lane R MUST be 0 mm to pass
    const integrity_status = (laneR_mm <= 0.0 && parsedResult.integrity_status !== 'FAIL') ? 'PASS' : 'FAIL'

    const tilt_angle_deg = Math.max(-90, Math.min(90, Math.round((parseFloat(parsedResult.tilt_angle_deg) || 0.0) * 10) / 10))
    const confidence = Math.max(0.5, Math.min(1.0, parseFloat(parsedResult.confidence) || 0.85))

    return NextResponse.json({
      success: true,
      provider: providerName,
      measurements: {
        laneA_mm,
        laneB_mm,
        laneR_mm,
        integrity_status,
        tilt_angle_deg,
        confidence,
        notes: parsedResult.notes || `Read against printed ruler (${providerName})`,
      },
    })
  } catch (err) {
    console.error('Vision API error:', err)
    return NextResponse.json(
      {
        success: false,
        error: 'VISION_API_FAILED',
        message: err.message || 'Vision measurement failed. Check API key and try again.',
      },
      { status: 500 }
    )
  }
}

async function callGroqVision(apiKey, imageData) {
  const imageUrl = imageData.startsWith('data:')
    ? imageData
    : `data:image/jpeg;base64,${imageData}`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL || 'qwen/qwen3.8-27b',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: SYSTEM_VISION_PROMPT },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      temperature: 0.0,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Groq API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Groq returned empty response.')
  }

  // Handle potential thinking tags from Qwen
  let jsonContent = content
  // Remove <think>...</think> tags if present
  jsonContent = jsonContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  // Remove markdown code fences
  jsonContent = jsonContent.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()

  try {
    return JSON.parse(jsonContent)
  } catch (parseErr) {
    // Try to extract JSON from mixed content
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error(`Failed to parse Groq response as JSON: ${jsonContent.slice(0, 200)}`)
  }
}

async function callGeminiVision(apiKey, imageData) {
  let base64Data = imageData
  let mimeType = 'image/jpeg'

  if (imageData.startsWith('data:')) {
    const match = imageData.match(/^data:([^;]+);base64,(.+)$/)
    if (match) {
      mimeType = match[1]
      base64Data = match[2]
    }
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: SYSTEM_VISION_PROMPT + '\nRespond with JSON only.' },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!candidateText) {
    throw new Error('Gemini returned empty response.')
  }

  const cleanJson = candidateText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(cleanJson)
}
