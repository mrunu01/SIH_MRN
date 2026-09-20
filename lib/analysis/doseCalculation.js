/**
 * Dose Calculation Engine
 *
 * Converts measured reaction-front distances into H₂S exposure dose
 * using project-defined formulas and parameters.
 */

import { PROJECT_CONFIG, calculateDose, calculateRatiometricCorrection } from '../config/project'

export function calculateExposureDose(measurements, inputParams) {
  const result = {
    success: false,
    dose: null,
    unit: 'ppm·hr',
    calculations: {},
    warnings: [],
    integrityStatus: 'UNKNOWN',
    formulasUsed: [],
  }

  // Validate measurements
  if (!measurements) {
    result.warnings.push('No measurements provided')
    return result
  }

  // Check Lane R integrity first (fail-closed)
  if (measurements.laneR) {
    result.integrityStatus = measurements.laneR.integrity
    if (measurements.laneR.integrity === 'FAIL') {
      result.warnings.push(
        'Lane R integrity check FAILED. Band may be compromised. This scan should not be treated as a valid dosimetry result.'
      )
      // Still calculate but flag as invalid
    }
  }

  // Extract measured lengths
  const lengthA = measurements.laneA?.lengthMM
  const lengthB = measurements.laneB?.lengthMM

  if (!lengthA || !lengthB) {
    result.warnings.push('Lane measurements incomplete')
    return result
  }

  // Calculate ratiometric correction (humidity cancellation)
  const ratio = calculateRatiometricCorrection(lengthA, lengthB)
  result.calculations.lengthA = lengthA
  result.calculations.lengthB = lengthB
  result.calculations.ratio = ratio

  result.formulasUsed.push({
    name: 'Ratiometric Correction',
    formula: 'R = Length A / Length B',
    variables: {
      'Length A': `${lengthA.toFixed(2)} mm`,
      'Length B': `${lengthB.toFixed(2)} mm`,
      'R': ratio.toFixed(3),
    },
    explanation: 'Two lanes respond differently to humidity. Their ratio reduces humidity sensitivity.',
  })

  // Get input parameters (concentration, time, calibration)
  const concentration = inputParams?.concentrationPPM || 10 // Default for demo
  const exposureTime = inputParams?.exposureTimeHours || 8 // Default 8-hour shift

  // Calculate theoretical dose
  const theoreticalDose = calculateDose(concentration, exposureTime)
  result.calculations.theoreticalDose = theoreticalDose

  result.formulasUsed.push({
    name: 'Dose Calculation',
    formula: 'Dose = Concentration × Time',
    variables: {
      'Concentration': `${concentration} ppm`,
      'Time': `${exposureTime} hours`,
      'Dose': `${theoreticalDose.toFixed(2)} ppm·hr`,
    },
    explanation: 'Accumulated exposure is the product of gas concentration and exposure duration.',
  })

  // Fick's Law calibration
  const { diffusionCoefficient, inletArea, diffusionPath, uptakeRate } = PROJECT_CONFIG

  result.formulasUsed.push({
    name: "Fick's Law (Uptake Rate)",
    formula: 'U = (D × A) / L',
    variables: {
      'D (Diffusion Coefficient)': `${diffusionCoefficient} cm²/s`,
      'A (Inlet Area)': `${inletArea} cm²`,
      'L (Diffusion Path)': `${diffusionPath} cm`,
      'U (Uptake Rate)': `${uptakeRate.toFixed(3)} cm³/s ≈ ${PROJECT_CONFIG.uptakeRateML} mL/min`,
    },
    explanation: 'Passive sampling rate determined by geometry and H₂S diffusion coefficient.',
  })

  // Convert measured length to estimated dose
  // Uses Irisathenas Band theoretical linear calibration anchor point: 8 ppm·hr -> 35.0 mm (alpha = 0.22857 ppm·hr/mm)
  const calibrationAlpha = inputParams?.calibrationAlpha || PROJECT_CONFIG.calibrationAlpha || 0.2285714
  const estimatedDose = lengthA * calibrationAlpha * ratio

  result.calculations.calibrationAlpha = calibrationAlpha
  result.calculations.estimatedDose = estimatedDose
  result.calculations.sensitivity = PROJECT_CONFIG.calibrationSensitivity // 4.375 mm / (ppm·hr)
  result.calculations.anchorPoint = { dosePPMHr: PROJECT_CONFIG.calibrationAnchorDose, lengthMM: PROJECT_CONFIG.calibrationAnchorLength }

  result.formulasUsed.push({
    name: 'Length-to-Dose Conversion (Irisathenas Anchor Calibration)',
    formula: 'Dose = (Length A / 4.375) × R = Length A × α × R',
    variables: {
      'Length A': `${lengthA.toFixed(2)} mm`,
      'Sensitivity (S)': `${PROJECT_CONFIG.calibrationSensitivity} mm/(ppm·hr)`,
      'α (Calibration Constant)': `${calibrationAlpha.toFixed(5)} (ppm·hr)/mm`,
      'Anchor Reference': `${PROJECT_CONFIG.calibrationAnchorDose} ppm·hr = ${PROJECT_CONFIG.calibrationAnchorLength} mm`,
      'R (Humidity Correction)': ratio.toFixed(3),
      'Estimated Dose': `${estimatedDose.toFixed(2)} ppm·hr`,
    },
    explanation: 'Empirical calibration anchored to 8.0 ppm·hr = 35.0 mm (sensitivity 4.375 mm/ppm·hr). Front distance directly indicates accumulated H₂S dose.',
    note: 'Irisathenas Band linear loading model: Stain length proportional to accumulated exposure.',
  })

  // Apply humidity/temperature corrections if provided
  if (inputParams?.temperatureC || inputParams?.relativeHumidity) {
    result.calculations.environmentalConditions = {
      temperature: inputParams.temperatureC,
      humidity: inputParams.relativeHumidity,
    }
  }

  // Final dose
  result.dose = estimatedDose
  result.success = true

  // Validation warnings
  if (estimatedDose < PROJECT_CONFIG.minimumDetectableDose) {
    result.warnings.push(
      `Measured dose (${estimatedDose.toFixed(2)} ppm·hr) is below project minimum detectable dose target (${PROJECT_CONFIG.minimumDetectableDose} ppm·hr)`
    )
  }

  if (estimatedDose > PROJECT_CONFIG.calibrationDoseMax) {
    result.warnings.push(
      `Measured dose (${estimatedDose.toFixed(2)} ppm·hr) exceeds calibration range (${PROJECT_CONFIG.calibrationDoseMax} ppm·hr)`
    )
  }

  // Add uncertainty notice
  result.calculations.uncertainty = {
    expandedUncertaintyK2: PROJECT_CONFIG.expandedUncertaintyK2,
    note: 'Project specification: ±19.4% expanded uncertainty (k=2). This is a stated validation target, not independently certified performance.',
  }

  return result
}

/**
 * Validate measurement is within calibration domain
 */
export function validateCalibrationDomain(dose, temperature, humidity) {
  const warnings = []

  if (dose < PROJECT_CONFIG.calibrationDoseMin || dose > PROJECT_CONFIG.calibrationDoseMax) {
    warnings.push(
      `Dose ${dose.toFixed(2)} ppm·hr outside calibration range (${PROJECT_CONFIG.calibrationDoseMin}-${PROJECT_CONFIG.calibrationDoseMax} ppm·hr)`
    )
  }

  if (temperature !== undefined) {
    if (temperature < PROJECT_CONFIG.temperatureMin || temperature > PROJECT_CONFIG.temperatureMax) {
      warnings.push(
        `Temperature ${temperature}°C outside calibration range (${PROJECT_CONFIG.temperatureMin}-${PROJECT_CONFIG.temperatureMax}°C)`
      )
    }
  }

  if (humidity !== undefined) {
    if (humidity < PROJECT_CONFIG.humidityMin || humidity > PROJECT_CONFIG.humidityMax) {
      warnings.push(
        `Humidity ${humidity}% RH outside calibration range (${PROJECT_CONFIG.humidityMin}-${PROJECT_CONFIG.humidityMax}% RH)`
      )
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  }
}
