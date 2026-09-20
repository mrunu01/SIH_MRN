/**
 * Irisathenas Band Project Configuration
 *
 * These are PROJECT-SPEC values from the Irisathenas Band research specification.
 * They represent stated validation targets and calibration parameters,
 * NOT independently certified performance specifications.
 */

export const PROJECT_CONFIG = {
  name: 'Irisathenas Band',

  // Fick's Law Geometry Parameters
  diffusionCoefficient: 0.176, // D in cm²/s
  inletArea: 1.0, // A in cm²
  diffusionPath: 0.50, // L in cm
  reactionLaneArea: 0.25, // cm²

  // Calculated Uptake Rate
  // U = (D × A) / L = (0.176 × 1.0) / 0.50 = 0.352 cm³/s ≈ 21.1 mL/min
  uptakeRate: 0.352, // cm³/s
  uptakeRateML: 21.1, // mL/min

  // Theoretical Linear Calibration (Anchor point: 8 ppm·hr -> 35.0 mm, Max allowed: 50.0 mm)
  calibrationAnchorDose: 8.0, // ppm·hr
  calibrationAnchorLength: 35.0, // mm
  calibrationSensitivity: 4.375, // mm / (ppm·hr) -> 35.0 / 8.0 = 4.375
  calibrationAlpha: 0.2285714, // (ppm·hr) / mm -> 1 / 4.375
  calibrationLengthMin: 0.0, // mm
  calibrationLengthMax: 50.0, // mm (Strict maximum)

  // Reference Theoretical Calibration Table (linear loading, max 50.0 mm)
  calibrationTable: [
    { dose: 1.0, length: 4.4 },
    { dose: 2.0, length: 8.8 },
    { dose: 4.0, length: 17.5 },
    { dose: 6.0, length: 26.3 },
    { dose: 8.0, length: 35.0, anchor: true },
    { dose: 10.0, length: 43.8 },
    { dose: 11.4, length: 50.0, max: true },
  ],

  // Calibration Test Domain
  calibrationDoseMin: 1.0, // ppm·hr
  calibrationDoseMax: 12.0, // ppm·hr (corresponds to 50.0 mm max scale)
  temperatureMin: 15, // °C
  temperatureMax: 35, // °C
  humidityMin: 20, // % RH
  humidityMax: 80, // % RH

  // Stated Performance Targets (project specification)
  minimumDetectableDose: 0.5, // ppm·hr
  expandedUncertaintyK2: 19.4, // % (k=2, project validation target)
  acceptanceCriterion: 25, // % (stated criterion for diffusive samplers)

  // Economics (proposed project economics, not guaranteed market prices)
  proposedBandCostINR: 97,
  proposedAnnualWorkerCostINR: 1191,

  // Lane Configuration (Matching Common Scale Watch Badge Display)
  lanes: {
    A: {
      name: 'High Humident',
      description: 'Primary Exposure Strip (Lane A)',
      purpose: 'Primary H₂S exposure measurement',
    },
    B: {
      name: 'Low Humident',
      description: 'Humidity Reference Strip (Lane B)',
      purpose: 'Ratiometric humidity correction baseline',
    },
    R: {
      name: 'Integrity',
      description: 'Integrity Strip (Lane R)',
      purpose: 'Poka-Yoke integrity verification (PASS if clean/uncompromised)',
    },
  },

  // Measurement Philosophy
  measurementPrinciple: 'DISTANCE_NOT_COLOUR',

  // Analysis Constants
  minImageWidth: 100, // pixels
  minImageHeight: 100, // pixels
  maxFileSizeMB: 50,

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
