'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Download, Trash2, Image as ImageIcon } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { getScanById, deleteScan, fetchCloudScanById } from '@/lib/storage/localStorage'
import { PROJECT_CONFIG } from '@/lib/config/project'

export default function ScanDetailPage({ params }) {
  const [scan, setScan] = useState(null)
  const [measurement, setMeasurement] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [imageUrls, setImageUrls] = useState({ original: null, processed: null })
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadScan = async () => {
      const resolvedParams = await params
      const scanId = resolvedParams.id

      let scanData = getScanById(scanId)
      if (!scanData) {
        scanData = await fetchCloudScanById(scanId)
      }

      if (!scanData) {
        router.push('/history')
        return
      }

      setScan(scanData)
      setMeasurement(scanData.scan_measurements?.[0] || null)
      setAnalysis(scanData.scan_analysis?.[0] || null)

      setImageUrls({
        original: scanData.original_image_path || null,
        processed: scanData.processed_image_path || null,
      })

      setLoading(false)
    }

    loadScan()
  }, [params, router])

  const handleDelete = () => {
    if (!scan) return
    setDeleting(true)
    deleteScan(scan.id)
    router.push('/history')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading" style={{ width: 40, height: 40 }}></div>
      </div>
    )
  }

  if (!scan) {
    return null
  }

  const formulas = measurement?.measurement_json?.formulas || []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
        <button
          onClick={() => router.push('/history')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 24,
            padding: '8px 12px',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          <ArrowLeft size={16} /> Back to History
        </button>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
            <div>
              <h1 style={{ marginBottom: 8 }}>Scan Details</h1>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  <Calendar size={14} />
                  {new Date(scan.captured_at).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  <Clock size={14} />
                  {new Date(scan.captured_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-danger btn-sm"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Main Dose Result */}
        <div className="card" style={{
          marginBottom: 24,
          padding: 32,
          textAlign: 'center',
          background: scan.integrity_status === 'PASS' ? 'var(--color-surface)' : '#fee2e2',
          border: scan.integrity_status === 'PASS' ? '2px solid var(--color-border)' : '2px solid var(--color-error)',
        }}>
          <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Measured Dose</div>
          <div style={{
            fontSize: '3rem',
            fontWeight: 700,
            color: scan.integrity_status === 'PASS' ? 'var(--color-primary)' : 'var(--color-error)',
          }}>
            {measurement?.dose_ppm_hr?.toFixed(2) || '—'} <span style={{ fontSize: '1.25rem', fontWeight: 400 }}>ppm·hr</span>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            {scan.integrity_status === 'PASS' ? (
              <span className="badge badge-success" style={{ fontSize: 14, padding: '6px 14px' }}>
                <CheckCircle size={14} /> INTEGRITY PASS
              </span>
            ) : (
              <span className="badge badge-error" style={{ fontSize: 14, padding: '6px 14px' }}>
                <XCircle size={14} /> INTEGRITY FAIL
              </span>
            )}
            {scan.status === 'analyzed' && (
              <span className="badge badge-info" style={{ fontSize: 14, padding: '6px 14px' }}>Analyzed</span>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Images</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {imageUrls.original && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Original</div>
                <img
                  src={imageUrls.original}
                  alt="Original band scan"
                  style={{ width: '100%', borderRadius: 8, border: '1px solid var(--color-border)' }}
                />
              </div>
            )}
            {imageUrls.processed && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Annotated</div>
                <img
                  src={imageUrls.processed}
                  alt="Processed band scan"
                  style={{ width: '100%', borderRadius: 8, border: '1px solid var(--color-border)' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Measurements */}
        {measurement && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Measurements</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <DataField label="Lane A Length" value={`${measurement.lane_a_length_mm?.toFixed(2)} mm`} />
              <DataField label="Lane B Length" value={`${measurement.lane_b_length_mm?.toFixed(2)} mm`} />
              <DataField label="A/B Ratio" value={measurement.a_b_ratio?.toFixed(3)} />
              <DataField label="Lane R Status" value={measurement.lane_r_status} />
              <DataField label="Confidence" value={`${(measurement.confidence_score * 100).toFixed(0)}%`} />
              <DataField label="Image Quality" value={scan.image_quality_status} />
            </div>
          </div>
        )}

        {/* Parameters */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Scan Parameters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <DataField label="Band ID" value={scan.band_id || '—'} />
            <DataField label="Exposure Time" value={measurement?.exposure_time_hours ? `${measurement.exposure_time_hours} hours` : '—'} />
            <DataField label="Temperature" value={measurement?.temperature_c ? `${measurement.temperature_c}°C` : '—'} />
            <DataField label="Humidity" value={measurement?.relative_humidity ? `${measurement.relative_humidity}% RH` : '—'} />
            <DataField label="Analysis Method" value={scan.analysis_method} />
            <DataField label="Manual Correction" value={scan.manual_correction_used ? 'Yes' : 'No'} />
          </div>
          {scan.notes && (
            <div style={{ marginTop: 16, padding: 16, background: 'var(--color-bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Notes</div>
              <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{scan.notes}</div>
            </div>
          )}
        </div>

        {/* Formulas */}
        {formulas.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Formulas Used</h3>
            {formulas.map((formula, i) => (
              <div key={i} style={{
                marginBottom: i < formulas.length - 1 ? 20 : 0,
                padding: 16,
                background: 'var(--color-bg)',
                borderRadius: 8,
              }}>
                <h4 style={{ marginBottom: 8 }}>{formula.name}</h4>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: 16,
                  padding: '12px 0',
                  color: 'var(--color-primary)',
                }}>
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
        )}

        {/* Calibration Info */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Project Configuration</h3>
          <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span>Diffusion Coefficient (D)</span>
              <span style={{ fontWeight: 600 }}>{PROJECT_CONFIG.diffusionCoefficient} cm²/s</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span>Inlet Area (A)</span>
              <span style={{ fontWeight: 600 }}>{PROJECT_CONFIG.inletArea} cm²</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span>Diffusion Path (L)</span>
              <span style={{ fontWeight: 600 }}>{PROJECT_CONFIG.diffusionPath} cm</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span>Uptake Rate (U)</span>
              <span style={{ fontWeight: 600 }}>{PROJECT_CONFIG.uptakeRateML} mL/min</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span>Calibration Alpha</span>
              <span style={{ fontWeight: 600 }}>{measurement?.calibration_alpha || 0.5} ppm·hr/mm</span>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {(analysis?.warnings_json?.quality?.length > 0 ||
          analysis?.warnings_json?.detection?.length > 0 ||
          analysis?.warnings_json?.dose?.length > 0) && (
          <div className="alert alert-warning">
            <AlertTriangle size={18} />
            <div>
              <strong>Warnings:</strong>
              {analysis.warnings_json.quality?.map((w, i) => <div key={`q${i}`}>{w}</div>)}
              {analysis.warnings_json.detection?.map((w, i) => <div key={`d${i}`}>{w}</div>)}
              {analysis.warnings_json.dose?.map((w, i) => <div key={`do${i}`}>{w}</div>)}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div className="card" style={{ maxWidth: 400, margin: 20 }}>
              <h3 style={{ marginBottom: 12 }}>Delete Scan?</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                This will permanently delete this scan and all its data. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  disabled={deleting}
                >
                  {deleting ? <span className="loading" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function DataField({ label, value }) {
  return (
    <div style={{ padding: 12, background: 'var(--color-bg)', borderRadius: 8 }}>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{value || '—'}</div>
    </div>
  )
}
