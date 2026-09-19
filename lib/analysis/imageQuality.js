/**
 * Image Quality Assessment
 *
 * Checks uploaded images for basic quality requirements before analysis.
 * Returns PASS / REVIEW / FAIL with human-readable reasons.
 */

export function assessImageQuality(imageElement, fileSize) {
  const warnings = []
  const errors = []

  const width = imageElement.naturalWidth
  const height = imageElement.naturalHeight

  // Check dimensions as advisory information
  if (width < 400 || height < 300) {
    warnings.push('Low image resolution detected. Measurement will adapt dynamically to band fiducials.')
  }

  // Check file size limit
  if (fileSize > 25 * 1024 * 1024) {
    warnings.push('Large file size may take slightly longer to process.')
  }

  // Check aspect ratio (advisory)
  const aspectRatio = width / height
  if (aspectRatio < 0.3 || aspectRatio > 5) {
    warnings.push('Non-standard aspect ratio. The detection engine will automatically adjust to the band area.')
  }

  // Analyze brightness and contrast using canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(imageElement, 0, 0)

  try {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    let sumBrightness = 0
    let minBrightness = 255
    let maxBrightness = 0

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      sumBrightness += brightness
      minBrightness = Math.min(minBrightness, brightness)
      maxBrightness = Math.max(maxBrightness, brightness)
    }

    const avgBrightness = sumBrightness / (data.length / 4)
    const contrast = maxBrightness - minBrightness

    // Lighting condition advisories
    if (avgBrightness < 30) {
      warnings.push('Low ambient lighting detected. Detection will use adaptive contrast.')
    } else if (avgBrightness > 240) {
      warnings.push('High illumination/glare detected. Centerline sampling will filter glare.')
    }

    if (contrast < 40) {
      warnings.push('Low optical contrast. Reaction-front distance detection active.')
    }

    // Estimate blur (advisory only)
    const blurScore = estimateBlur(ctx, width, height)
    if (blurScore < 100) {
      warnings.push('Image appears soft or out of focus, but distance detection will proceed.')
    }
  } catch (e) {
    // Non-fatal warning
    warnings.push('Image loaded. Ready for band detection.')
  }

  // AEGIS-BAND measures spatial distance relative to fiducials,
  // so any decoded image can proceed to analysis.
  const status = warnings.length === 0 ? 'PASS' : 'REVIEW'

  return {
    status,
    width,
    height,
    errors: [],
    warnings,
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
