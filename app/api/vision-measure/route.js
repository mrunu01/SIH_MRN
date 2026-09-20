import { NextResponse } from 'next/server'
import { VISION_API_KEY, GROQ_MODEL, GEMINI_MODEL } from '@/lib/config/vision'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Allow up to 30s timeout on serverless if needed

const SYSTEM_VISION_PROMPT = `You are an expert optical metrology instrument reader and analytical chemist.
Analyze this image of an Irisathenas Band passive dosimetry wristband badge.

Visual Structure of the Badge:
1. Watch Face / Display: Inside the watch dial are 3 horizontal chemical reaction strips stacked vertically.
2. Common Length Scale: Printed underneath the strips at the bottom is a common millimeter length scale with markings: 0, 5, 10, 15, 20, 25, 30, up to 50 mm.
3. Strip 1 (Top): "High Humident" (H2S dose channel). The chemical shifts color from purple (unreacted Cu-PAN) to yellow/amber (reacted H-PAN).
4. Strip 2 (Middle): "Low Humident" (ambient humidity correction channel).
5. Strip 3 (Bottom, directly above ruler): "Integrity" poka-yoke strip. Default status is PASS unless stained/broken.

Your task:
- Locate the printed millimeter numbers (0, 5, 10, 15, 20, 25, 30, ...) on the common length scale at the bottom of the dial.
- Strip 1: Look at where the reacted yellow/amber front meets the unreacted purple. Project vertically down to the printed ruler scale and read the exact millimeter value (between 0.0 and 50.0 mm).
- Strip 2: Look at the reaction front for Low Humident. Project vertically down to the ruler and read the exact millimeter value (between 0.0 and 50.0 mm).
- Strip 3: Project to the ruler and read the length in millimeters. Determine if integrity status is "PASS" or "FAIL".
- Tilt: Estimate the tilt angle of the watch face in degrees (-90 to +90, where 0 is level).

You MUST respond ONLY with a valid JSON object matching this exact schema:
{
  "laneA_mm": <number between 0.0 and 50.0>,
  "laneB_mm": <number between 0.0 and 50.0>,
  "laneR_mm": <number between 0.0 and 50.0>,
  "integrity_status": "PASS" or "FAIL",
  "tilt_angle_deg": <number between -90.0 and 90.0>,
  "confidence": <number between 0.5 and 1.0>,
  "notes": "<short note explaining the ruler reading observed>"
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
 * Call Groq Cloud Vision (llama-3.2-11b-vision-preview)
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
      model: 'llama-3.2-11b-vision-preview',
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
      temperature: 0.1,
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

  return JSON.parse(content)
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
