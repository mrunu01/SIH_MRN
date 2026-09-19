'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, Upload, ArrowLeft, AlertTriangle, CheckCircle, XCircle, Eye, ZoomIn } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { BandDetector } from '@/lib/analysis/bandDetection'
import { calculateExposureDose } from '@/lib/analysis/doseCalculation'
import { assessImageQuality, validateFileType, validateFileSize } from '@/lib/analysis/imageQuality'
import { PROJECT_CONFIG } from '@/lib/config/project'

export default function NewScanPage() {
  const [step, setStep] = useState(1) // 1: capture, 2: quality, 3: detection, 4: correction, 5: measurement, 6: calculation, 7: review
  const [user, setUser] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageElement, setImageElement] = useState(null)
  const [qualityResult, setQualityResult] = useState(null)
  const [detectionResult, setDetectionResult] = useState(null)
  const [measurements, setMeasurements] = useState(null)
  const [doseResult, setDoseResult] = useState(null)
  const [scanData, setScanData] = useState({
    bandId: '',
    temperatureC: '',
    relativeHumidity: '',
    concentrationPPM: '',
    exposureTimeHours: '8',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    }
    loadUser()
  }, [supabase, router])

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const typeValidation = validateFileType(file)
    if (!typeValidation.valid) {
      setError(typeValidation.error)
      return
    }

    // Validate file size
    const sizeValidation = validateFileSize(file)
    if (!sizeValidation.valid) {
      setError(sizeValidation.error)
      return
    }

    setImageFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target.result)

      // Load image for quality check
      const img = new Image()
      img.onload = () => {
        setImageElement(img)
        setStep(2)
        performQualityCheck(img, file.size)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  const performQualityCheck = (img, fileSize) => {
    setLoading(true)
    try {
      const quality = assessImageQuality(img, fileSize)
      setQualityResult(quality)
      setError('')
    } catch (err) {
      // Continue anyway
      setQualityResult({ status: 'PASS', width: img.naturalWidth, height: img.naturalHeight, errors: [], warnings: [], canProceed: true })
    } finally {
      setLoading(false)
    }
  }

  const performDetection = async () => {
    if (!imageElement) return

    setLoading(true)
    setStep(3)
    setError('')

    try {
      const detector = new BandDetector(imageElement)
      const result = await detector.detect()

      setDetectionResult(result)
      setMeasurements(result.measurements)

      if (!result.measurements) {
        setError('Could not detect band measurements automatically. Manual correction required.')
      }

      setStep(4)
    } catch (err) {
      setError(`Detection error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const calculateDose = () => {
    if (!measurements) return

    const inputParams = {
      concentrationPPM: parseFloat(scanData.concentrationPPM) || 10,
      exposureTimeHours: parseFloat(scanData.exposureTimeHours) || 8,
      temperatureC: scanData.temperatureC ? parseFloat(scanData.temperatureC) : undefined,
      relativeHumidity: scanData.relativeHumidity ? parseFloat(scanData.relativeHumidity) : undefined,
      calibrationAlpha: 0.5, // Default calibration constant
    }

    const result = calculateExposureDose(measurements, inputParams)
    setDoseResult(result)
    setStep(6)
  }

  const saveScan = async () => {
    if (!user || !imageFile || !doseResult) return

    setLoading(true)
    setError('')

    try {
      // Generate unique scan ID
      const scanId = crypto.randomUUID()
      const timestamp = new Date().toISOString()

      // Upload original image to Supabase Storage
      const imagePath = `${user.id}/${scanId}/original.${imageFile.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage
        .from('scan-images')
        .upload(imagePath, imageFile)

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Upload processed/annotated image if available
      let processedImagePath = null
      if (detectionResult?.annotatedCanvas) {
        const blob = await new Promise(resolve =>
          detectionResult.annotatedCanvas.toBlob(resolve, 'image/png')
        )
        processedImagePath = `${user.id}/${scanId}/processed.png`
        await supabase.storage
          .from('scan-images')
          .upload(processedImagePath, blob)
      }

      // Create scan record
      const { data: scan, error: scanError } = await supabase
        .from('scans')
        .insert({
          id: scanId,
          user_id: user.id,
          band_id: scanData.bandId || null,
          captured_at: timestamp,
          original_image_path: imagePath,
          processed_image_path: processedImagePath,
          status: 'analyzed',
          integrity_status: measurements.laneR?.integrity || 'UNKNOWN',
          image_quality_status: qualityResult?.status || 'UNKNOWN',
          analysis_method: 'auto',
          analysis_version: 'v1.0',
          manual_correction_used: false,
          notes: scanData.notes || null,
        })
        .select()
        .single()

      if (scanError) {
        throw new Error(`Scan creation failed: ${scanError.message}`)
      }

      // Create measurement record
      await supabase
        .from('scan_measurements')
        .insert({
          scan_id: scanId,
          lane_a_length_mm: measurements.laneA?.lengthMM,
          lane_b_length_mm: measurements.laneB?.lengthMM,
          lane_r_status: measurements.laneR?.status,
          a_b_ratio: doseResult.calculations?.ratio,
          temperature_c: scanData.temperatureC ? parseFloat(scanData.temperatureC) : null,
          relative_humidity: scanData.relativeHumidity ? parseFloat(scanData.relativeHumidity) : null,
          concentration_ppm: scanData.concentrationPPM ? parseFloat(scanData.concentrationPPM) : null,
          exposure_time_hours: scanData.exposureTimeHours ? parseFloat(scanData.exposureTimeHours) : null,
          dose_ppm_hr: doseResult.dose,
          uptake_rate: PROJECT_CONFIG.uptakeRate,
          diffusion_coefficient: PROJECT_CONFIG.diffusionCoefficient,
          inlet_area_cm2: PROJECT_CONFIG.inletArea,
          diffusion_path_cm: PROJECT_CONFIG.diffusionPath,
          calibration_alpha: doseResult.calculations?.calibrationAlpha,
          confidence_score: detectionResult.confidence,
          measurement_json: {
            measurements,
            calculations: doseResult.calculations,
            formulas: doseResult.formulasUsed,
          },
        })

      // Create analysis record
      await supabase
        .from('scan_analysis')
        .insert({
          scan_id: scanId,
          quality_score: qualityResult?.canProceed ? 0.8 : 0.5,
          warnings_json: {
            quality: qualityResult?.warnings || [],
            detection: detectionResult?.warnings || [],
            dose: doseResult?.warnings || [],
          },
          analysis_json: {
            detectionResult,
            qualityResult,
          },
        })

      // Success - redirect to scan details
      router.push(`/scan/${scanId}`)
    } catch (err) {
      setError(err.message || 'Failed to save scan')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading" style={{ width: 40, height: 40 }}></div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <h1 style={{ marginBottom: 8 }}>New Scan</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32 }}>
          Analyze an AEGIS-BAND H₂S dosimetry reading
        </p>

        {/* Progress Steps */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {['Capture', 'Quality', 'Detect', 'Measure', 'Calculate', 'Review'].map((label, i) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  height: 4,
                  background: i + 1 <= step ? 'var(--color-primary)' : 'var(--color-border)',
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {['Capture', 'Quality', 'Detect', 'Measure', 'Calculate', 'Review'].map((label, i) => (
              <span key={label} style={{ flex: 1, textAlign: 'center', fontWeight: i + 1 === step ? 600 : 400, color: i + 1 === step ? 'var(--color-primary)' : undefined }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {/* Step 1: Capture or Upload */}
        {step === 1 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <Camera size={64} strokeWidth={1} style={{ color: 'var(--color-text-tertiary)', marginBottom: 20 }} />
            <h3 style={{ marginBottom: 12 }}>Capture or Upload Band Image</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32 }}>
              Take a clear photo of the entire AEGIS-BAND with all three lanes visible
            </p>

            <div style={{ display: 'grid', gap: 16, maxWidth: 400, margin: '0 auto' }}>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="btn btn-primary btn-lg"
              >
                <Camera size={20} />
                Take Photo
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-lg"
              >
                <Upload size={20} />
                Upload Image
              </button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Step 2: Quality Check */}
        {step === 2 && qualityResult && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Image Quality Check</h3>

              <div style={{ marginBottom: 20 }}>
                {imagePreview && (
                  <img src={imagePreview} alt="Captured band" style={{ width: '100%', borderRadius: 8 }} />
                )}
              </div>

              <div style={{ padding: 16, background: 'var(--color-bg)', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Status:</span>
                  {qualityResult.status === 'PASS' ? (
                    <span className="badge badge-success">PASS</span>
                  ) : qualityResult.status === 'REVIEW' ? (
                    <span className="badge badge-warning">REVIEW</span>
                  ) : (
                    <span className="badge badge-error">FAIL</span>
                  )}
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  Resolution: {qualityResult.width} × {qualityResult.height} pixels
                </div>
              </div>

              {qualityResult.errors.length > 0 && (
                <div className="alert alert-error" style={{ marginBottom: 16 }}>
                  <AlertTriangle size={18} />
                  <div>
                    {qualityResult.errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                </div>
              )}

              {qualityResult.warnings.length > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                  <AlertTriangle size={18} />
                  <div>
                    {qualityResult.warnings.map((warn, i) => (
                      <div key={i}>{warn}</div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => {
                    setStep(1)
                    setImageFile(null)
                    setImagePreview(null)
                    setQualityResult(null)
                  }}
                  className="btn btn-secondary"
                >
                  Retake Photo
                </button>
                <button
                  onClick={performDetection}
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? <span className="loading" /> : 'Continue to Detection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Band Detection (Loading) */}
        {step === 3 && (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div className="loading" style={{ width: 48, height: 48, margin: '0 auto 20px' }}></div>
            <h3>Analyzing Band...</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Detecting lanes, fiducials, and reaction fronts
            </p>
          </div>
        )}

        {/* Step 4: Detection Results & Manual Correction */}
        {step === 4 && detectionResult && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Detection Results</h3>

              <div style={{ marginBottom: 20 }}>
                {detectionResult.annotatedCanvas ? (
                  <canvas
                    ref={(canvas) => {
                      if (canvas && detectionResult.annotatedCanvas) {
                        const ctx = canvas.getContext('2d')
                        canvas.width = detectionResult.annotatedCanvas.width
                        canvas.height = detectionResult.annotatedCanvas.height
                        ctx.drawImage(detectionResult.annotatedCanvas, 0, 0)
                      }
                    }}
                    style={{ width: '100%', borderRadius: 8, border: '1px solid var(--color-border)' }}
                  />
                ) : imagePreview && (
                  <img src={imagePreview} alt="Band" style={{ width: '100%', borderRadius: 8 }} />
                )}
              </div>

              <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                <DetectionStatus label="Band Detected" status={detectionResult.bandDetected} />
                <DetectionStatus label="Fiducials Detected" status={detectionResult.fiducialsDetected} />
                <DetectionStatus label="Lane A Detected" status={detectionResult.lanesDetected.A} />
                <DetectionStatus label="Lane B Detected" status={detectionResult.lanesDetected.B} />
                <DetectionStatus label="Lane R Detected" status={detectionResult.lanesDetected.R} />
              </div>

              <div style={{ padding: 16, background: 'var(--color-bg)', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Detection Confidence</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 8, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${detectionResult.confidence * 100}%`,
                      height: '100%',
                      background: detectionResult.confidence > 0.7 ? 'var(--color-success)' : detectionResult.confidence > 0.5 ? 'var(--color-warning)' : 'var(--color-error)',
                    }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {(detectionResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {detectionResult.warnings.length > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                  <AlertTriangle size={18} />
                  <div>
                    {detectionResult.warnings.map((warn, i) => (
                      <div key={i}>{warn}</div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(5)}
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={!detectionResult.measurements}
              >
                Continue to Measurements
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Measurements & Input Parameters */}
        {step === 5 && measurements && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Measurements</h3>

              <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                <MeasurementDisplay
                  label="Lane A Length"
                  value={measurements.laneA?.lengthMM?.toFixed(2)}
                  unit="mm"
                  detected={measurements.laneA?.detected}
                />
                <MeasurementDisplay
                  label="Lane B Length"
                  value={measurements.laneB?.lengthMM?.toFixed(2)}
                  unit="mm"
                  detected={measurements.laneB?.detected}
                />
                <MeasurementDisplay
                  label="Lane R Integrity"
                  value={measurements.laneR?.status}
                  status={measurements.laneR?.integrity}
                />
                <MeasurementDisplay
                  label="A/B Ratio"
                  value={(measurements.laneA.lengthMM / measurements.laneB.lengthMM).toFixed(3)}
                />
              </div>

              <div className="divider" />

              <h4 style={{ marginTop: 24, marginBottom: 16 }}>Scan Parameters</h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Band ID (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., BAND-2026-001"
                    value={scanData.bandId}
                    onChange={(e) => setScanData({ ...scanData, bandId: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Exposure Time (hours)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="8"
                    value={scanData.exposureTimeHours}
                    onChange={(e) => setScanData({ ...scanData, exposureTimeHours: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Temperature (°C, Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="25"
                    value={scanData.temperatureC}
                    onChange={(e) => setScanData({ ...scanData, temperatureC: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Humidity (% RH, Optional)</label>
                  <input
                    type="number"
                    step="1"
                    className="form-input"
                    placeholder="50"
                    value={scanData.relativeHumidity}
                    onChange={(e) => setScanData({ ...scanData, relativeHumidity: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Additional observations or context..."
                    value={scanData.notes}
                    onChange={(e) => setScanData({ ...scanData, notes: e.target.value })}
                  />
                </div>
              </div>

              <button
                onClick={calculateDose}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 20 }}
              >
                Calculate Dose
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Dose Calculation Results */}
        {step === 6 && doseResult && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Dose Calculation</h3>

              {/* Main Dose Result */}
              <div style={{
                padding: 32,
                background: doseResult.integrityStatus === 'PASS' ? 'var(--color-bg)' : '#fee2e2',
                borderRadius: 8,
                textAlign: 'center',
                marginBottom: 24,
                border: doseResult.integrityStatus === 'PASS' ? '2px solid var(--color-border)' : '2px solid var(--color-error)',
              }}>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Calculated Dose</div>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: doseResult.integrityStatus === 'PASS' ? 'var(--color-primary)' : 'var(--color-error)' }}>
                  {doseResult.dose?.toFixed(2)} <span style={{ fontSize: '1.25rem', fontWeight: 400 }}>ppm·hr</span>
                </div>
                {doseResult.integrityStatus === 'FAIL' && (
                  <div className="badge badge-error" style={{ marginTop: 12 }}>
                    INTEGRITY FAIL — INVALID READING
                  </div>
                )}
              </div>

              {/* Warnings */}
              {doseResult.warnings.length > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: 20 }}>
                  <AlertTriangle size={18} />
                  <div>
                    {doseResult.warnings.map((warn, i) => (
                      <div key={i} style={{ marginTop: i > 0 ? 8 : 0 }}>{warn}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulas */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 16 }}>Formulas Used</h4>
                {doseResult.formulasUsed.map((formula, i) => (
                  <div key={i} style={{ marginBottom: 16, padding: 16, background: 'var(--color-bg)', borderRadius: 8 }}>
                    <h5 style={{ marginBottom: 8 }}>{formula.name}</h5>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, padding: '12px 0', color: 'var(--color-primary)' }}>
                      {formula.formula}
                    </div>
                    {formula.variables && (
                      <div style={{ fontSize: 14, marginTop: 8 }}>
                        {Object.entries(formula.variables).map(([key, value]) => (
                          <div key={key} style={{ padding: '4px 0' }}>
                            <strong>{key}:</strong> {value}
                          </div>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8, marginBottom: 0 }}>
                      {formula.explanation}
                    </p>
                    {formula.note && (
                      <p style={{ fontSize: 13, color: 'var(--color-warning)', marginTop: 8, marginBottom: 0 }}>
                        {formula.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(7)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Review & Save
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Review & Save */}
        {step === 7 && doseResult && (
          <div>
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Review Scan</h3>

              <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Band ID</div>
                  <div style={{ fontWeight: 600 }}>{scanData.bandId || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Calculated Dose</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: doseResult.integrityStatus === 'PASS' ? 'var(--color-primary)' : 'var(--color-error)' }}>
                    {doseResult.dose?.toFixed(2)} ppm·hr
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Integrity Status</div>
                  <div>
                    {doseResult.integrityStatus === 'PASS' ? (
                      <span className="badge badge-success">PASS</span>
                    ) : (
                      <span className="badge badge-error">FAIL</span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Detection Confidence</div>
                  <div>{(detectionResult.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div className="alert alert-warning">
                <AlertTriangle size={18} />
                <div>
                  <strong>Remember:</strong> This is a project prototype. Results represent project specifications, not independently certified measurements.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button
                  onClick={() => setStep(5)}
                  className="btn btn-secondary"
                >
                  Back to Edit
                </button>
                <button
                  onClick={saveScan}
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? <span className="loading" /> : 'Save Scan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function DetectionStatus({ label, status }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 6 }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      {status ? (
        <CheckCircle size={18} color="var(--color-success)" />
      ) : (
        <XCircle size={18} color="var(--color-error)" />
      )}
    </div>
  )
}

function MeasurementDisplay({ label, value, unit, detected, status }) {
  return (
    <div style={{ padding: 12, background: 'var(--color-bg)', borderRadius: 8 }}>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 600 }}>
          {value || '—'} {unit && <span style={{ fontSize: 14, fontWeight: 400 }}>{unit}</span>}
        </span>
        {detected === false && <span className="badge badge-warning">Not Detected</span>}
        {status && (
          status === 'PASS' ? (
            <span className="badge badge-success">PASS</span>
          ) : (
            <span className="badge badge-error">FAIL</span>
          )
        )}
      </div>
    </div>
  )
}
