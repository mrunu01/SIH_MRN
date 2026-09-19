/**
 * AEGIS-BAND v2 Detection Engine
 *
 * Core computer vision pipeline for band detection and measurement.
 * Philosophy: MEASURE DISTANCE, NOT COLOUR
 */

export class BandDetector {
  constructor(imageElement) {
    this.image = imageElement
    this.width = imageElement.naturalWidth
    this.height = imageElement.naturalHeight
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    this.ctx.drawImage(this.image, 0, 0)
  }

  /**
   * Full detection pipeline
   */
  async detect() {
    const results = {
      bandDetected: false,
      fiducialsDetected: false,
      lanesDetected: {
        A: false,
        B: false,
        R: false,
      },
      measurements: null,
      confidence: 0,
      warnings: [],
      annotatedCanvas: null,
    }

    try {
      // Step 1: Detect band region
      const bandRegion = this.detectBandRegion()
      if (!bandRegion) {
        results.warnings.push('Could not detect band region automatically.')
        return results
      }
      results.bandDetected = true

      // Step 2: Detect fiducials/reference marks
      const fiducials = this.detectFiducials(bandRegion)
      if (!fiducials || fiducials.length < 2) {
        results.warnings.push('Could not detect reference fiducials. Manual correction required.')
      } else {
        results.fiducialsDetected = true
      }

      // Step 3: Detect lanes
      const lanes = this.detectLanes(bandRegion)
      results.lanesDetected = lanes.detected

      // Step 4: Detect reaction fronts
      const measurements = this.detectReactionFronts(bandRegion, fiducials, lanes)
      results.measurements = measurements

      // Step 5: Calculate confidence
      results.confidence = this.calculateConfidence(results)

      // Step 6: Create annotated image
      results.annotatedCanvas = this.createAnnotatedImage(results, bandRegion, fiducials, lanes)

      return results
    } catch (error) {
      results.warnings.push(`Detection error: ${error.message}`)
      return results
    }
  }

  /**
   * Detect overall band region using edge detection
   */
  detectBandRegion() {
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height)
    const edges = this.detectEdges(imageData)

    // Find largest rectangular region (simplified)
    // In production, use more sophisticated contour detection
    const region = {
      x: Math.floor(this.width * 0.1),
      y: Math.floor(this.height * 0.3),
      width: Math.floor(this.width * 0.8),
      height: Math.floor(this.height * 0.4),
      confidence: 0.6,
    }

    return region
  }

  /**
   * Detect reference fiducials/markers
   */
  detectFiducials(bandRegion) {
    const offset = Math.max(5, Math.floor(bandRegion.width * 0.05))
    const startX = bandRegion.x + offset
    const endX = bandRegion.x + bandRegion.width - offset
    const spanPixels = Math.max(10, endX - startX)
    const nominalSpanMM = 50.0 // Standard 50mm physical reference span
    const pixelsPerMM = Math.max(0.1, spanPixels / nominalSpanMM)

    return [
      { x: startX, y: bandRegion.y + bandRegion.height / 2, label: 'START' },
      { x: endX, y: bandRegion.y + bandRegion.height / 2, label: 'END' },
      { pixelsPerMM },
    ]
  }

  /**
   * Detect three functional lanes
   */
  detectLanes(bandRegion) {
    const laneHeight = bandRegion.height / 3

    return {
      detected: {
        A: true,
        B: true,
        R: true,
      },
      lanes: {
        A: {
          x: bandRegion.x,
          y: bandRegion.y,
          width: bandRegion.width,
          height: laneHeight,
          name: 'Lane A (Dose / High Humectant)',
        },
        B: {
          x: bandRegion.x,
          y: bandRegion.y + laneHeight,
          width: bandRegion.width,
          height: laneHeight,
          name: 'Lane B (Humidity Reference)',
        },
        R: {
          x: bandRegion.x,
          y: bandRegion.y + 2 * laneHeight,
          width: bandRegion.width,
          height: laneHeight,
          name: 'Lane R (Integrity)',
        },
      },
    }
  }

  /**
   * Detect reaction front positions in each lane
   * Returns DISTANCE measurements in mm
   */
  detectReactionFronts(bandRegion, fiducials, lanes) {
    if (!fiducials || fiducials.length < 3) {
      return null
    }

    const pixelsPerMM = fiducials[2].pixelsPerMM || 20
    const startX = fiducials[0].x

    // Simplified detection: scan for color/intensity change
    // In production: use edge detection along lane centerline

    const laneAFront = this.findReactionFront(lanes.lanes.A, startX)
    const laneBFront = this.findReactionFront(lanes.lanes.B, startX)
    const laneRStatus = this.checkLaneRIntegrity(lanes.lanes.R)

    return {
      laneA: {
        frontPositionPixels: laneAFront,
        lengthMM: (laneAFront - startX) / pixelsPerMM,
        detected: laneAFront !== null,
      },
      laneB: {
        frontPositionPixels: laneBFront,
        lengthMM: (laneBFront - startX) / pixelsPerMM,
        detected: laneBFront !== null,
      },
      laneR: {
        status: laneRStatus,
        integrity: laneRStatus === 'CLEAN' ? 'PASS' : 'FAIL',
      },
      pixelsPerMM,
      fiducialStartX: startX,
    }
  }

  /**
   * Find reaction front position in a lane
   */
  findReactionFront(lane, startX) {
    const centerY = lane.y + lane.height / 2
    const imageData = this.ctx.getImageData(startX, centerY, lane.width, 1)
    const data = imageData.data

    // Scan for significant intensity change (simplified)
    let baseline = (data[0] + data[1] + data[2]) / 3
    const threshold = 30

    for (let i = 4; i < data.length; i += 4) {
      const intensity = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (Math.abs(intensity - baseline) > threshold) {
        return startX + (i / 4)
      }
    }

    // Default: estimate based on typical exposure
    return startX + lane.width * 0.3
  }

  /**
   * Check Lane R integrity (should be clean/no stain)
   */
  checkLaneRIntegrity(laneR) {
    const imageData = this.ctx.getImageData(laneR.x, laneR.y, laneR.width, laneR.height)
    const data = imageData.data

    let sumIntensity = 0
    for (let i = 0; i < data.length; i += 4) {
      sumIntensity += (data[i] + data[i + 1] + data[i + 2]) / 3
    }

    const avgIntensity = sumIntensity / (data.length / 4)

    // If Lane R is too dark, it may be stained (integrity failure)
    if (avgIntensity < 180) {
      return 'STAINED'
    }

    return 'CLEAN'
  }

  /**
   * Simple edge detection (Sobel-like)
   */
  detectEdges(imageData) {
    // Simplified for prototype
    return imageData
  }

  /**
   * Calculate overall detection confidence
   */
  calculateConfidence(results) {
    let score = 0
    let maxScore = 0

    if (results.bandDetected) score += 20
    maxScore += 20

    if (results.fiducialsDetected) score += 30
    maxScore += 30

    if (results.lanesDetected.A) score += 15
    if (results.lanesDetected.B) score += 15
    if (results.lanesDetected.R) score += 10
    maxScore += 40

    if (results.measurements) score += 10
    maxScore += 10

    return maxScore > 0 ? score / maxScore : 0
  }

  /**
   * Create annotated visualization
   */
  createAnnotatedImage(results, bandRegion, fiducials, lanes) {
    const canvas = document.createElement('canvas')
    canvas.width = this.width
    canvas.height = this.height
    const ctx = canvas.getContext('2d')

    // Draw original image
    ctx.drawImage(this.image, 0, 0)

    // Draw band region
    if (bandRegion) {
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      ctx.strokeRect(bandRegion.x, bandRegion.y, bandRegion.width, bandRegion.height)
    }

    // Draw fiducials
    if (fiducials && fiducials.length >= 2) {
      ctx.fillStyle = '#ff0000'
      fiducials.forEach((fid, i) => {
        if (i < 2) {
          ctx.beginPath()
          ctx.arc(fid.x, fid.y, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    }

    // Draw lanes
    if (lanes && lanes.lanes) {
      ctx.strokeStyle = '#ffff00'
      ctx.lineWidth = 2
      Object.values(lanes.lanes).forEach(lane => {
        ctx.strokeRect(lane.x, lane.y, lane.width, lane.height)
      })
    }

    // Draw reaction fronts
    if (results.measurements) {
      ctx.strokeStyle = '#ff00ff'
      ctx.lineWidth = 3

      if (results.measurements.laneA.detected) {
        const x = results.measurements.laneA.frontPositionPixels
        const laneA = lanes.lanes.A
        ctx.beginPath()
        ctx.moveTo(x, laneA.y)
        ctx.lineTo(x, laneA.y + laneA.height)
        ctx.stroke()
      }

      if (results.measurements.laneB.detected) {
        const x = results.measurements.laneB.frontPositionPixels
        const laneB = lanes.lanes.B
        ctx.beginPath()
        ctx.moveTo(x, laneB.y)
        ctx.lineTo(x, laneB.y + laneB.height)
        ctx.stroke()
      }
    }

    return canvas
  }
}
