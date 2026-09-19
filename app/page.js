import Link from 'next/link'
import { ArrowRight, Shield, Camera, Database, AlertTriangle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <header style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0066cc 100%)',
        color: '#fff',
        padding: '80px 20px 120px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 20,
            fontSize: 14,
            marginBottom: 24,
          }}>
            <Shield size={16} />
            <span>Industrial H₂S Safety Technology</span>
          </div>

          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 700,
            letterSpacing: '-1px',
            marginBottom: 16,
          }}>
            AEGIS-BAND v2
          </h1>

          <p style={{
            fontSize: '1.5rem',
            fontWeight: 300,
            opacity: 0.9,
            marginBottom: 12,
          }}>
            Passive H₂S Dosimetry Wristband
          </p>

          <p style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#60a5fa',
            marginBottom: 32,
          }}>
            "We measure a distance, not a colour."
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              background: '#fff',
              color: '#0066cc',
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              Create Account <ArrowRight size={18} />
            </Link>
            <Link href="/login" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              background: 'transparent',
              color: '#fff',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 20px' }}>

        {/* How It Works */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 40 }}>How It Works</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            <StepCard
              number="1"
              title="Passive Wristband"
              description="Disposable, electronics-free, battery-free wristband with chemical reaction lanes"
              icon={<Shield size={32} />}
            />
            <StepCard
              number="2"
              title="H₂S Exposure"
              description="H₂S diffuses into band, chemical reaction advances a measurable distance"
              icon={<AlertTriangle size={32} />}
            />
            <StepCard
              number="3"
              title="Smartphone Capture"
              description="Use phone camera to photograph band against printed fiducial markers"
              icon={<Camera size={32} />}
            />
            <StepCard
              number="4"
              title="Digital Analysis"
              description="Software measures distance, calculates dose, stores secure digital record"
              icon={<Database size={32} />}
            />
          </div>
        </section>

        {/* Three Lane System */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 40 }}>Three Functional Lanes</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <LaneCard
              name="Lane A"
              subtitle="Dose / High Humectant"
              description="Primary H₂S exposure measurement. Reaction front advances proportionally to accumulated dose."
              color="#0066cc"
            />
            <LaneCard
              name="Lane B"
              subtitle="Humidity Reference / Low Humectant"
              description="Ratiometric humidity correction baseline. A/B ratio reduces humidity sensitivity."
              color="#00ba88"
            />
            <LaneCard
              name="Lane R"
              subtitle="Integrity / Foil-Sealed"
              description="Fail-closed verification (poka-yoke). Should remain clean. If stained, band is invalid."
              color="#ff6b35"
            />
          </div>
        </section>

        {/* Key Formulas */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 40 }}>Core Formulas</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            <FormulaCard
              title="Dose Calculation"
              formula="Dose = Concentration × Time"
              unit="ppm·hr"
              explanation="Accumulated exposure is the product of gas concentration and exposure duration."
              example="1 ppm × 8 hours = 8 ppm·hr"
            />
            <FormulaCard
              title="Fick's Law"
              formula="U = (D × A) / L"
              variables={['U = uptake rate', 'D = diffusion coefficient (0.176 cm²/s)', 'A = inlet area (1.0 cm²)', 'L = diffusion path (0.50 cm)']}
              explanation="Passive sampling rate determined by geometry and H₂S diffusion coefficient."
              result="U ≈ 21.1 mL/min"
            />
            <FormulaCard
              title="Ratiometric Correction"
              formula="R = Length A / Length B"
              explanation="Two lanes respond differently to humidity. Their ratio reduces humidity sensitivity in dose calculation."
            />
          </div>
        </section>

        {/* Key Benefits */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 40 }}>Key Benefits</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <BenefitItem title="No Electronics" description="No batteries, charging, or electronic components on worker" />
            <BenefitItem title="Distance-Based" description="Measures reaction front distance, not unreliable color intensity" />
            <BenefitItem title="Smartphone Readout" description="Uses existing phone camera - no specialized reader hardware" />
            <BenefitItem title="Digital Records" description="Secure cloud storage of all scans, calculations, and audit trails" />
            <BenefitItem title="Integrity Check" description="Built-in Lane R failsafe prevents false readings" />
            <BenefitItem title="Humidity Correction" description="Ratiometric design compensates for humidity effects" />
          </div>
        </section>

        {/* Validation & Calibration */}
        <section style={{ marginBottom: 80 }}>
          <div className="card card-raised" style={{ maxWidth: 800, margin: '0 auto' }}>
            <h3 style={{ marginBottom: 20 }}>Calibration & Validation</h3>

            <div style={{ marginBottom: 20 }}>
              <p><strong>34-run Face-Centred Central Composite Design (CCD)</strong></p>
              <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                <li>Dose range: 2–80 ppm·hr</li>
                <li>Temperature: 15–35 °C</li>
                <li>Relative Humidity: 20–80 % RH</li>
                <li>Minimum detectable dose target: ≤4 ppm·hr</li>
                <li>Expanded uncertainty (k=2): ±19.4% (stated validation target)</li>
              </ul>
            </div>

            <div style={{ background: 'var(--color-border)', padding: 16, borderRadius: 8 }}>
              <p style={{ margin: 0, fontSize: 14 }}>
                <strong>Standards Referenced:</strong> ASTM D4599, IS 5182 Part 7
              </p>
            </div>
          </div>
        </section>

        {/* Important Disclaimer */}
        <section style={{ marginBottom: 80 }}>
          <div className="alert alert-warning" style={{ maxWidth: 800, margin: '0 auto' }}>
            <h4 style={{ marginBottom: 12 }}>⚠️ Important Notice</h4>
            <p style={{ margin: 0 }}>
              This is an <strong>engineering/research/software prototype</strong> unless independently validated and certified.
              Do NOT present AEGIS-BAND as a legally certified gas detector or personal protective device.
              All performance claims represent project specifications and stated validation targets,
              not independently certified real-world measurements.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--color-surface)', borderRadius: 12 }}>
          <h3 style={{ marginBottom: 12 }}>Ready to get started?</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
            Create your account to begin tracking H₂S exposure with AEGIS-BAND v2.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </section>

      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '40px 20px',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
        fontSize: 14,
      }}>
        <p style={{ marginBottom: 12 }}>
          AEGIS-BAND v2 — Passive H₂S Dosimetry Wristband
        </p>
        <p style={{ marginBottom: 12 }}>
          <Link href="/methodology" style={{ margin: '0 12px' }}>Methodology</Link>
          <Link href="/about" style={{ margin: '0 12px' }}>About</Link>
        </p>
        <p style={{ opacity: 0.7 }}>
          Research prototype. Not a certified gas detector or PPE.
        </p>
      </footer>
    </div>
  )
}

function StepCard({ number, title, description, icon }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 32 }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #0066cc, #004999)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        {icon}
      </div>
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 14 }}>{description}</p>
    </div>
  )
}

function LaneCard({ name, subtitle, description, color }) {
  return (
    <div className="card card-raised" style={{ borderLeft: `4px solid ${color}` }}>
      <h3 style={{ color, marginBottom: 4 }}>{name}</h3>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 12 }}>{subtitle}</p>
      <p style={{ margin: 0, fontSize: 14 }}>{description}</p>
    </div>
  )
}

function FormulaCard({ title, formula, unit, variables, explanation, example, result }) {
  return (
    <div className="card">
      <h4 style={{ marginBottom: 16 }}>{title}</h4>
      <div style={{
        background: 'var(--color-bg)',
        padding: 20,
        borderRadius: 8,
        textAlign: 'center',
        marginBottom: 16,
      }}>
        <code style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formula}</code>
        {unit && <p style={{ marginTop: 8, fontSize: 14, color: 'var(--color-text-secondary)', margin: '8px 0 0' }}>Unit: {unit}</p>}
      </div>
      {variables && (
        <div style={{ marginBottom: 12 }}>
          {variables.map((v, i) => (
            <p key={i} style={{ fontSize: 13, margin: '4px 0', fontFamily: 'monospace' }}>{v}</p>
          ))}
        </div>
      )}
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{explanation}</p>
      {example && <p style={{ fontSize: 13, fontFamily: 'monospace' }}>Example: {example}</p>}
      {result && <p style={{ fontSize: 13, fontFamily: 'monospace' }}>Result: {result}</p>}
    </div>
  )
}

function BenefitItem({ title, description }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: 16, background: 'var(--color-surface)', borderRadius: 8 }}>
      <div style={{
        minWidth: 8,
        height: 8,
        borderRadius: '50%',
        background: 'var(--color-primary)',
        marginTop: 6,
      }} />
      <div>
        <strong style={{ display: 'block', marginBottom: 4 }}>{title}</strong>
        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{description}</span>
      </div>
    </div>
  )
}
