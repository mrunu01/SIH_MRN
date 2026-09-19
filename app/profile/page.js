'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Building, Hash, Save, ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    organization: '',
    worker_id: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFormData({
          full_name: profileData.full_name || '',
          organization: profileData.organization || '',
          worker_id: profileData.worker_id || '',
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          organization: formData.organization || null,
          worker_id: formData.worker_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage('Profile updated successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to update profile')
    } finally {
      setSaving(false)
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

        <h1 style={{ marginBottom: 32 }}>Profile Settings</h1>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Account Information</h3>

          <div style={{ marginBottom: 20, padding: 16, background: 'var(--color-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Email</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={16} color="var(--color-text-secondary)" />
              <span style={{ fontWeight: 600 }}>{user?.email}</span>
            </div>
          </div>

          <div style={{ padding: 16, background: 'var(--color-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>User ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>{user?.id}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ marginBottom: 20 }}>Profile Details</h3>

          {message && (
            <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="full_name" className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
              <input
                id="full_name"
                type="text"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="Your full name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="organization" className="form-label">Organization (Optional)</label>
            <div style={{ position: 'relative' }}>
              <Building size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
              <input
                id="organization"
                type="text"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="Company name"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="worker_id" className="form-label">Worker ID (Optional)</label>
            <div style={{ position: 'relative' }}>
              <Hash size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
              <input
                id="worker_id"
                type="text"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="Employee ID"
                value={formData.worker_id}
                onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
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
                Save Changes
              </>
            )}
          </button>
        </form>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Account Created</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 0 }}>
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }) : '—'}
          </p>
        </div>
      </main>
    </div>
  )
}
