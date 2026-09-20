'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, History, AlertTriangle, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { getAllScans, getProfile } from '@/lib/storage/localStorage'

export default function DashboardPage() {
  const [profile, setProfile] = useState(null)
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userProfile = getProfile()
    const localScans = getAllScans()
    setProfile(userProfile)
    setScans(localScans)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading" style={{ width: 40, height: 40 }}></div>
      </div>
    )
  }

  const stats = {
    total: scans.length,
    valid: scans.filter(s => s.status === 'analyzed' && s.integrity_status === 'PASS').length,
    invalid: scans.filter(s => s.integrity_status === 'FAIL').length,
    pending: scans.filter(s => s.status === 'pending').length,
  }

  const latestDose = scans[0]?.scan_measurements?.[0]?.dose_ppm_hr
  const validDoseScans = scans.filter(s => s.scan_measurements?.[0]?.dose_ppm_hr != null)
  const avgDose = validDoseScans.length > 0
    ? validDoseScans.reduce((sum, s) => sum + (s.scan_measurements[0].dose_ppm_hr || 0), 0) / validDoseScans.length
    : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ marginBottom: 8 }}>
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Monitor your H₂S exposure readings and scan history
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
          <StatCard
            title="Total Scans"
            value={stats.total}
            icon={<History size={20} />}
            color="var(--color-primary)"
          />
          <StatCard
            title="Valid Scans"
            value={stats.valid}
            icon={<CheckCircle size={20} />}
            color="var(--color-success)"
          />
          <StatCard
            title="Invalid Scans"
            value={stats.invalid}
            icon={<XCircle size={20} />}
            color="var(--color-error)"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<Clock size={20} />}
            color="var(--color-warning)"
          />
        </div>

        {/* Dose Cards */}
        {(latestDose || avgDose) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>
            {latestDose && (
              <div className="card">
                <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 8 }}>Latest Dose</h4>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {latestDose.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 400 }}>ppm·hr</span>
                </div>
              </div>
            )}
            {avgDose && (
              <div className="card">
                <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 8 }}>Average Dose</h4>
                <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                  {avgDose.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 400 }}>ppm·hr</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* New Scan CTA */}
        <Link
          href="/new-scan"
          className="btn btn-primary btn-lg"
          style={{
            display: 'flex',
            width: '100%',
            maxWidth: 400,
            margin: '0 auto 40px',
            padding: 20,
            fontSize: '1.1rem',
          }}
        >
          <Camera size={24} />
          New Scan
        </Link>

        {/* Recent Scans */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Recent Scans</h3>
            {scans.length > 0 && (
              <Link href="/history" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 500 }}>
                View All <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {scans.length === 0 ? (
            <div className="empty-state">
              <Camera size={48} strokeWidth={1} />
              <h3 style={{ marginTop: 16, marginBottom: 8 }}>No scans yet</h3>
              <p style={{ marginBottom: 20 }}>Capture your first Irisathenas Band reading</p>
              <Link href="/new-scan" className="btn btn-primary">
                New Scan
              </Link>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>Band ID</th>
                    <th>Dose</th>
                    <th>Integrity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.slice(0, 5).map((scan) => (
                    <tr key={scan.id} onClick={() => router.push(`/scan/${scan.id}`)} style={{ cursor: 'pointer' }}>
                      <td>
                        {new Date(scan.captured_at).toLocaleDateString()}<br />
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {new Date(scan.captured_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td>{scan.band_id || '—'}</td>
                      <td>
                        {scan.scan_measurements?.[0]?.dose_ppm_hr
                          ? `${scan.scan_measurements[0].dose_ppm_hr.toFixed(2)} ppm·hr`
                          : '—'}
                      </td>
                      <td>
                        {scan.integrity_status === 'PASS' ? (
                          <span className="badge badge-success">PASS</span>
                        ) : scan.integrity_status === 'FAIL' ? (
                          <span className="badge badge-error">FAIL</span>
                        ) : (
                          <span className="badge badge-neutral">—</span>
                        )}
                      </td>
                      <td>
                        {scan.status === 'analyzed' ? (
                          <span className="badge badge-info">Analyzed</span>
                        ) : scan.status === 'pending' ? (
                          <span className="badge badge-warning">Pending</span>
                        ) : (
                          <span className="badge badge-neutral">{scan.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="alert alert-warning" style={{ marginTop: 40 }}>
          <AlertTriangle size={18} />
          <div>
            <strong>Remember:</strong> This is a research prototype. Irisathenas Band is not a certified gas detector or PPE.
            All readings represent project specification targets, not independently validated measurements.
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: `${color}15`,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>{title}</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}
