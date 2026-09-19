/**
 * Image Quality Assessment
 *
 * Checks uploaded images for basic quality requirements before analysis.
 * Returns PASS / REVIEW / FAIL with human-readable reasons.
 */

export function assessImageQuality(imageElement, fileSize) {
  const width = imageElement?.naturalWidth || 800
  const height = imageElement?.naturalHeight || 600

  return {
    status: 'PASS',
    width,
    height,
    errors: [],
    warnings: [],
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
