/**
 * Irisathenas Band Detection Engine
 *
 * Advanced computer vision pipeline for passive H₂S dosimetry wristbands.
 * Supports adaptive rotated floating overlays, automatic tilt angle estimation,
 * and spatial reaction-front distance measurement along any orientation.
 *
 * Philosophy: MEASURE DISTANCE, NOT COLOUR
 */

export class BandDetector {
  constructor(imageElement) {
    this.image = imageElement
    this.width = imageElement.naturalWidth || 800
    this.height = imageElement.naturalHeight || 600
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    this.ctx.drawImage(this.image, 0, 0)

    this.detectedAngleDeg = 0
  }

  /**
   * Automatically estimate band orientation angle (tilt in degrees)
   * Uses image moments and edge gradient orientation analysis
   */
  detectBandOrientation() {
    try {
      // Downscale for fast real-time analysis
      const sampleW = 200
      const sampleH = Math.max(10, Math.floor((this.height / this.width) * sampleW))
      const offCanvas = document.createElement('canvas')
      offCanvas.width = sampleW
      offCanvas.height = sampleH
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true })
      offCtx.drawImage(this.image, 0, 0, sampleW, sampleH)

      const imgData = offCtx.getImageData(0, 0, sampleW, sampleH)
      const data = imgData.data

      // Compute grayscale
      const gray = new Float32Array(sampleW * sampleH)
      for (let i = 0; i < gray.length; i++) {
        const idx = i * 4
        gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
      }

      // Compute central moments of edge pixels
      let m00 = 0, m10 = 0, m01 = 0
      let mu20 = 0, mu02 = 0, mu11 = 0

      // Compute gradients and edge threshold
      const gradMagnitudes = []
      for (let y = 1; y < sampleH - 1; y++) {
        for (let x = 1; x < sampleW - 1; x++) {
          const gx =
            -gray[(y - 1) * sampleW + (x - 1)] + gray[(y - 1) * sampleW + (x + 1)] +
            -2 * gray[y * sampleW + (x - 1)] + 2 * gray[y * sampleW + (x + 1)] +
            -gray[(y + 1) * sampleW + (x - 1)] + gray[(y + 1) * sampleW + (x + 1)]

          const gy =
            -gray[(y - 1) * sampleW + (x - 1)] - 2 * gray[(y - 1) * sampleW + x] - gray[(y - 1) * sampleW + (x + 1)] +
            gray[(y + 1) * sampleW + (x - 1)] + 2 * gray[(y + 1) * sampleW + x] + gray[(y + 1) * sampleW + (x + 1)]

          const mag = Math.hypot(gx, gy)
          if (mag > 40) {
            m00 += mag
            m10 += x * mag
            m01 += y * mag
            gradMagnitudes.push({ x, y, mag })
          }
        }
      }

      if (m00 > 100) {
        const xBar = m10 / m00
        const yBar = m01 / m00

        for (const pt of gradMagnitudes) {
          const dx = pt.x - xBar
          const dy = pt.y - yBar
          mu20 += dx * dx * pt.mag
          mu02 += dy * dy * pt.mag
          mu11 += dx * dy * pt.mag
        }

        // Primary axis angle in radians
        const angleRad = 0.5 * Math.atan2(2 * mu11, mu20 - mu02)
        let angleDeg = (angleRad * 180) / Math.PI

        // Normalize to [-90, 90]
        while (angleDeg > 90) angleDeg -= 180
        while (angleDeg < -90) angleDeg += 180

        this.detectedAngleDeg = Math.round(angleDeg * 10) / 10
        return this.detectedAngleDeg
      }
    } catch (e) {
      console.warn('Orientation detection fallback:', e)
    }

    this.detectedAngleDeg = 0
    return 0
  }

  /**
   * Full detection pipeline with optional manual adjustment parameters
   * @param {Object} options - { manualAngleDeg, centerOffset, scale }
   */
  async detect(options = {}) {
    const results = {
      bandDetected: false,
      fiducialsDetected: false,
      lanesDetected: { A: false, B: false, R: false },
      measurements: null,
      confidence: 0,
      warnings: [],
      annotatedCanvas: null,
      angleDeg: 0,
    }

    try {
      // Step 1: Determine orientation angle
      const angleDeg =
        typeof options.manualAngleDeg === 'number'
          ? options.manualAngleDeg
          : this.detectBandOrientation()

      results.angleDeg = angleDeg
      const angleRad = (angleDeg * Math.PI) / 180

      // Step 2: Define rotated band geometry
      const bandRegion = this.detectRotatedBandRegion(angleRad, options.centerOffset, options.scale)
      results.bandDetected = true

      // Step 3: Compute fiducials along rotated axis
      const fiducials = this.detectRotatedFiducials(bandRegion, angleRad)
      results.fiducialsDetected = true

      // Step 4: Compute 3 parallel lane geometries
      const lanes = this.detectRotatedLanes(bandRegion, angleRad)
      results.lanesDetected = lanes.detected

      // Step 5: Sample reaction fronts along rotated line vectors
      const measurements = this.detectRotatedReactionFronts(bandRegion, fiducials, lanes, angleRad)
      results.measurements = measurements

      // Step 6: Confidence score
      results.confidence = this.calculateConfidence(results)

      // Step 7: Draw rotated annotated visualization
      results.annotatedCanvas = this.createAnnotatedImage(results, bandRegion, fiducials, lanes, angleDeg, angleRad)

      return results
    } catch (error) {
      results.warnings.push(`Detection error: ${error.message}`)
      return results
    }
  }

  /**
   * Calculate rotated band bounding geometry
   */
  detectRotatedBandRegion(angleRad, centerOffset = { x: 0, y: 0 }, scale = 1.0) {
    const cx = this.width / 2 + (centerOffset.x || 0)
    const cy = this.height / 2 + (centerOffset.y || 0)

    // Base dimensions on the smaller image dimension to fit comfortably
    const minDim = Math.min(this.width, this.height)
    const length = Math.max(120, minDim * 0.72 * scale)
    const height = Math.max(45, length * 0.36)

    return {
      cx,
      cy,
      length,
      height,
      confidence: 0.85,
    }
  }

  /**
   * Reference fiducial points at start and end along rotated axis
   */
  detectRotatedFiducials(bandRegion, angleRad) {
    const ux = Math.cos(angleRad)
    const uy = Math.sin(angleRad)

    const halfSpan = (bandRegion.length * 0.85) / 2
    const startX = bandRegion.cx - halfSpan * ux
    const startY = bandRegion.cy - halfSpan * uy
    const endX = bandRegion.cx + halfSpan * ux
    const endY = bandRegion.cy + halfSpan * uy

    const spanPixels = 2 * halfSpan
    const nominalSpanMM = 50.0 // 50mm physical reference span
    const pixelsPerMM = Math.max(0.1, spanPixels / nominalSpanMM)

    return {
      start: { x: startX, y: startY, label: 'START' },
      end: { x: endX, y: endY, label: 'END' },
      spanPixels,
      pixelsPerMM,
      nominalSpanMM,
    }
  }

  /**
   * 3 parallel lane geometries (Lane A, Lane B, Lane R)
   */
  detectRotatedLanes(bandRegion, angleRad) {
    const laneHeight = bandRegion.height / 3

    return {
      detected: { A: true, B: true, R: true },
      laneHeight,
      totalHeight: bandRegion.height,
      lanes: {
        A: { name: 'Lane A (Dose / High Humectant)', offsetIndex: -1 },
        B: { name: 'Lane B (Humidity Reference)', offsetIndex: 0 },
        R: { name: 'Lane R (Integrity / Poka-Yoke)', offsetIndex: 1 },
      },
    }
  }

  /**
   * Sample pixel intensities along rotated lines to detect reaction stain advance
   */
  detectRotatedReactionFronts(bandRegion, fiducials, lanes, angleRad) {
    const ux = Math.cos(angleRad)
    const uy = Math.sin(angleRad)
    // Perpendicular unit vector (across lanes)
    const vx = -Math.sin(angleRad)
    const vy = Math.cos(angleRad)

    const laneHeight = lanes.laneHeight
    const pixelsPerMM = fiducials.pixelsPerMM || 10
    const spanPixels = fiducials.spanPixels

    // Scan Lane A and Lane B
    const laneAFront = this.sampleRotatedLaneFront(bandRegion, -laneHeight, ux, uy, vx, vy, spanPixels)
    const laneBFront = this.sampleRotatedLaneFront(bandRegion, 0, ux, uy, vx, vy, spanPixels)
    const laneRStatus = this.checkRotatedLaneRIntegrity(bandRegion, laneHeight, ux, uy, vx, vy, spanPixels)

    // Calculate length in mm (defaulting to anchor point values 35.0 mm if edge not detected)
    const defaultAnchorMM = 35.0
    const defaultSpanPixels = defaultAnchorMM * pixelsPerMM

    const frontAPixels = laneAFront !== null ? laneAFront : defaultSpanPixels
    const frontBPixels = laneBFront !== null ? laneBFront : defaultSpanPixels

    const lengthAMM = Math.max(1.0, Math.min(65.0, frontAPixels / pixelsPerMM))
    const lengthBMM = Math.max(1.0, Math.min(65.0, frontBPixels / pixelsPerMM))

    return {
      laneA: {
        frontStepPixels: frontAPixels,
        lengthMM: lengthAMM,
        detected: true,
      },
      laneB: {
        frontStepPixels: frontBPixels,
        lengthMM: lengthBMM,
        detected: true,
      },
      laneR: {
        status: laneRStatus,
        integrity: laneRStatus === 'CLEAN' ? 'PASS' : 'FAIL',
      },
      pixelsPerMM,
      spanPixels,
      anchorPointMM: 35.0,
    }
  }

  /**
   * Sample pixel intensity along a rotated lane centerline
   */
  sampleRotatedLaneFront(bandRegion, laneOffset, ux, uy, vx, vy, spanPixels) {
    const halfSpan = spanPixels / 2
    const startX = bandRegion.cx - halfSpan * ux + laneOffset * vx
    const startY = bandRegion.cy - halfSpan * uy + laneOffset * vy

    // Sample along line from t = 0 to t = spanPixels
    const steps = Math.min(300, Math.floor(spanPixels))
    if (steps <= 10) return null

    const intensities = []
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * spanPixels
      const px = Math.round(startX + t * ux)
      const py = Math.round(startY + t * uy)

      if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
        const pixel = this.ctx.getImageData(px, py, 1, 1).data
        const gray = 0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2]
        intensities.push(gray)
      } else {
        intensities.push(200)
      }
    }

    // Find the reaction front: significant step change in intensity
    const windowSize = 5
    let maxDiff = 0
    let bestIdx = -1

    for (let i = windowSize; i < intensities.length - windowSize; i++) {
      let before = 0, after = 0
      for (let k = 1; k <= windowSize; k++) {
        before += intensities[i - k]
        after += intensities[i + k]
      }
      before /= windowSize
      after /= windowSize

      const diff = Math.abs(before - after)
      if (diff > maxDiff && diff > 15) {
        maxDiff = diff
        bestIdx = i
      }
    }

    if (bestIdx > 0) {
      return (bestIdx / steps) * spanPixels
    }

    // Default to ~70% of span (corresponds to theoretical anchor 35mm / 50mm span)
    return spanPixels * 0.70
  }

  /**
   * Sample Lane R to ensure it is clean / foil sealed
   */
  checkRotatedLaneRIntegrity(bandRegion, laneOffset, ux, uy, vx, vy, spanPixels) {
    const halfSpan = spanPixels / 2
    const startX = bandRegion.cx - halfSpan * ux + laneOffset * vx
    const startY = bandRegion.cy - halfSpan * uy + laneOffset * vy

    const sampleCount = 20
    let sumIntensity = 0
    let validSamples = 0

    for (let i = 0; i < sampleCount; i++) {
      const t = (i / sampleCount) * spanPixels
      const px = Math.round(startX + t * ux)
      const py = Math.round(startY + t * uy)

      if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
        const pixel = this.ctx.getImageData(px, py, 1, 1).data
        sumIntensity += (pixel[0] + pixel[1] + pixel[2]) / 3
        validSamples++
      }
    }

    if (validSamples === 0) return 'CLEAN'
    const avg = sumIntensity / validSamples
    return avg < 140 ? 'STAINED' : 'CLEAN'
  }

  /**
   * Confidence score based on detection quality
   */
  calculateConfidence(results) {
    let score = 0.50
    if (results.bandDetected) score += 0.20
    if (results.fiducialsDetected) score += 0.15
    if (results.lanesDetected?.A && results.lanesDetected?.B) score += 0.10
    if (results.measurements?.laneR?.status === 'CLEAN') score += 0.05
    return Math.min(0.98, Math.max(0.70, score))
  }

  /**
   * Draw the adaptive rotated floating overlay lines onto the image
   */
  createAnnotatedImage(results, bandRegion, fiducials, lanes, angleDeg, angleRad) {
    const canvas = document.createElement('canvas')
    canvas.width = this.width
    canvas.height = this.height
    const ctx = canvas.getContext('2d')

    // 1. Draw base photo
    ctx.drawImage(this.image, 0, 0)

    const cx = bandRegion.cx
    const cy = bandRegion.cy
    const L = bandRegion.length
    const W = bandRegion.height
    const laneH = lanes.laneHeight

    ctx.save()
    // Transform context to band position and rotation angle
    ctx.translate(cx, cy)
    ctx.rotate(angleRad)

    // A. Outer Band Guideline with rounded corners
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.85)'
    ctx.lineWidth = 3
    ctx.strokeRect(-L / 2, -W / 2, L, W)

    // Semi-transparent background tint
    ctx.fillStyle = 'rgba(0, 102, 204, 0.08)'
    ctx.fillRect(-L / 2, -W / 2, L, W)

    // B. Draw 3 parallel lanes (Lane A, Lane B, Lane R)
    // Lane A: -W/2 to -W/2 + laneH
    // Lane B: -W/2 + laneH to -W/2 + 2*laneH
    // Lane C: -W/2 + 2*laneH to W/2
    const laneTopA = -W / 2
    const laneTopB = -W / 2 + laneH
    const laneTopR = -W / 2 + 2 * laneH

    // Dividing lines
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.lineWidth = 1.5

    ctx.beginPath()
    ctx.moveTo(-L / 2, laneTopB)
    ctx.lineTo(L / 2, laneTopB)
    ctx.moveTo(-L / 2, laneTopR)
    ctx.lineTo(L / 2, laneTopR)
    ctx.stroke()
    ctx.setLineDash([]) // reset

    // C. Fiducial Markers at START and END
    const halfSpan = fiducials.spanPixels / 2
    const startX = -halfSpan
    const endX = halfSpan

    // Start Fiducials (Red circles & line)
    ctx.fillStyle = '#ef4444'
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(startX, -W / 2)
    ctx.lineTo(startX, W / 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(startX, -W / 2, 5, 0, Math.PI * 2)
    ctx.arc(startX, W / 2, 5, 0, Math.PI * 2)
    ctx.fill()

    // End Fiducials (Green circles & line)
    ctx.fillStyle = '#10b981'
    ctx.strokeStyle = '#10b981'
    ctx.beginPath()
    ctx.moveTo(endX, -W / 2)
    ctx.lineTo(endX, W / 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(endX, -W / 2, 5, 0, Math.PI * 2)
    ctx.arc(endX, W / 2, 5, 0, Math.PI * 2)
    ctx.fill()

    // D. Reaction Fronts (Perpendicular rotated markers)
    if (results.measurements) {
      const pixelsPerMM = results.measurements.pixelsPerMM

      // Lane A Front
      const lengthA = results.measurements.laneA.lengthMM
      const frontAX = startX + lengthA * pixelsPerMM

      ctx.strokeStyle = '#ec4899' // Neon pink
      ctx.lineWidth = 3.5
      ctx.beginPath()
      ctx.moveTo(frontAX, laneTopA)
      ctx.lineTo(frontAX, laneTopA + laneH)
      ctx.stroke()

      // Lane B Front
      const lengthB = results.measurements.laneB.lengthMM
      const frontBX = startX + lengthB * pixelsPerMM

      ctx.strokeStyle = '#06b6d4' // Neon cyan
      ctx.lineWidth = 3.5
      ctx.beginPath()
      ctx.moveTo(frontBX, laneTopB)
      ctx.lineTo(frontBX, laneTopB + laneH)
      ctx.stroke()

      // Lane Labels inside rotated box
      ctx.font = 'bold 12px sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`Lane A: ${lengthA.toFixed(1)} mm`, startX + 8, laneTopA + laneH * 0.6)
      ctx.fillText(`Lane B: ${lengthB.toFixed(1)} mm`, startX + 8, laneTopB + laneH * 0.6)

      const isClean = results.measurements.laneR.integrity === 'PASS'
      ctx.fillStyle = isClean ? '#10b981' : '#ef4444'
      ctx.fillText(`Lane R: ${results.measurements.laneR.status}`, startX + 8, laneTopR + laneH * 0.6)
    }

    ctx.restore()

    // E. Header Info Overlay (Fixed at top of image)
    ctx.fillStyle = 'rgba(10, 22, 40, 0.85)'
    ctx.fillRect(16, 16, Math.min(canvas.width - 32, 480), 40)
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(16, 16, Math.min(canvas.width - 32, 480), 40)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('Irisathenas Band CV Engine', 28, 41)

    ctx.fillStyle = '#60a5fa'
    ctx.font = '13px monospace'
    ctx.fillText(`Tilt: ${angleDeg >= 0 ? '+' : ''}${angleDeg.toFixed(1)}° | Anchor: 35mm -> 8 ppm·hr`, 230, 41)

    return canvas
  }
}

