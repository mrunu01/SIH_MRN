/**
 * Irisathenas Band — Unified Storage Manager
 *
 * Provides persistent, cloud-synchronized data management for scans,
 * measurements, and user profiles using Supabase PostgreSQL with
 * transparent browser localStorage caching.
 */

import { getSupabaseClient } from '@/lib/supabase/client'

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
        lane_r_status: 'PASS (Intact)',
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
        lane_r_status: 'PASS (Intact)',
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

/**
 * Save scan to localStorage and asynchronously sync to Supabase Cloud
 */
export async function saveScan(scanData) {
  if (typeof window === 'undefined') return scanData

  // 1. Save synchronously to localStorage cache
  try {
    const scans = getAllScans()
    const index = scans.findIndex((s) => s.id === scanData.id)

    if (index >= 0) {
      scans[index] = scanData
    } else {
      scans.unshift(scanData)
    }

    localStorage.setItem(PRIMARY_SCANS_KEY, JSON.stringify(scans))
  } catch (e) {
    console.error('Failed to save scan locally:', e)
  }

  // 2. Asynchronously sync to Supabase Cloud if configured
  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || null

      // Insert or update scan
      await supabase.from('scans').upsert({
        id: scanData.id,
        user_id: userId,
        band_id: scanData.band_id || 'IRIS-SCAN',
        captured_at: scanData.captured_at || new Date().toISOString(),
        status: scanData.status || 'analyzed',
        integrity_status: scanData.integrity_status || 'PASS',
        image_quality_status: scanData.image_quality_status || 'PASS',
        analysis_method: scanData.analysis_method || 'auto',
        analysis_version: scanData.analysis_version || 'v2.0',
        manual_correction_used: Boolean(scanData.manual_correction_used),
        tilt_angle_deg: scanData.tilt_angle_deg || 0,
        original_image_path: scanData.original_image_path || null,
        processed_image_path: scanData.processed_image_path || null,
        notes: scanData.notes || null,
      })

      // Insert measurement
      if (scanData.scan_measurements && scanData.scan_measurements.length > 0) {
        const m = scanData.scan_measurements[0]
        await supabase.from('scan_measurements').upsert({
          scan_id: scanData.id,
          lane_a_length_mm: m.lane_a_length_mm,
          lane_b_length_mm: m.lane_b_length_mm,
          lane_r_length_mm: m.lane_r_length_mm,
          lane_r_status: m.lane_r_status,
          a_b_ratio: m.a_b_ratio,
          temperature_c: m.temperature_c,
          relative_humidity: m.relative_humidity,
          concentration_ppm: m.concentration_ppm,
          exposure_time_hours: m.exposure_time_hours || 8.0,
          dose_ppm_hr: m.dose_ppm_hr,
          uptake_rate: m.uptake_rate,
          confidence_score: m.confidence_score || 0.95,
          measurement_json: m.measurement_json || null,
        })
      }
    }
  } catch (cloudErr) {
    console.warn('Supabase cloud sync warning (fallback to local cache):', cloudErr)
  }

  return scanData
}

/**
 * Fetch all scans from Supabase Cloud sequentially date-wise (ordered by captured_at DESC)
 */
export async function fetchCloudScans() {
  if (typeof window === 'undefined') return getAllScans()

  try {
    const supabase = getSupabaseClient()
    if (!supabase) return getAllScans()

    const { data: { session } } = await supabase.auth.getSession()

    let query = supabase
      .from('scans')
      .select('*, scan_measurements (*)')
      .order('captured_at', { ascending: false })

    // If user is logged in, fetch user's scans
    if (session?.user?.id) {
      query = query.eq('user_id', session.user.id)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Supabase scan fetch warning:', error.message)
      return getAllScans()
    }

    if (data && data.length > 0) {
      const formatted = data.map((s) => ({
        id: s.id,
        band_id: s.band_id,
        captured_at: s.captured_at,
        status: s.status,
        integrity_status: s.integrity_status,
        image_quality_status: s.image_quality_status,
        analysis_method: s.analysis_method,
        analysis_version: s.analysis_version,
        manual_correction_used: s.manual_correction_used,
        tilt_angle_deg: s.tilt_angle_deg,
        original_image_path: s.original_image_path,
        processed_image_path: s.processed_image_path,
        notes: s.notes,
        scan_measurements: s.scan_measurements || [],
      }))

      // Update local cache
      localStorage.setItem(PRIMARY_SCANS_KEY, JSON.stringify(formatted))
      return formatted
    }

    return getAllScans()
  } catch (e) {
    console.warn('Failed to fetch cloud scans:', e)
    return getAllScans()
  }
}

/**
 * Fetch a single scan by ID from Supabase Cloud
 */
export async function fetchCloudScanById(id) {
  if (typeof window === 'undefined') return getScanById(id)

  try {
    const supabase = getSupabaseClient()
    if (!supabase) return getScanById(id)

    const { data, error } = await supabase
      .from('scans')
      .select('*, scan_measurements (*)')
      .eq('id', id)
      .single()

    if (data && !error) {
      return {
        id: data.id,
        band_id: data.band_id,
        captured_at: data.captured_at,
        status: data.status,
        integrity_status: data.integrity_status,
        image_quality_status: data.image_quality_status,
        analysis_method: data.analysis_method,
        analysis_version: data.analysis_version,
        manual_correction_used: data.manual_correction_used,
        tilt_angle_deg: data.tilt_angle_deg,
        original_image_path: data.original_image_path,
        processed_image_path: data.processed_image_path,
        notes: data.notes,
        scan_measurements: data.scan_measurements || [],
      }
    }
  } catch (e) {
    console.warn('Fetch scan by ID warning:', e)
  }

  return getScanById(id)
}

export async function deleteScan(id) {
  if (typeof window === 'undefined') return true

  try {
    const scans = getAllScans()
    const updated = scans.filter((s) => s.id !== id)
    localStorage.setItem(PRIMARY_SCANS_KEY, JSON.stringify(updated))

    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from('scans').delete().eq('id', id)
    }

    return true
  } catch (e) {
    console.error('Failed to delete scan:', e)
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
