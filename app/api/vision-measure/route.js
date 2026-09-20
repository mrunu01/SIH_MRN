import { NextResponse } from 'next/server'
import { VISION_API_KEY, GROQ_MODEL, GEMINI_MODEL } from '@/lib/config/vision'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Allow up to 30s timeout on serverless if needed

const SYSTEM_VISION_PROMPT = `You are a high-precision optical metrology instrument reader.
Look closely at the 3 horizontal strips inside the watch face and the millimeter ruler (0 to 30 mm / 50 mm common scale) directly below them.
Each strip has a colored gradient bar (purple to yellow) extending from the left starting mark (0 mm) to a specific point on the ruler.

Examine the right edge of each strip's gradient bar by projecting straight down to the printed ruler ticks:
1. Strip 1 (High Humident - Top Strip): Examine the right edge of this colored bar against the ruler ticks. (e.g. 15.0 mm).
2. Strip 2 (Low Humident - Middle Strip): Examine the right edge of this colored bar against the ruler ticks. (e.g. 10.0 mm).
3. Strip 3 (Integrity - Bottom Strip): Examine the right edge of this colored bar against the ruler ticks. (e.g. 20.0 mm).
4. Integrity status: PASS if the badge is intact and sealed, FAIL if compromised.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "laneA_mm": <number between 0.0 and 50.0>,
  "laneB_mm": <number between 0.0 and 50.0>,
  "laneR_mm": <number between 0.0 and 50.0>,
  "integrity_status": "PASS" or "FAIL",
  "tilt_angle_deg": 0.0,
  "confidence": <number between 0.5 and 1.0>,
  "notes": "<explain the millimeter tick reading for each strip>"
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

    // Determine API key: check lib/config/vision.js first, then environment variables, then client
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
          message: 'No Vision API key configured. Please provide a Groq or Gemini API key in settings or environment.',
        },
        { status: 400 }
      )
    }

    // Detect provider based on key format
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

    // Sanitize and clamp values to 0.0 - 50.0 mm
    const laneA_mm = Math.max(0.0, Math.min(50.0, Math.round((parseFloat(parsedResult.laneA_mm) || 0.0) * 10) / 10))
    const laneB_mm = Math.max(0.0, Math.min(50.0, Math.round((parseFloat(parsedResult.laneB_mm) || 0.0) * 10) / 10))
    const laneR_mm = Math.max(0.0, Math.min(50.0, Math.round((parseFloat(parsedResult.laneR_mm) || 0.0) * 10) / 10))
    const integrity_status = parsedResult.integrity_status === 'FAIL' ? 'FAIL' : 'PASS'
    const tilt_angle_deg = Math.max(-90, Math.min(90, Math.round((parseFloat(parsedResult.tilt_angle_deg) || 0.0) * 10) / 10))
    const confidence = Math.max(0.5, Math.min(1.0, parseFloat(parsedResult.confidence) || 0.95))

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
        notes: parsedResult.notes || `Read against common 0–50mm scale (${providerName})`,
      },
    })
  } catch (err) {
    console.error('Vision API error:', err)
    return NextResponse.json(
      {
        success: false,
        error: 'VISION_API_FAILED',
        message: err.message || 'Vision AI measurement failed',
      },
      { status: 500 }
    )
  }
}

/**
 * Call Groq Cloud Vision (qwen/qwen3.8-27b)
 */
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
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.0,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Groq API returned ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Groq returned empty response.')
  }

  const cleanJson = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(cleanJson)
}

/**
 * Call Google Gemini 1.5 Flash Vision API
 */
async function callGeminiVision(apiKey, imageData) {
  // Strip data:image/...;base64, prefix if present
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
    throw new Error(`Gemini API returned ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!candidateText) {
    throw new Error('Gemini returned empty response.')
  }

  // Clean markdown backticks if any
  const cleanJson = candidateText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(cleanJson)
}
