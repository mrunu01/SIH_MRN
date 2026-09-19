'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--color-bg)' }}>
        <div style={{ width: '100%', maxWidth: 400 }} className="card">
          <div style={{ color: 'var(--color-success)', marginBottom: 16, textAlign: 'center' }}>
            <CheckCircle size={64} strokeWidth={1} />
          </div>
          <h2 style={{ textAlign: 'center' }}>Check Your Email</h2>
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
          <Link href="/login" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}>
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--color-bg)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1>Reset Password</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Enter your email to receive reset instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
              <input
                id="email"
                type="email"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <span className="loading" style={{ width: 20, height: 20 }}></span>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
