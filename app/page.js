'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Lock, Mail, User, Building, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import Navbar from '@/components/Navbar'

export default function LoginPage() {
  const router = useRouter()
  const { user, profile, loading, isConfigured, signIn, signUp } = useAuth()

  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    organization: 'Irisathenas Plant Safety & EHS',
    workerId: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setSubmitting(true)

    try {
      if (mode === 'login') {
        if (!formData.email || !formData.password) {
          throw new Error('Please enter both email and password.')
        }
        await signIn(formData.email, formData.password)
        setSuccessMsg('Logged in successfully! Redirecting to Dashboard...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 600)
      } else {
        if (!formData.fullName || !formData.email || !formData.password) {
          throw new Error('Please fill in your name, email, and password.')
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters.')
        }
        await signUp({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          organization: formData.organization,
          workerId: formData.workerId,
        })
        setSuccessMsg('Account created successfully! Redirecting...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 800)
      }
    } catch (err) {
      console.error('Auth error:', err)
      let message = err.message || 'Authentication failed'
      if (message.includes('Invalid login credentials')) {
        message = 'Invalid email or password. Please check your credentials or click "Create Account".'
      } else if (message.includes('User already registered')) {
        message = 'An account with this email already exists. Please switch to "Sign In".'
      }
      setErrorMsg(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          padding: 32,
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0066cc, #004999)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: 14,
            }}>
              <Shield size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 6px 0' }}>
              {mode === 'login' ? 'Sign In to Irisathenas' : 'Create Worker Account'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
              {mode === 'login'
                ? 'Access your cloud dosimetry history, date-wise reports, and scans'
                : 'Register to store and access your badge scans permanently in cloud database'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--color-bg)',
            padding: 4,
            borderRadius: 8,
            marginBottom: 20,
            border: '1px solid var(--color-border)',
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg('') }}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                background: mode === 'login' ? 'var(--color-primary)' : 'transparent',
                color: mode === 'login' ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg('') }}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                background: mode === 'signup' ? 'var(--color-primary)' : 'transparent',
                color: mode === 'signup' ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              Create Account
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid #ef4444',
              color: '#f87171',
              fontSize: 13,
              marginBottom: 16,
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid #10b981',
              color: '#34d399',
              fontSize: 13,
              marginBottom: 16,
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div>{successMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            {mode === 'signup' && (
              <>
                <div>
                  <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-secondary)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="form-input"
                      style={{ paddingLeft: 38 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Worker / Badge ID</label>
                    <input
                      type="text"
                      placeholder="e.g. ISO-2026"
                      value={formData.workerId}
                      onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Organization</label>
                    <input
                      type="text"
                      placeholder="Plant Safety"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-secondary)' }} />
                <input
                  type="email"
                  required
                  placeholder="safety.officer@plant.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-secondary)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: 6,
                padding: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontWeight: 600,
              }}
            >
              {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In to Dashboard' : 'Create Account & Proceed'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Footer note */}
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
            <Link
              href="/dashboard"
              style={{
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowLeft size={13} /> Continue to Dashboard as Guest (Offline Mode)
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
