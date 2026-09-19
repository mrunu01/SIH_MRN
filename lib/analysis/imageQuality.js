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

  // Check dimensions
  if (width < 800 || height < 600) {
    errors.push('Image resolution too low. Minimum 800×600 pixels required.')
  }

  // Check file size
  if (fileSize > 15 * 1024 * 1024) {
    errors.push('File size exceeds 15MB limit.')
  }

  // Check aspect ratio (should be roughly horizontal band)
  const aspectRatio = width / height
  if (aspectRatio < 0.5 || aspectRatio > 4) {
    warnings.push('Unusual aspect ratio. Ensure the full band is visible.')
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

    // Check for extreme darkness
    if (avgBrightness < 30) {
      errors.push('Image too dark. Ensure adequate lighting.')
    }

    // Check for extreme brightness/glare
    if (avgBrightness > 240) {
      warnings.push('Image very bright. Check for glare or overexposure.')
    }

    // Check for low contrast
    if (contrast < 50) {
      errors.push('Insufficient contrast. Image may be too uniform or foggy.')
    }

    // Estimate blur using Laplacian variance
    const blurScore = estimateBlur(ctx, width, height)
    if (blurScore < 100) {
      errors.push('Image appears too blurry. Hold camera steady and ensure focus.')
    } else if (blurScore < 200) {
      warnings.push('Image may be slightly blurred. Consider retaking for better accuracy.')
    }

  } catch (e) {
    warnings.push('Could not analyze image quality automatically.')
  }

  // Determine overall status
  let status = 'PASS'
  if (errors.length > 0) {
    status = 'FAIL'
  } else if (warnings.length > 0) {
    status = 'REVIEW'
  }

  return {
    status,
    width,
    height,
    errors,
    warnings,
    canProceed: status !== 'FAIL',
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
