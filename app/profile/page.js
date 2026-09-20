'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Building, Hash, Save, ArrowLeft, ShieldCheck, HardDrive, Download, RotateCcw, Trash2, Sparkles, Check } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { getProfile, saveProfile, getAllScans, resetSampleScans, clearAllLocalData, getVisionApiKey, saveVisionApiKey } from '@/lib/storage/localStorage'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    organization: '',
    worker_id: '',
    email: '',
  })
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    setApiKeyInput(getVisionApiKey())
  }, [])

  const handleSaveApiKey = () => {
    saveVisionApiKey(apiKeyInput)
    setApiKeySaved(true)
    setTimeout(() => setApiKeySaved(false), 2000)
  }

  const handleClearApiKey = () => {
    saveVisionApiKey('')
    setApiKeyInput('')
  }

  useEffect(() => {
    const profileData = getProfile()
    if (profileData) {
      setProfile(profileData)
      setFormData({
        full_name: profileData.full_name || '',
        organization: profileData.organization || '',
        worker_id: profileData.worker_id || '',
        email: profileData.email || 'operator@irisathenas.local',
      })
    }
    const scans = getAllScans()
    setScanCount(scans.length)
    setLoading(false)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const updated = saveProfile({
        ...profile,
        full_name: formData.full_name,
        organization: formData.organization || null,
        worker_id: formData.worker_id || null,
        email: formData.email || null,
        updated_at: new Date().toISOString(),
      })

      setProfile(updated)
      setMessage('Profile updated successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const exportData = () => {
    const data = {
      profile: getProfile(),
      scans: getAllScans(),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `irisathenas-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleResetData = () => {
    if (confirm('Reset to initial sample scans? Your local scans will be refreshed.')) {
      resetSampleScans()
      setScanCount(getAllScans().length)
      setMessage('Reset to sample scans successfully')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleClearAll = () => {
    if (confirm('Clear ALL local scans? This cannot be undone.')) {
      clearAllLocalData()
      setScanCount(0)
      setMessage('All local data cleared')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading" style={{ width: 40, height: 40 }}></div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        <button
          onClick={() => router.push('/dashboard')}
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
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <h1 style={{ marginBottom: 32 }}>Operator Profile & Settings</h1>

        {/* Local Storage Status */}
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <ShieldCheck size={24} color="var(--color-primary)" />
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>100% Local & Air-Gapped Operation</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Zero cloud reliance. All profiles, photos, and dosimetry calculations are stored in your browser.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 2 }}>STORAGE ENGINE</div>
              <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HardDrive size={14} /> Browser localStorage
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 2 }}>SAVED SCANS</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{scanCount} Record(s)</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 2 }}>OPERATOR ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>{formData.worker_id || 'ISO-2026-01'}</div>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Operator Information</h3>

          {message && (
            <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="full_name" className="form-label">Full Name / Operator Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
              <input
                id="full_name"
                type="text"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="e.g. Industrial Safety Officer"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="worker_id" className="form-label">Worker ID / Badge Number</label>
            <div style={{ position: 'relative' }}>
              <Hash size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
              <input
                id="worker_id"
                type="text"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="e.g. ISO-2026-01"
                value={formData.worker_id}
                onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="organization" className="form-label">Organization / Department / Facility</label>
            <div style={{ position: 'relative' }}>
              <Building size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
              <input
                id="organization"
                type="text"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="e.g. Irisathenas Plant Safety & EHS Dept"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Contact Email (Local Reference)</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
              <input
                id="email"
                type="email"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="operator@irisathenas.local"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={saving}
          >
            {saving ? (
              <span className="loading" style={{ width: 20, height: 20 }}></span>
            ) : (
              <>
                <Save size={18} />
                Save Profile Changes
              </>
            )}
          </button>
        </form>

        {/* Vision AI API Key Configuration */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Sparkles size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0 }}>Vision AI Configuration (Groq / Gemini)</h3>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
            Configure your free <strong>Groq API key</strong> (starts with <code>gsk_</code>) or <strong>Gemini key</strong> (starts with <code>AIza</code>). This enables automated, high-precision millimeter readings of the watch badge ruler without manual line adjustments.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <input
              type="password"
              className="form-input"
              placeholder="gsk_... or AIza..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              style={{ flex: 1, minWidth: 260, fontFamily: 'monospace', fontSize: 14 }}
            />
            <button
              type="button"
              onClick={handleSaveApiKey}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {apiKeySaved ? <><Check size={16} /> Saved!</> : 'Save Key'}
            </button>
            {apiKeyInput && (
              <button
                type="button"
                onClick={handleClearApiKey}
                className="btn btn-secondary"
                style={{ color: '#ef4444' }}
              >
                Remove
              </button>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Status: {apiKeyInput ? <span style={{ color: '#10b981', fontWeight: 600 }}>● Active & Stored in Local Storage</span> : <span style={{ color: 'var(--color-text-secondary)' }}>○ Not configured (running in local CV mode)</span>}
          </div>
        </div>

        {/* Local Data Management */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Data Management</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Export or manage your locally stored scans and dosimetry logs.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={exportData}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={16} /> Export Data (JSON)
            </button>
            <button
              onClick={handleResetData}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RotateCcw size={16} /> Reset Sample Scans
            </button>
            <button
              onClick={handleClearAll}
              className="btn btn-danger"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Trash2 size={16} /> Clear All Scans
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
