'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { History as HistoryIcon, Search, Filter, Calendar, ArrowRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { getAllScans, fetchCloudScans } from '@/lib/storage/localStorage'
import { useAuth } from '@/lib/context/AuthContext'

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const [scans, setScans] = useState([])
  const [filteredScans, setFilteredScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [integrityFilter, setIntegrityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    if (user) {
      const localScans = getAllScans()
      setScans(localScans)
      setFilteredScans(localScans)
      setLoading(false)

      // Load latest user scans from Supabase Cloud
      fetchCloudScans().then((cloudScans) => {
        setScans(cloudScans || [])
        setFilteredScans(cloudScans || [])
      })
    }
  }, [user, authLoading, router])

  useEffect(() => {
    let result = [...scans]

    // Search filter
    if (searchTerm) {
      result = result.filter(scan =>
        (scan.band_id && scan.band_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (scan.notes && scan.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        scan.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(scan => scan.status === statusFilter)
    }

    // Integrity filter
    if (integrityFilter !== 'all') {
      result = result.filter(scan => scan.integrity_status === integrityFilter)
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.captured_at) - new Date(a.captured_at)
        case 'oldest':
          return new Date(a.captured_at) - new Date(b.captured_at)
        case 'highest-dose':
          const doseA = a.scan_measurements?.[0]?.dose_ppm_hr || 0
          const doseB = b.scan_measurements?.[0]?.dose_ppm_hr || 0
          return doseB - doseA
        case 'lowest-dose':
          const doseA2 = a.scan_measurements?.[0]?.dose_ppm_hr || 0
          const doseB2 = b.scan_measurements?.[0]?.dose_ppm_hr || 0
          return doseA2 - doseB2
        default:
          return 0
      }
    })

    setFilteredScans(result)
  }, [scans, searchTerm, statusFilter, integrityFilter, sortBy])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading" style={{ width: 40, height: 40 }}></div>
      </div>
    )
  }

  // Calculate statistics
  const validScansWithDose = scans.filter(s => s.scan_measurements?.[0]?.dose_ppm_hr != null)
  const stats = {
    total: scans.length,
    valid: scans.filter(s => s.status === 'analyzed' && s.integrity_status === 'PASS').length,
    invalid: scans.filter(s => s.integrity_status === 'FAIL').length,
    avgDose: validScansWithDose.length > 0
      ? validScansWithDose.reduce((sum, s) => sum + s.scan_measurements[0].dose_ppm_hr, 0) / validScansWithDose.length
      : 0,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ marginBottom: 8 }}>Scan History</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            View and manage all your H₂S exposure readings
          </p>
        </div>

        {/* Stats Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
          <StatCard title="Total Scans" value={stats.total} color="var(--color-primary)" />
          <StatCard title="Valid Scans" value={stats.valid} color="var(--color-success)" />
          <StatCard title="Invalid Scans" value={stats.invalid} color="var(--color-error)" />
          <StatCard
            title="Average Dose"
            value={stats.avgDose > 0 ? `${stats.avgDose.toFixed(1)} ppm·hr` : '—'}
            color="var(--color-warning)"
          />
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-tertiary)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="Band ID, notes, scan ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="analyzed">Analyzed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Integrity</label>
              <select
                className="form-select"
                value={integrityFilter}
                onChange={(e) => setIntegrityFilter(e.target.value)}
              >
                <option value="all">All Integrity</option>
                <option value="PASS">Pass</option>
                <option value="FAIL">Fail</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Sort By</label>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest-dose">Highest Dose</option>
                <option value="lowest-dose">Lowest Dose</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scans Table */}
        {filteredScans.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              {scans.length === 0 ? (
                <>
                  <HistoryIcon size={48} strokeWidth={1} />
                  <h3 style={{ marginTop: 16, marginBottom: 8 }}>No scans found</h3>
                  <p style={{ marginBottom: 20 }}>Start by capturing your first Irisathenas Band reading</p>
                  <button onClick={() => router.push('/new-scan')} className="btn btn-primary">
                    New Scan
                  </button>
                </>
              ) : (
                <>
                  <Search size={48} strokeWidth={1} />
                  <h3 style={{ marginTop: 16, marginBottom: 8 }}>No matches found</h3>
                  <p>Try adjusting your filters</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>Band ID</th>
                    <th>Dose</th>
                    <th>Confidence</th>
                    <th>Integrity</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScans.map((scan) => (
                    <tr key={scan.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/scan/${scan.id}`)}>
                      <td>
                        <div>{new Date(scan.captured_at).toLocaleDateString()}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {new Date(scan.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
                          {scan.band_id || '—'}
                        </div>
                      </td>
                      <td>
                        {scan.scan_measurements?.[0]?.dose_ppm_hr ? (
                          <div style={{ fontWeight: 600 }}>
                            {scan.scan_measurements[0].dose_ppm_hr.toFixed(2)} <span style={{ fontSize: 12, fontWeight: 400 }}>ppm·hr</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {scan.scan_measurements?.[0]?.confidence_score ? (
                          <div>
                            {(scan.scan_measurements[0].confidence_score * 100).toFixed(0)}%
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {scan.integrity_status === 'PASS' ? (
                          <span className="badge badge-success">
                            <CheckCircle size={12} /> PASS
                          </span>
                        ) : scan.integrity_status === 'FAIL' ? (
                          <span className="badge badge-error">
                            <XCircle size={12} /> FAIL
                          </span>
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
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/scan/${scan.id}`)
                          }}
                          style={{
                            padding: '4px 12px',
                            border: 'none',
                            background: 'var(--color-primary)',
                            color: '#fff',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          View <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results count */}
        {filteredScans.length > 0 && (
          <p style={{ marginTop: 16, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 14 }}>
            Showing {filteredScans.length} of {scans.length} scans
          </p>
        )}
      </main>
    </div>
  )
}

function StatCard({ title, value, color }) {
  return (
    <div className="card">
      <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
