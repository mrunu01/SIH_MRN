/**
 * AEGIS-BAND v2 — 100% Local Storage Manager
 *
 * Provides persistent, zero-cloud local data management for scans,
 * measurements, images, and user profile using browser localStorage.
 */

const SCANS_STORAGE_KEY = 'aegis_scans'
const PROFILE_STORAGE_KEY = 'aegis_profile'

// Default sample profile
const DEFAULT_PROFILE = {
  id: 'local-user',
  full_name: 'Industrial Safety Officer',
  organization: 'Plant Operations & Safety Dept',
  worker_id: 'ISO-2026-01',
}

// Initial sample scans for instant presentation & testing
const INITIAL_SAMPLE_SCANS = [
  {
    id: 'scan-sample-001',
    band_id: 'BAND-2026-A1',
    captured_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: 'analyzed',
    integrity_status: 'PASS',
    image_quality_status: 'PASS',
    analysis_method: 'auto',
    analysis_version: 'v2.0',
    notes: 'Routine 8-hour shift in primary refinery unit. Clean readings.',
    original_image_path: null,
    processed_image_path: null,
    scan_measurements: [
      {
        lane_a_length_mm: 14.8,
        lane_b_length_mm: 13.9,
        lane_r_status: 'CLEAN',
        a_b_ratio: 1.065,
        temperature_c: 26.5,
        relative_humidity: 52,
        exposure_time_hours: 8.0,
        dose_ppm_hr: 7.88,
        uptake_rate: 0.352,
        diffusion_coefficient: 0.176,
        inlet_area_cm2: 1.0,
        diffusion_path_cm: 0.50,
        calibration_alpha: 0.5,
        confidence_score: 0.95,
        measurement_json: {
          formulas: [
            {
              name: 'Ratiometric Humidity Correction',
              formula: 'R = Length A / Length B',
              variables: { 'Length A': '14.80 mm', 'Length B': '13.90 mm', 'R': '1.065' },
              explanation: 'Cancels out ambient moisture interference through differential response.',
            },
            {
              name: 'Dose Calculation',
              formula: 'Dose = Length A × α × R',
              variables: { 'Length A': '14.80 mm', 'α (Calibration Constant)': '0.50 ppm·hr/mm', 'R': '1.065', 'Calculated Dose': '7.88 ppm·hr' },
              explanation: 'Cumulative H₂S exposure derived from reaction-front linear displacement.',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'scan-sample-002',
    band_id: 'BAND-2026-B4',
    captured_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: 'analyzed',
    integrity_status: 'PASS',
    image_quality_status: 'PASS',
    analysis_method: 'auto',
    analysis_version: 'v2.0',
    notes: 'Confined space entry inspection. Low exposure recorded.',
    original_image_path: null,
    processed_image_path: null,
    scan_measurements: [
      {
        lane_a_length_mm: 8.4,
        lane_b_length_mm: 8.1,
        lane_r_status: 'CLEAN',
        a_b_ratio: 1.037,
        temperature_c: 24.0,
        relative_humidity: 48,
        exposure_time_hours: 4.0,
        dose_ppm_hr: 4.36,
        uptake_rate: 0.352,
        diffusion_coefficient: 0.176,
        inlet_area_cm2: 1.0,
        diffusion_path_cm: 0.50,
        calibration_alpha: 0.5,
        confidence_score: 0.92,
        measurement_json: {
          formulas: [
            {
              name: 'Ratiometric Humidity Correction',
              formula: 'R = Length A / Length B',
              variables: { 'Length A': '8.40 mm', 'Length B': '8.10 mm', 'R': '1.037' },
              explanation: 'Cancels out ambient moisture interference through differential response.',
            },
            {
              name: 'Dose Calculation',
              formula: 'Dose = Length A × α × R',
              variables: { 'Length A': '8.40 mm', 'α (Calibration Constant)': '0.50 ppm·hr/mm', 'R': '1.037', 'Calculated Dose': '4.36 ppm·hr' },
              explanation: 'Cumulative H₂S exposure derived from reaction-front linear displacement.',
            },
          ],
        },
      },
    ],
  },
]

export function getAllScans() {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_SCANS

  try {
    const raw = localStorage.getItem(SCANS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_SCANS))
      return INITIAL_SAMPLE_SCANS
    }
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to parse local scans:', e)
    return INITIAL_SAMPLE_SCANS
  }
}

export function getScanById(id) {
  const scans = getAllScans()
  return scans.find((s) => s.id === id) || null
}

export function saveScan(scanData) {
  if (typeof window === 'undefined') return scanData

  try {
    const scans = getAllScans()
    const index = scans.findIndex((s) => s.id === scanData.id)

    if (index >= 0) {
      scans[index] = scanData
    } else {
      scans.unshift(scanData)
    }

    localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(scans))
    return scanData
  } catch (e) {
    console.error('Failed to save scan locally:', e)
    return scanData
  }
}

export function deleteScan(id) {
  if (typeof window === 'undefined') return true

  try {
    const scans = getAllScans()
    const updated = scans.filter((s) => s.id !== id)
    localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updated))
    return true
  } catch (e) {
    console.error('Failed to delete scan locally:', e)
    return false
  }
}

export function getProfile() {
  if (typeof window === 'undefined') return DEFAULT_PROFILE

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE))
      return DEFAULT_PROFILE
    }
    return JSON.parse(raw)
  } catch (e) {
    return DEFAULT_PROFILE
  }
}

export function saveProfile(profileData) {
  if (typeof window === 'undefined') return profileData

  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData))
    return profileData
  } catch (e) {
    console.error('Failed to save profile locally:', e)
    return profileData
  }
}
