/**
 * Irisathenas Band — 100% Local Storage Manager
 *
 * Provides persistent, zero-cloud local data management for scans,
 * measurements, images, and user profile using browser localStorage.
 */

const PRIMARY_SCANS_KEY = 'irisathenas_scans'
const LEGACY_SCANS_KEY = 'aegis_scans'
const PRIMARY_PROFILE_KEY = 'irisathenas_profile'
const LEGACY_PROFILE_KEY = 'aegis_profile'

// Default sample profile
const DEFAULT_PROFILE = {
  id: 'local-user',
  full_name: 'Industrial Safety Officer',
  organization: 'Irisathenas Plant Safety & EHS Dept',
  worker_id: 'ISO-2026-01',
}

// Initial sample scans calibrated to Irisathenas anchor point (35.0 mm = 8.0 ppm·hr)
const INITIAL_SAMPLE_SCANS = [
  {
    id: 'scan-sample-001',
    band_id: 'IRIS-2026-A1',
    captured_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: 'analyzed',
    integrity_status: 'PASS',
    image_quality_status: 'PASS',
    analysis_method: 'auto',
    analysis_version: 'v2.0',
    notes: 'Routine 8-hour shift. Lane A measured at anchor length (35.0 mm).',
    original_image_path: null,
    processed_image_path: null,
    scan_measurements: [
      {
        lane_a_length_mm: 35.0,
        lane_b_length_mm: 35.0,
        lane_r_status: 'CLEAN',
        a_b_ratio: 1.000,
        temperature_c: 25.0,
        relative_humidity: 50,
        exposure_time_hours: 8.0,
        dose_ppm_hr: 8.00,
        uptake_rate: 0.352,
        diffusion_coefficient: 0.176,
        inlet_area_cm2: 1.0,
        diffusion_path_cm: 0.50,
        calibration_alpha: 0.22857,
        confidence_score: 0.96,
        measurement_json: {
          formulas: [
            {
              name: 'Ratiometric Humidity Correction',
              formula: 'R = Length A / Length B',
              variables: { 'Length A': '35.00 mm', 'Length B': '35.00 mm', 'R': '1.000' },
              explanation: 'Cancels out ambient moisture interference through differential response.',
            },
            {
              name: 'Anchor Dose Calculation (Irisathenas)',
              formula: 'Dose = (Length A / 4.375) × R = Length A × α × R',
              variables: {
                'Length A': '35.00 mm',
                'Sensitivity': '4.375 mm/(ppm·hr)',
                'α (Calibration Constant)': '0.22857 (ppm·hr)/mm',
                'Anchor Point': '35.0 mm = 8.0 ppm·hr',
                'R': '1.000',
                'Calculated Dose': '8.00 ppm·hr',
              },
              explanation: 'Exact anchor match from theoretical linear loading calibration.',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'scan-sample-002',
    band_id: 'IRIS-2026-B4',
    captured_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: 'analyzed',
    integrity_status: 'PASS',
    image_quality_status: 'PASS',
    analysis_method: 'auto',
    analysis_version: 'v2.0',
    notes: 'Confined space entry inspection. Stain length 17.5 mm (half anchor).',
    original_image_path: null,
    processed_image_path: null,
    scan_measurements: [
      {
        lane_a_length_mm: 17.5,
        lane_b_length_mm: 17.2,
        lane_r_status: 'CLEAN',
        a_b_ratio: 1.017,
        temperature_c: 24.0,
        relative_humidity: 48,
        exposure_time_hours: 4.0,
        dose_ppm_hr: 4.07,
        uptake_rate: 0.352,
        diffusion_coefficient: 0.176,
        inlet_area_cm2: 1.0,
        diffusion_path_cm: 0.50,
        calibration_alpha: 0.22857,
        confidence_score: 0.94,
        measurement_json: {
          formulas: [
            {
              name: 'Ratiometric Humidity Correction',
              formula: 'R = Length A / Length B',
              variables: { 'Length A': '17.50 mm', 'Length B': '17.20 mm', 'R': '1.017' },
              explanation: 'Cancels out ambient moisture interference through differential response.',
            },
            {
              name: 'Anchor Dose Calculation (Irisathenas)',
              formula: 'Dose = (Length A / 4.375) × R = Length A × α × R',
              variables: {
                'Length A': '17.50 mm',
                'Sensitivity': '4.375 mm/(ppm·hr)',
                'α (Calibration Constant)': '0.22857 (ppm·hr)/mm',
                'R': '1.017',
                'Calculated Dose': '4.07 ppm·hr',
              },
              explanation: 'Calculated dose from 17.5 mm stain corresponds to ~4.0 ppm·hr theoretical exposure.',
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
    const raw = localStorage.getItem(PRIMARY_SCANS_KEY) || localStorage.getItem(LEGACY_SCANS_KEY)
    if (!raw) {
      localStorage.setItem(PRIMARY_SCANS_KEY, JSON.stringify(INITIAL_SAMPLE_SCANS))
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

    localStorage.setItem(PRIMARY_SCANS_KEY, JSON.stringify(scans))
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
    localStorage.setItem(PRIMARY_SCANS_KEY, JSON.stringify(updated))
    return true
  } catch (e) {
    console.error('Failed to delete scan locally:', e)
    return false
  }
}

export function getProfile() {
  if (typeof window === 'undefined') return DEFAULT_PROFILE

  try {
    const raw = localStorage.getItem(PRIMARY_PROFILE_KEY) || localStorage.getItem(LEGACY_PROFILE_KEY)
    if (!raw) {
      localStorage.setItem(PRIMARY_PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE))
      return DEFAULT_PROFILE
    }
    return JSON.parse(raw)
  } catch (e) {
    return DEFAULT_PROFILE
  }
}

export function updateProfile(profileData) {
  if (typeof window === 'undefined') return profileData

  try {
    const current = getProfile()
    const updated = { ...current, ...profileData }
    localStorage.setItem(PRIMARY_PROFILE_KEY, JSON.stringify(updated))
    return updated
  } catch (e) {
    console.error('Failed to update profile locally:', e)
    return profileData
  }
}

export function clearAllLocalData() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PRIMARY_SCANS_KEY)
  localStorage.removeItem(LEGACY_SCANS_KEY)
  localStorage.removeItem(PRIMARY_PROFILE_KEY)
  localStorage.removeItem(LEGACY_PROFILE_KEY)
}

export function resetSampleScans() {
  if (typeof window === 'undefined') return []
  localStorage.setItem(PRIMARY_SCANS_KEY, JSON.stringify(INITIAL_SAMPLE_SCANS))
  localStorage.removeItem(LEGACY_SCANS_KEY)
  return INITIAL_SAMPLE_SCANS
}

export function saveProfile(profileData) {
  if (typeof window === 'undefined') return profileData

  try {
    localStorage.setItem(PRIMARY_PROFILE_KEY, JSON.stringify(profileData))
    return profileData
  } catch (e) {
    console.error('Failed to save profile locally:', e)
    return profileData
  }
}

const VISION_API_KEY_STORAGE = 'irisathenas_vision_api_key'

export function getVisionApiKey() {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(VISION_API_KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function saveVisionApiKey(key) {
  if (typeof window === 'undefined') return
  try {
    if (!key) {
      localStorage.removeItem(VISION_API_KEY_STORAGE)
    } else {
      localStorage.setItem(VISION_API_KEY_STORAGE, key.trim())
    }
  } catch (e) {
    console.error('Failed to save API key to localStorage:', e)
  }
}

