'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, User, Building, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
    workerId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      // Create profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: formData.fullName,
            organization: formData.organization || null,
            worker_id: formData.workerId || null,
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        setSuccess(true)

        // Check if email confirmation is required
        if (!authData.session) {
          // Email confirmation required
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        } else {
          // Auto-confirmed (dev mode)
          router.push('/dashboard')
          router.refresh()
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--color-bg)' }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }} className="card">
          <div style={{ color: 'var(--color-success)', marginBottom: 16 }}>
            <CheckCircle size={64} strokeWidth={1} />
          </div>
          <h2>Account Created!</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Please check your email to confirm your account, then log in.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ marginTop: 20 }}>
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--color-bg)' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--color-text)' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0066cc, #004999)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <Shield size={28} />
            </div>
          </Link>
          <h1 style={{ marginTop: 16 }}>Create Account</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Get started with AEGIS-BAND v2</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="fullName" className="form-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="email" className="form-label">Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="organization" className="form-label">Organization (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Building size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="Company name"
                  value={formData.organization}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="workerId" className="form-label">Worker ID (Optional)</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
                <input
                  id="workerId"
                  name="workerId"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="Employee ID"
                  value={formData.workerId}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 20 }}
            disabled={loading}
          >
            {loading ? (
              <span className="loading" style={{ width: 20, height: 20 }}></span>
            ) : (
              <>
                Create Account <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ fontWeight: 500 }}>Login</Link>
        </p>
      </div>
    </div>
  )
}
