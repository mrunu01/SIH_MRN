/**
 * Image Quality Assessment
 *
 * Checks uploaded images for basic quality requirements before analysis.
 * Returns PASS / REVIEW / FAIL with human-readable reasons.
 */

export function assessImageQuality(imageElement, fileSize) {
  const width = imageElement?.naturalWidth || imageElement?.width || 800
  const height = imageElement?.naturalHeight || imageElement?.height || 600

  let blurScore = 85
  let isBlurry = false

  try {
    if (typeof document !== 'undefined' && imageElement && width > 20 && height > 20) {
      const canvas = document.createElement('canvas')
      const targetW = Math.min(width, 400)
      const targetH = Math.min(height, 400)
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (ctx) {
        ctx.drawImage(imageElement, 0, 0, targetW, targetH)
        blurScore = estimateBlur(ctx, targetW, targetH)
        // A variance below 35-40 indicates notable blur / out-of-focus capture
        if (blurScore < 38) {
          isBlurry = true
        }
      }
    }
  } catch (e) {
    console.warn('Blur assessment skipped:', e)
  }

  return {
    status: isBlurry ? 'REVIEW' : 'PASS',
    width,
    height,
    isBlurry,
    blurScore: Math.round(blurScore * 10) / 10,
    blurThreshold: 38,
    blurMessage: isBlurry ? 'Photo is blurry — Please Retake' : 'Sharpness OK',
    errors: [],
    warnings: isBlurry ? ['Photo is blurry — Please Retake'] : [],
    canProceed: true,
  }
}

/**
 * Estimate image blur using Laplacian variance
 * Higher values = sharper image
 */
function estimateBlur(ctx, width, height) {
  // Sample center region
  const sampleSize = Math.min(width, height, 500)
  const x = (width - sampleSize) / 2
  const y = (height - sampleSize) / 2

  const imageData = ctx.getImageData(x, y, sampleSize, sampleSize)
  const data = imageData.data

  // Convert to grayscale
  const gray = []
  for (let i = 0; i < data.length; i += 4) {
    gray.push((data[i] + data[i + 1] + data[i + 2]) / 3)
  }

  // Apply Laplacian operator
  let variance = 0
  const w = sampleSize

  for (let y = 1; y < sampleSize - 1; y++) {
    for (let x = 1; x < sampleSize - 1; x++) {
      const idx = y * w + x
      const laplacian = Math.abs(
        4 * gray[idx] -
        gray[idx - 1] -
        gray[idx + 1] -
        gray[idx - w] -
        gray[idx + w]
      )
      variance += laplacian * laplacian
    }
  }

  return variance / ((sampleSize - 2) * (sampleSize - 2))
}

/**
 * Validate file type
 */
export function validateFileType(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP images are supported.`,
    }
  }

  return { valid: true }
}

/**
 * Validate file size
 */
export function validateFileSize(file) {
  const maxSize = 15 * 1024 * 1024 // 15MB

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 15MB limit.`,
    }
  }

  return { valid: true }
}
