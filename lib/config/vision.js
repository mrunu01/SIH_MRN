/**
 * Irisathenas Band — Optical Metrology Engine Configuration
 * 
 * Loaded automatically from .env.local (locally) or Render Environment (in production).
 * Keeps keys safe from GitHub push protection.
 */

export const VISION_API_KEY = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || ''

// Model settings (pre-configured)
export const GROQ_MODEL = 'llama-3.2-11b-vision-preview'
export const GEMINI_MODEL = 'gemini-1.5-flash'
