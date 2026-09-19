/**
 * AEGIS-BAND v2 Project Configuration
 *
 * These are PROJECT-SPEC values from the AEGIS-BAND v2 research specification.
 * They represent stated validation targets and calibration parameters,
 * NOT independently certified performance specifications.
 */

export const PROJECT_CONFIG = {
  // Fick's Law Geometry Parameters
  diffusionCoefficient: 0.176, // D in cm²/s
  inletArea: 1.0, // A in cm²
  diffusionPath: 0.50, // L in cm
  reactionLaneArea: 0.25, // cm²

  // Calculated Uptake Rate
  // U = (D × A) / L = (0.176 × 1.0) / 0.50 = 0.352 cm³/s ≈ 21.1 mL/min
  uptakeRate: 0.352, // cm³/s
  uptakeRateML: 21.1, // mL/min

  // Calibration Test Domain (34-run Face-Centred CCD)
  calibrationDoseMin: 2, // ppm·hr
  calibrationDoseMax: 80, // ppm·hr
  temperatureMin: 15, // °C
  temperatureMax: 35, // °C
  humidityMin: 20, // % RH
  humidityMax: 80, // % RH

  // Stated Performance Targets (project specification)
  minimumDetectableDose: 4, // ppm·hr (project target)
  expandedUncertaintyK2: 19.4, // % (k=2, project validation target)
  acceptanceCriterion: 25, // % (stated criterion for diffusive samplers)

  // Economics (proposed project economics, not guaranteed market prices)
  proposedBandCostINR: 97,
  proposedAnnualWorkerCostINR: 1191,

  // Lane Configuration
  lanes: {
    A: {
      name: 'Lane A',
      description: 'Dose / High Humectant',
      purpose: 'Primary H₂S exposure measurement',
    },
    B: {
      name: 'Lane B',
      description: 'Humidity Reference / Low Humectant',
      purpose: 'Ratiometric humidity correction baseline',
    },
    R: {
      name: 'Lane R',
      description: 'Integrity / Foil-Sealed',
      purpose: 'Fail-closed integrity verification (poka-yoke)',
    },
  },

  // Measurement Philosophy
  measurementPrinciple: 'DISTANCE_NOT_COLOUR',

  // Analysis Constants
  minImageWidth: 800, // pixels
  minImageHeight: 600, // pixels
  maxFileSizeMB: 15,

  // Confidence Thresholds (image-analysis confidence, not measurement accuracy)
  confidenceThresholds: {
    high: 0.80,
    medium: 0.60,
    low: 0.40,
  },

  // Standard References
  standards: {
    comparison: 'ASTM D4599',
    activeSampling: 'IS 5182 Part 7',
  },
}

/**
 * Calculate theoretical uptake rate from geometry
 */
export function calculateUptakeRate(D, A, L) {
  return (D * A) / L
}

/**
 * Calculate dose from concentration and time
 */
export function calculateDose(concentrationPPM, exposureTimeHours) {
  return concentrationPPM * exposureTimeHours
}

/**
 * Calculate concentration from dose and time
 */
export function calculateConcentration(dosePPMHr, exposureTimeHours) {
  if (exposureTimeHours === 0) return 0
  return dosePPMHr / exposureTimeHours
}

/**
 * Humidity ratiometric correction
 */
export function calculateRatiometricCorrection(lengthA, lengthB) {
  if (lengthB === 0) return null
  return lengthA / lengthB
}

/**
 * Get confidence level from score
 */
export function getConfidenceLevel(score) {
  const { high, medium } = PROJECT_CONFIG.confidenceThresholds
  if (score >= high) return 'HIGH'
  if (score >= medium) return 'MEDIUM'
  return 'LOW'
}
