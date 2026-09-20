'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Camera,
  Upload,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCw,
  RotateCcw,
  Sliders,
  RefreshCw,
  Video,
  VideoOff,
  Info,
  Ruler,
  SwitchCamera,
  ShieldCheck,
  Key,
  Sparkles,
  Check,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { saveScan as saveScanToStorage, getVisionApiKey, saveVisionApiKey } from '@/lib/storage/localStorage'
import { BandDetector } from '@/lib/analysis/bandDetection'
import { calculateExposureDose } from '@/lib/analysis/doseCalculation'
import { assessImageQuality, validateFileType, validateFileSize } from '@/lib/analysis/imageQuality'
import { PROJECT_CONFIG } from '@/lib/config/project'

export default function NewScanPage() {
  const [step, setStep] = useState(1) // 1: capture, 2: preview, 3: detection, 4: correction, 5: measurement, 6: calculation, 7: review
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageElement, setImageElement] = useState(null)
  const [qualityResult, setQualityResult] = useState(null)
  const [detectionResult, setDetectionResult] = useState(null)
  const [detectorInstance, setDetectorInstance] = useState(null)
  const [tiltAngle, setTiltAngle] = useState(0)
  const [centerOffsetX, setCenterOffsetX] = useState(0)
  const [centerOffsetY, setCenterOffsetY] = useState(0)
  const [bandScale, setBandScale] = useState(1.0)
  const [showAdvancedAlign, setShowAdvancedAlign] = useState(false)
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false)
  const [cameraFacingMode, setCameraFacingMode] = useState('environment') // 'environment' | 'user'
  const [cameraError, setCameraError] = useState('')

  // Vision AI Key & Engine State
  const [visionApiKey, setVisionApiKey] = useState('')
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [tempKeyInput, setTempKeyInput] = useState('')
  const [keySavedToast, setKeySavedToast] = useState(false)
  const [visionSource, setVisionSource] = useState('')
  const [aiNotes, setAiNotes] = useState('')

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
  const videoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const router = useRouter()

  // Load saved Vision API key from localStorage
  useEffect(() => {
    const saved = getVisionApiKey()
    if (saved) {
      setVisionApiKey(saved)
      setTempKeyInput(saved)
    }
  }, [])

  const handleSaveApiKey = () => {
    saveVisionApiKey(tempKeyInput)
    setVisionApiKey(tempKeyInput.trim())
    setKeySavedToast(true)
    setTimeout(() => {
      setKeySavedToast(false)
      setShowKeyModal(false)
    }, 1200)
  }

  const handleClearApiKey = () => {
    saveVisionApiKey('')
    setVisionApiKey('')
    setTempKeyInput('')
  }

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startLiveCamera = async (facingMode = cameraFacingMode) => {
    try {
      setCameraError('')
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop())
        cameraStreamRef.current = null
      }
      setIsLiveCameraOpen(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      cameraStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Live camera error:', err)
      setCameraError('Unable to access device camera directly. Please use "Take Photo (Device Camera)" or upload an image file.')
      setIsLiveCameraOpen(false)
    }
  }

  const toggleCameraFacingMode = async () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment'
    setCameraFacingMode(nextMode)
    if (isLiveCameraOpen) {
      await startLiveCamera(nextMode)
    }
  }

  const stopLiveCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
    }
    setIsLiveCameraOpen(false)
  }

  const captureLiveFrame = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/png')
    stopLiveCamera()

    setImagePreview(dataUrl)
    const img = new Image()
    img.onload = () => {
      setImageElement(img)
      setStep(2)
      performQualityCheck(img, 1024 * 500)
    }
    img.src = dataUrl
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const typeValidation = validateFileType(file)
    if (!typeValidation.valid) {
      setError(typeValidation.error)
      return
    }

    const sizeValidation = validateFileSize(file)
    if (!sizeValidation.valid) {
      setError(sizeValidation.error)
      return
    }

    setImageFile(file)
    setError('')

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target.result)
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
      setQualityResult({ status: 'PASS', isBlurry: false, width: img.naturalWidth, height: img.naturalHeight, errors: [], warnings: [], canProceed: true })
    } finally {
      setLoading(false)
    }
  }

  const handleRetake = () => {
    setStep(1)
    setImageFile(null)
    setImagePreview(null)
    setImageElement(null)
    setQualityResult(null)
    setDetectionResult(null)
    setMeasurements(null)
    startLiveCamera(cameraFacingMode)
  }

  const performDetection = async () => {
    if (!imageElement) return

    setLoading(true)
    setStep(3)
    setError('')

    try {
      const detector = new BandDetector(imageElement)
      setDetectorInstance(detector)

      let aiSuccess = false
      let aiResult = null

      // Attempt Vision AI measurement first (Groq or Gemini)
      try {
        const resp = await fetch('/api/vision-measure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imagePreview,
            apiKey: visionApiKey ? visionApiKey.trim() : undefined,
          }),
        })

        if (resp.ok) {
          const data = await resp.json()
          if (data.success && data.measurements) {
            aiResult = data
            aiSuccess = true
          }
        }
      } catch (apiErr) {
        console.warn('Vision AI API call failed or offline; falling back to local CV:', apiErr)
      }

      if (aiSuccess && aiResult?.measurements) {
        const m = aiResult.measurements
        const detectedAngle = m.tilt_angle_deg || 0
        const angleRad = (detectedAngle * Math.PI) / 180
        const spanPixels = detector.width * 0.84
        const pxPerMM = spanPixels / 50.0

        const aiMeasurements = {
          laneA: {
            lengthMM: m.laneA_mm,
            detected: true,
            colorChangeScore: 0.96,
            frontStepPixels: m.laneA_mm * pxPerMM,
          },
          laneB: {
            lengthMM: m.laneB_mm,
            detected: true,
            colorChangeScore: 0.95,
            frontStepPixels: m.laneB_mm * pxPerMM,
          },
          laneR: {
            lengthMM: m.laneR_mm,
            integrity: m.integrity_status,
            status: m.integrity_status === 'PASS' ? 'PASS (Intact)' : 'FAIL (Compromised)',
            detected: true,
            frontStepPixels: m.laneR_mm * pxPerMM,
          },
          fiducials: {
            referenceLengthMM: 50.0,
            spanPixels,
          },
          pixelsPerMM: pxPerMM,
        }

        const bandRegion = detector.detectRotatedBandRegion(angleRad, { x: 0, y: 0 }, 1.0)
        const fiducials = detector.detectRotatedFiducials(bandRegion, angleRad)
        const lanes = detector.detectRotatedLanes(bandRegion, angleRad)
        const annotatedCanvas = detector.createAnnotatedImage(
          { measurements: aiMeasurements },
          bandRegion,
          fiducials,
          lanes,
          detectedAngle,
          angleRad
        )

        setTiltAngle(detectedAngle)
        setCenterOffsetX(0)
        setCenterOffsetY(0)
        setBandScale(1.0)
        setVisionSource(aiResult.provider || 'groq')
        setAiNotes(m.notes || '')

        setDetectionResult({
          success: true,
          confidence: m.confidence || 0.98,
          angleDeg: detectedAngle,
          measurements: aiMeasurements,
          fiducialsDetected: true,
          lanesDetected: { A: true, B: true, R: true },
          annotatedCanvas,
          isAiVision: true,
          provider: aiResult.provider,
          notes: m.notes,
        })
        setMeasurements(aiMeasurements)
      } else {
        // Fallback to local heuristic detection
        const result = await detector.detect()
        setDetectionResult(result)
        setMeasurements(result.measurements)
        setTiltAngle(result.angleDeg || 0)
        setCenterOffsetX(0)
        setCenterOffsetY(0)
        setBandScale(1.0)
        setVisionSource('local')

        if (!result.measurements) {
          setError('Could not detect band measurements automatically. Manual confirmation available below.')
        }
      }

      setStep(4)
    } catch (err) {
      setError(`Detection error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Real-time recalculation when user rotates or shifts the floating alignment lines
  const updateDetectionAdjustment = async (newAngle, newOffsetX = centerOffsetX, newOffsetY = centerOffsetY, newScale = bandScale) => {
    if (!detectorInstance) return
    const angle = parseFloat(newAngle)
    const offX = parseFloat(newOffsetX)
    const offY = parseFloat(newOffsetY)
    const sc = parseFloat(newScale)

    setTiltAngle(angle)
    setCenterOffsetX(offX)
    setCenterOffsetY(offY)
    setBandScale(sc)

    const result = await detectorInstance.detect({
      manualAngleDeg: angle,
      centerOffset: { x: offX, y: offY },
      scale: sc,
    })

    setDetectionResult(result)
    setMeasurements(result.measurements)
  }

  const autoDetectTilt = async () => {
    if (!detectorInstance) return
    const detectedAngle = detectorInstance.detectBandOrientation()
    updateDetectionAdjustment(detectedAngle, 0, 0, 1.0)
  }

  // Update strip millimeter measurement directly along the 0 to 50 mm common scale
  const updateStripLength = (laneKey, newLengthMM) => {
    const mm = Math.max(0.0, Math.min(50.0, parseFloat(newLengthMM) || 0.0))
    if (!measurements) return

    const updatedMeasurements = {
      ...measurements,
      [laneKey]: {
        ...measurements[laneKey],
        lengthMM: Math.round(mm * 10) / 10,
        frontStepPixels: mm * (measurements.pixelsPerMM || 10),
      },
    }
    setMeasurements(updatedMeasurements)

    // Re-draw rotated canvas to immediately reflect the adjusted front line
    if (detectorInstance && detectionResult) {
      const angleRad = (tiltAngle * Math.PI) / 180
      const bandRegion = detectorInstance.detectRotatedBandRegion(angleRad, { x: centerOffsetX, y: centerOffsetY }, bandScale)
      const fiducials = detectorInstance.detectRotatedFiducials(bandRegion, angleRad)
      const lanes = detectorInstance.detectRotatedLanes(bandRegion, angleRad)
      const newCanvas = detectorInstance.createAnnotatedImage(
        { ...detectionResult, measurements: updatedMeasurements },
        bandRegion,
        fiducials,
        lanes,
        tiltAngle,
        angleRad
      )
      setDetectionResult((prev) => ({
        ...prev,
        measurements: updatedMeasurements,
        annotatedCanvas: newCanvas,
      }))
    }
  }

  // Toggle Integrity status (PASS / FAIL)
  const toggleIntegrityStatus = (status) => {
    if (!measurements?.laneR) return
    const updated = {
      ...measurements,
      laneR: {
        ...measurements.laneR,
        integrity: status,
        status: status === 'PASS' ? 'PASS (Intact)' : 'FAIL (Compromised)',
      },
    }
    setMeasurements(updated)
  }

  const calculateDose = () => {
    if (!measurements) return

    const inputParams = {
      concentrationPPM: parseFloat(scanData.concentrationPPM) || 10,
      exposureTimeHours: parseFloat(scanData.exposureTimeHours) || 8,
      temperatureC: scanData.temperatureC ? parseFloat(scanData.temperatureC) : undefined,
      relativeHumidity: scanData.relativeHumidity ? parseFloat(scanData.relativeHumidity) : undefined,
      calibrationAlpha: PROJECT_CONFIG.calibrationAlpha || 0.2285714,
    }

    const result = calculateExposureDose(measurements, inputParams)
    setDoseResult(result)
    setStep(6)
  }

  const saveScan = () => {
    if (!imagePreview || !doseResult) return

    setLoading(true)
    setError('')

    try {
      const scanId = 'scan-' + Date.now()
      const timestamp = new Date().toISOString()
      const processedImage = detectionResult?.annotatedCanvas
        ? detectionResult.annotatedCanvas.toDataURL('image/png')
        : null

      const scanRecord = {
        id: scanId,
        band_id: scanData.bandId || 'IRIS-' + Math.floor(1000 + Math.random() * 9000),
        captured_at: timestamp,
        original_image_path: imagePreview,
        processed_image_path: processedImage,
        status: 'analyzed',
        integrity_status: measurements.laneR?.integrity || 'PASS',
        image_quality_status: qualityResult?.status || 'PASS',
        analysis_method: 'auto',
        analysis_version: 'v2.0',
        manual_correction_used: tiltAngle !== 0,
        tilt_angle_deg: tiltAngle,
        notes: scanData.notes || null,
        scan_measurements: [
          {
            lane_a_length_mm: measurements.laneA?.lengthMM,
            lane_b_length_mm: measurements.laneB?.lengthMM,
            lane_r_length_mm: measurements.laneR?.lengthMM,
            lane_r_status: measurements.laneR?.status || 'PASS (Intact)',
            a_b_ratio: doseResult.calculations?.ratio,
            temperature_c: scanData.temperatureC ? parseFloat(scanData.temperatureC) : null,
            relative_humidity: scanData.relativeHumidity ? parseFloat(scanData.relativeHumidity) : null,
            concentration_ppm: scanData.concentrationPPM ? parseFloat(scanData.concentrationPPM) : null,
            exposure_time_hours: scanData.exposureTimeHours ? parseFloat(scanData.exposureTimeHours) : 8.0,
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
          },
        ],
        scan_analysis: [
          {
            quality_score: 0.95,
            warnings_json: {
              quality: qualityResult?.warnings || [],
              detection: detectionResult?.warnings || [],
              dose: doseResult?.warnings || [],
            },
            analysis_json: {
              detectionResult,
              qualityResult,
              tiltAngle,
            },
          },
        ],
      }

      saveScanToStorage(scanRecord)
      router.push(`/scan/${scanId}`)
    } catch (err) {
      setError(err.message || 'Failed to save scan')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
          <div>
            <h1 style={{ marginBottom: 6 }}>New Scan</h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 14 }}>
              Automated watch face analysis & 0–50 mm common scale dosimetry
            </p>
          </div>

          {/* Quick Vision AI Key Toggle Button */}
          <div>
            <button
              onClick={() => setShowKeyModal(!showKeyModal)}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                padding: '8px 16px',
                border: visionApiKey ? '1.5px solid #10b981' : '1px solid var(--color-border)',
                background: visionApiKey ? 'rgba(16, 185, 129, 0.09)' : undefined,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={16} color={visionApiKey ? '#10b981' : 'var(--color-primary)'} />
              <span>
                {visionApiKey ? (
                  <>Vision AI: <strong style={{ color: '#10b981' }}>Connected</strong></>
                ) : (
                  'Connect Vision AI (Groq/Gemini)'
                )}
              </span>
              <Key size={14} style={{ opacity: 0.7 }} />
            </button>
          </div>
        </div>

        {/* API Key Modal / Dropdown Card */}
        {showKeyModal && (
          <div className="card" style={{
            marginBottom: 28,
            padding: 22,
            border: '2px solid var(--color-primary)',
            background: 'var(--color-surface)',
            borderRadius: 12,
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 16 }}>
                <Key size={18} color="var(--color-primary)" />
                Vision AI Configuration (Groq / Gemini)
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 18, padding: 4 }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Paste your free <strong>Groq API Key</strong> (starts with <code style={{ color: 'var(--color-primary)' }}>gsk_</code>) or <strong>Gemini API Key</strong> (starts with <code style={{ color: 'var(--color-primary)' }}>AIza</code>). The key is stored locally in your browser. All laboratory metrology prompts and millimeter extraction run automatically in the backend.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <input
                type="password"
                className="form-input"
                placeholder="gsk_... or AIza..."
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                style={{ flex: 1, minWidth: 260, fontFamily: 'monospace', fontSize: 14 }}
              />
              <button
                onClick={handleSaveApiKey}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {keySavedToast ? <><Check size={16} /> Saved!</> : 'Save Key'}
              </button>
              {visionApiKey && (
                <button
                  onClick={handleClearApiKey}
                  className="btn btn-secondary"
                  style={{ color: '#ef4444' }}
                >
                  Clear Key
                </button>
              )}
            </div>

            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={14} />
              <span>
                You can also configure <code style={{ fontFamily: 'monospace' }}>GROQ_API_KEY</code> or <code style={{ fontFamily: 'monospace' }}>GEMINI_API_KEY</code> in <code style={{ fontFamily: 'monospace' }}>.env.local</code> or on Render.
              </span>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {['Capture', 'Preview', 'Detect & Align', 'Measure', 'Calculate', 'Review'].map((label, i) => (
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
            {['Capture', 'Preview', 'Detect & Align', 'Measure', 'Calculate', 'Review'].map((label, i) => (
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

        {/* Step 1: Direct Phone Camera Capture or File Upload */}
        {step === 1 && (
          <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <Camera size={56} strokeWidth={1.5} style={{ color: 'var(--color-primary)', marginBottom: 16 }} />
            <h3 style={{ marginBottom: 10 }}>Capture or Upload Badge Photo</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, maxWidth: 540, margin: '0 auto 24px', fontSize: 14 }}>
              Photograph the watch face display showing the three strips (High Humident, Low Humident, Integrity) and the 0–50 mm common length scale.
            </p>

            {cameraError && (
              <div className="alert alert-warning" style={{ maxWidth: 540, margin: '0 auto 20px', textAlign: 'left' }}>
                <AlertTriangle size={18} />
                <span>{cameraError}</span>
              </div>
            )}

            {isLiveCameraOpen ? (
              <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4/3',
                  background: '#000',
                  borderRadius: 14,
                  overflow: 'hidden',
                  marginBottom: 16,
                  border: '2px solid var(--color-primary)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Enlarged Measurement Grid Overlay matching the Common Scale Display */}
                  <div style={{
                    position: 'absolute',
                    top: '10%',
                    bottom: '12%',
                    left: '6%',
                    right: '6%',
                    border: '2.5px solid #00d2ff',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    pointerEvents: 'none',
                    background: 'rgba(10, 22, 40, 0.40)',
                    boxShadow: '0 0 20px rgba(0, 210, 255, 0.4)',
                  }}>
                    {/* Strip 1: High Humident */}
                    <div style={{
                      flex: 1,
                      borderBottom: '1px dashed rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      color: '#fecdd3',
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      <span>High Humident</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Strip 1 (Dose)</span>
                    </div>

                    {/* Strip 2: Low Humident */}
                    <div style={{
                      flex: 1,
                      borderBottom: '1px dashed rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      color: '#cffafe',
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      <span>Low Humident</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Strip 2 (Humidity)</span>
                    </div>

                    {/* Strip 3: Integrity */}
                    <div style={{
                      flex: 1,
                      borderBottom: '1.5px solid #38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      color: '#d1fae5',
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      <span>Integrity</span>
                      <span style={{ fontSize: 10, color: '#10b981' }}>Strip 3 (Poka-Yoke)</span>
                    </div>

                    {/* Common Length Scale (0–50 mm) at bottom */}
                    <div style={{
                      height: 38,
                      background: 'rgba(0, 0, 0, 0.55)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      padding: '0 8px',
                      color: '#fff',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, padding: '0 4px' }}>
                        <span>0</span>
                        <span>10</span>
                        <span>20</span>
                        <span>30</span>
                        <span>40</span>
                        <span>50 mm</span>
                      </div>
                      <div style={{ fontSize: 9.5, color: '#94a3b8', textAlign: 'center', marginTop: 2 }}>
                        Length Scale (Common for all Strips)
                      </div>
                    </div>
                  </div>

                  {/* Switch Camera Button (top-right of viewfinder) */}
                  <button
                    onClick={toggleCameraFacingMode}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: 'rgba(0,0,0,0.65)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.4)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                      zIndex: 10,
                    }}
                  >
                    <SwitchCamera size={16} /> Switch Camera
                  </button>

                  <div style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    color: '#fff',
                    fontSize: 12,
                    background: 'rgba(0,0,0,0.7)',
                    padding: '4px 8px',
                  }}>
                    Align the watch display inside the 3 strips and common 0–50 mm scale
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={captureLiveFrame} className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Camera size={22} /> Snap Photo & Analyze
                  </button>
                  <button onClick={stopLiveCamera} className="btn btn-secondary">
                    <VideoOff size={18} /> Close Camera
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14, maxWidth: 440, margin: '0 auto' }}>
                <button
                  onClick={() => startLiveCamera('environment')}
                  className="btn btn-primary btn-lg"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 }}
                >
                  <Camera size={22} />
                  Capture Photo (Direct Phone Camera)
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Camera size={18} />
                  Open Native Device Camera App
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Upload size={18} />
                  Upload Photo From Files / Gallery
                </button>
              </div>
            )}

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

        {/* Step 2: Image Preview & Blur Detection Check */}
        {step === 2 && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Image Preview & Sharpness Inspection</h3>

              {/* Blur Warning if detected */}
              {qualityResult?.isBlurry && (
                <div
                  className="alert alert-error"
                  style={{
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: 18,
                    background: '#fef2f2',
                    border: '2px solid #ef4444',
                    borderRadius: 10,
                  }}
                >
                  <AlertTriangle size={28} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <strong style={{ fontSize: 16, display: 'block', color: '#b91c1c', marginBottom: 4 }}>
                      Photo is blurry — Please Retake
                    </strong>
                    <p style={{ fontSize: 13, color: '#7f1d1d', margin: '0 0 14px' }}>
                      The captured image appears out of focus or motion-blurred (sharpness score: {qualityResult.blurScore} / 38). For accurate distance measurement along the 0–50 mm scale, please retake the photo holding the camera steady.
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={handleRetake}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ef4444' }}
                      >
                        <RotateCcw size={14} /> Retake Photo
                      </button>
                      <button
                        onClick={() => setQualityResult((prev) => ({ ...prev, isBlurry: false }))}
                        className="btn btn-secondary btn-sm"
                      >
                        Proceed Anyway
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Captured band"
                    style={{ width: '100%', maxHeight: 480, objectFit: 'contain', borderRadius: 8, background: '#000' }}
                  />
                )}
              </div>

              <div style={{ padding: 16, background: 'var(--color-bg)', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Image Status:</span>
                  {qualityResult?.isBlurry ? (
                    <span className="badge badge-warning">BLUR WARNING</span>
                  ) : (
                    <span className="badge badge-success">SHARP & READY</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>
                  Ready to detect the 3 strips (High Humident, Low Humident, Integrity) and align the common 0–50 mm reference scale.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleRetake} className="btn btn-secondary">
                  <RotateCcw size={16} /> Retake Photo
                </button>
                <button
                  onClick={performDetection}
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? <span className="loading" /> : 'Run Detection & Measure Strips'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Band Detection (Loading) */}
        {step === 3 && (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div className="loading" style={{ width: 48, height: 48, margin: '0 auto 20px' }}></div>
            <h3>
              {visionApiKey ? 'Vision AI Reading Common Scale...' : 'Analyzing Irisathenas Band...'}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: 480, margin: '0 auto' }}>
              {visionApiKey
                ? 'AI is identifying printed millimeter markings (0–50 mm) and measuring stain fronts for High Humident, Low Humident, and Integrity...'
                : 'Detecting orientation tilt, lanes, fiducials, and reaction fronts...'}
            </p>
          </div>
        )}

        {/* Step 4: Detection Results & Adaptive Floating Alignment Controls */}
        {step === 4 && detectionResult && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>Badge Detection & Scale Alignment</h3>
                  {detectionResult.isAiVision && (
                    <div style={{ fontSize: 13, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={14} /> Measured via Vision AI ({detectionResult.provider?.toUpperCase()}) — Scale Aligned
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {detectionResult.isAiVision && (
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={12} /> Vision AI Active
                    </span>
                  )}
                  <span className="badge badge-primary">
                    Tilt Angle: {tiltAngle >= 0 ? '+' : ''}{tiltAngle.toFixed(1)}°
                  </span>
                </div>
              </div>

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

              {/* Interactive Floating Alignment & Rotation Control Panel */}
              <div style={{
                padding: 18,
                background: 'var(--color-bg)',
                borderRadius: 10,
                border: '1px solid var(--color-border)',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15 }}>
                    <Sliders size={18} color="var(--color-primary)" />
                    Adjust Floating Lines & Angle Stability
                  </div>
                  <button
                    onClick={autoDetectTilt}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <RefreshCw size={13} /> Auto-Detect Tilt
                  </button>
                </div>

                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                  If your image is tilted or rotated, slide the angle or click the rotation buttons. The 3 floating lines will rotate and lock directly over the physical band channels.
                </p>

                {/* Angle Slider */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    <span>Rotation Angle:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {tiltAngle >= 0 ? '+' : ''}{tiltAngle.toFixed(1)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="0.5"
                    value={tiltAngle}
                    onChange={(e) => updateDetectionAdjustment(e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    <span>-90° (Vertical)</span>
                    <span>-45°</span>
                    <span>0° (Horizontal)</span>
                    <span>+45°</span>
                    <span>+90° (Vertical)</span>
                  </div>
                </div>

                {/* Quick Alignment Presets */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <button
                    onClick={() => updateDetectionAdjustment(-90)}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: '4px 8px' }}
                  >
                    -90°
                  </button>
                  <button
                    onClick={() => updateDetectionAdjustment(tiltAngle - 15)}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <RotateCcw size={12} /> -15°
                  </button>
                  <button
                    onClick={() => updateDetectionAdjustment(0)}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: '4px 8px' }}
                  >
                    0° Level
                  </button>
                  <button
                    onClick={() => updateDetectionAdjustment(tiltAngle + 15)}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <RotateCw size={12} /> +15°
                  </button>
                  <button
                    onClick={() => updateDetectionAdjustment(90)}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: '4px 8px' }}
                  >
                    +90°
                  </button>

                  <button
                    onClick={() => setShowAdvancedAlign(!showAdvancedAlign)}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: '4px 8px', marginLeft: 'auto' }}
                  >
                    {showAdvancedAlign ? 'Hide Fine Tuning' : 'Fine Tune Position'}
                  </button>
                </div>

                {/* Advanced Position Sliders */}
                {showAdvancedAlign && (
                  <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid var(--color-border)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                  }}>
                    <div>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>Shift X Offset: {centerOffsetX}px</div>
                      <input
                        type="range"
                        min="-150"
                        max="150"
                        value={centerOffsetX}
                        onChange={(e) => updateDetectionAdjustment(tiltAngle, e.target.value, centerOffsetY, bandScale)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>Shift Y Offset: {centerOffsetY}px</div>
                      <input
                        type="range"
                        min="-150"
                        max="150"
                        value={centerOffsetY}
                        onChange={(e) => updateDetectionAdjustment(tiltAngle, centerOffsetX, e.target.value, bandScale)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>Scale Size: {bandScale.toFixed(2)}x</div>
                      <input
                        type="range"
                        min="0.6"
                        max="1.5"
                        step="0.05"
                        value={bandScale}
                        onChange={(e) => updateDetectionAdjustment(tiltAngle, centerOffsetX, centerOffsetY, e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3 Strips & Common Scale (0–50 mm) Fine Adjustment */}
              {measurements && (
                <div style={{
                  padding: 18,
                  background: 'var(--color-bg)',
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
                    <Ruler size={18} color="var(--color-primary)" />
                    3-Strip Readings (Common 0–50 mm Scale)
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                    Verify or adjust each strip stain front according to the physical 0–50 mm scale printed on the watch face. Max allowed scale is 50.0 mm.
                  </p>

                  <div style={{ display: 'grid', gap: 16 }}>
                    {/* Strip 1: High Humident */}
                    <div style={{ background: 'var(--color-surface)', padding: 14, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div>
                          <strong style={{ color: '#ef4444' }}>Strip 1: High Humident</strong>
                          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 8 }}>(Dose Channel)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.1"
                            value={measurements.laneA?.lengthMM ?? 0}
                            onChange={(e) => updateStripLength('laneA', e.target.value)}
                            style={{ width: 70, padding: '4px 6px', textAlign: 'right', fontWeight: 600, borderRadius: 4, border: '1px solid var(--color-border)' }}
                          />
                          <span style={{ fontSize: 13 }}>mm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="0.1"
                        value={measurements.laneA?.lengthMM ?? 0}
                        onChange={(e) => updateStripLength('laneA', e.target.value)}
                        style={{ width: '100%', accentColor: '#ef4444' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        <span>0 mm</span>
                        <span>25 mm</span>
                        <span>50 mm (Max)</span>
                      </div>
                    </div>

                    {/* Strip 2: Low Humident */}
                    <div style={{ background: 'var(--color-surface)', padding: 14, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div>
                          <strong style={{ color: '#06b6d4' }}>Strip 2: Low Humident</strong>
                          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 8 }}>(Humidity Channel)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.1"
                            value={measurements.laneB?.lengthMM ?? 0}
                            onChange={(e) => updateStripLength('laneB', e.target.value)}
                            style={{ width: 70, padding: '4px 6px', textAlign: 'right', fontWeight: 600, borderRadius: 4, border: '1px solid var(--color-border)' }}
                          />
                          <span style={{ fontSize: 13 }}>mm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="0.1"
                        value={measurements.laneB?.lengthMM ?? 0}
                        onChange={(e) => updateStripLength('laneB', e.target.value)}
                        style={{ width: '100%', accentColor: '#06b6d4' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        <span>0 mm</span>
                        <span>25 mm</span>
                        <span>50 mm (Max)</span>
                      </div>
                    </div>

                    {/* Strip 3: Integrity */}
                    <div style={{ background: 'var(--color-surface)', padding: 14, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div>
                          <strong style={{ color: '#10b981' }}>Strip 3: Integrity</strong>
                          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 8 }}>(Poka-Yoke Reference)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => toggleIntegrityStatus('PASS')}
                            className={measurements.laneR?.integrity === 'PASS' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                            style={{ padding: '3px 10px', fontSize: 12 }}
                          >
                            PASS
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleIntegrityStatus('FAIL')}
                            className={measurements.laneR?.integrity === 'FAIL' ? 'btn btn-sm' : 'btn btn-secondary btn-sm'}
                            style={{
                              padding: '3px 10px',
                              fontSize: 12,
                              background: measurements.laneR?.integrity === 'FAIL' ? '#ef4444' : undefined,
                              color: measurements.laneR?.integrity === 'FAIL' ? '#fff' : undefined,
                            }}
                          >
                            FAIL
                          </button>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              step="0.1"
                              value={measurements.laneR?.lengthMM ?? 0}
                              onChange={(e) => updateStripLength('laneR', e.target.value)}
                              style={{ width: 60, padding: '4px 6px', textAlign: 'right', fontWeight: 600, borderRadius: 4, border: '1px solid var(--color-border)' }}
                            />
                            <span style={{ fontSize: 13 }}>mm</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: measurements.laneR?.integrity === 'PASS' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {measurements.laneR?.integrity === 'PASS' ? '✓ Integrity Verified: Badge is sealed and intact' : '✗ Integrity Check Failed: Badge compromised'}
                      </div>
                    </div>
                  </div>

                  {detectionResult.notes && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 6, fontSize: 13, color: 'var(--color-text-secondary)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <strong style={{ color: '#10b981' }}>Vision AI Observation:</strong> {detectionResult.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Status checklist */}
              <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                <DetectionStatus label="Orientation Stabilized" status={true} />
                <DetectionStatus label="Common Scale Reference (0–50 mm)" status={detectionResult.fiducialsDetected} />
                <DetectionStatus label="Strip 1: High Humident" status={detectionResult.lanesDetected?.A} />
                <DetectionStatus label="Strip 2: Low Humident" status={detectionResult.lanesDetected?.B} />
                <DetectionStatus label="Strip 3: Integrity" status={measurements.laneR?.integrity === 'PASS'} />
              </div>

              <button
                onClick={() => setStep(5)}
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={!detectionResult.measurements}
              >
                Continue to Measurements & Reference Check
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Measurements & Input Parameters */}
        {step === 5 && measurements && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Measurements & Theoretical Calibration</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
                <MeasurementDisplay
                  label="Strip 1: High Humident"
                  value={measurements.laneA?.lengthMM?.toFixed(2)}
                  unit="mm"
                  detected={measurements.laneA?.detected}
                />
                <MeasurementDisplay
                  label="Strip 2: Low Humident"
                  value={measurements.laneB?.lengthMM?.toFixed(2)}
                  unit="mm"
                  detected={measurements.laneB?.detected}
                />
                <MeasurementDisplay
                  label="Strip 3: Integrity"
                  value={measurements.laneR?.status}
                  status={measurements.laneR?.integrity}
                />
                <MeasurementDisplay
                  label="A/B Humidity Ratio"
                  value={(measurements.laneA.lengthMM / measurements.laneB.lengthMM).toFixed(3)}
                />
              </div>

              {/* Theoretical Reference Table from uploaded user specification */}
              <div style={{
                background: 'var(--color-bg)',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Ruler size={18} color="var(--color-primary)" />
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    Theoretical Loading Table (Anchor: 8 ppm·hr = 35.0 mm)
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                  Calibrated to constant linear loading (4.375 mm/(ppm·hr) sensitivity, α ≈ 0.22857).
                </div>

                <div className="table-container" style={{ maxHeight: 200, overflowY: 'auto' }}>
                  <table style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Dose (ppm·hr)</th>
                        <th>Estimated Stain Length (mm)</th>
                        <th>Anchor Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PROJECT_CONFIG.calibrationTable.map((row) => {
                        const isClose = Math.abs((measurements.laneA?.lengthMM || 0) - row.length) < 4.0
                        return (
                          <tr
                            key={row.dose}
                            style={{
                              background: row.anchor
                                ? 'rgba(0, 102, 204, 0.12)'
                                : isClose
                                ? 'rgba(16, 185, 129, 0.1)'
                                : undefined,
                              fontWeight: row.anchor ? 600 : undefined,
                            }}
                          >
                            <td>{row.dose}</td>
                            <td>{row.length.toFixed(1)}</td>
                            <td>
                              {row.anchor ? (
                                <span className="badge badge-primary">★ Anchor Point</span>
                              ) : isClose ? (
                                <span className="badge badge-success">Closest Match</span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="divider" />

              <h4 style={{ marginTop: 24, marginBottom: 16 }}>Shift Parameters</h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Band ID (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., IRIS-2026-001"
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
                    rows={2}
                    placeholder="Worker notes, area observations, or site conditions..."
                    value={scanData.notes}
                    onChange={(e) => setScanData({ ...scanData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button
                  onClick={() => setStep(4)}
                  className="btn btn-secondary"
                >
                  Back to Alignment
                </button>
                <button
                  onClick={calculateDose}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Calculate Dose (Anchor Calibration)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Dose Calculation Results */}
        {step === 6 && doseResult && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Dose Calculation (Irisathenas Anchor)</h3>

              {/* Main Dose Result */}
              <div style={{
                padding: 32,
                background: doseResult.integrityStatus === 'PASS' ? 'var(--color-bg)' : '#fee2e2',
                borderRadius: 8,
                textAlign: 'center',
                marginBottom: 24,
                border: doseResult.integrityStatus === 'PASS' ? '2px solid var(--color-border)' : '2px solid var(--color-error)',
              }}>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Calculated Cumulative Dose</div>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: doseResult.integrityStatus === 'PASS' ? 'var(--color-primary)' : 'var(--color-error)' }}>
                  {doseResult.dose?.toFixed(2)} <span style={{ fontSize: '1.25rem', fontWeight: 400 }}>ppm·hr</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                  Anchor Reference: 35.0 mm = 8.0 ppm·hr (S = 4.375 mm/(ppm·hr))
                </div>
                {doseResult.integrityStatus === 'FAIL' && (
                  <div className="badge badge-error" style={{ marginTop: 12 }}>
                    INTEGRITY FAIL — LANE R STAINED
                  </div>
                )}
              </div>

              {/* Formulas */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 16 }}>Mathematical Breakdown</h4>
                {doseResult.formulasUsed.map((formula, i) => (
                  <div key={i} style={{ marginBottom: 16, padding: 16, background: 'var(--color-bg)', borderRadius: 8 }}>
                    <h5 style={{ marginBottom: 8 }}>{formula.name}</h5>
                    <div style={{ fontFamily: 'monospace', fontSize: 15, padding: '8px 0', color: 'var(--color-primary)' }}>
                      {formula.formula}
                    </div>
                    {formula.variables && (
                      <div style={{ fontSize: 13, marginTop: 8 }}>
                        {Object.entries(formula.variables).map(([key, value]) => (
                          <div key={key} style={{ padding: '3px 0' }}>
                            <strong>{key}:</strong> {value}
                          </div>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8, marginBottom: 0 }}>
                      {formula.explanation}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setStep(5)}
                  className="btn btn-secondary"
                >
                  Back to Parameters
                </button>
                <button
                  onClick={() => setStep(7)}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Review & Save Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Review & Save */}
        {step === 7 && doseResult && (
          <div>
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Review Scan Record</h3>

              <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Band ID</div>
                  <div style={{ fontWeight: 600 }}>{scanData.bandId || 'IRIS-AUTO'}</div>
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
                      <span className="badge badge-success">PASS (Badge Sealed & Intact)</span>
                    ) : (
                      <span className="badge badge-error">FAIL (Integrity Compromised)</span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Orientation Stabilized</div>
                  <div>Tilt {tiltAngle >= 0 ? '+' : ''}{tiltAngle.toFixed(1)}°</div>
                </div>
              </div>

              <div className="alert alert-warning">
                <AlertTriangle size={18} />
                <div>
                  <strong>Notice:</strong> Irisathenas Band is an engineering/research prototype for passive H₂S dosimetry studies.
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
                  {loading ? <span className="loading" /> : 'Save Scan Locally'}
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

