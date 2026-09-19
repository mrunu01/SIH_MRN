import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Shield, Mail, Github, ExternalLink } from 'lucide-react'

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #0066cc, #004999)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            margin: '0 auto 20px',
          }}>
            <Shield size={40} />
          </div>
          <h1 style={{ marginBottom: 12 }}>About AEGIS-BAND v2</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)' }}>
            Passive H₂S Dosimetry Wristband
          </p>
        </div>

        <section className="card" style={{ marginBottom: 32 }}>
          <h2>Project Overview</h2>
          <p>
            AEGIS-BAND v2 is a disposable, electronics-free, battery-free passive H₂S dosimetry wristband
            that measures accumulated hydrogen sulfide exposure through chemical reaction-front distance measurement
            rather than traditional color intensity analysis.
          </p>
          <p style={{ marginBottom: 0 }}>
            The system combines passive diffusive sampling (Fick's Law), spatial measurement using smartphone
            computer vision, ratiometric humidity correction, and fail-closed integrity verification to provide
            digital H₂S exposure records for industrial safety monitoring.
          </p>
        </section>

        <section className="card" style={{ marginBottom: 32 }}>
          <h2>Core Innovation</h2>
          <h3>"We Measure a Distance, Not a Colour"</h3>
          <p>
            Traditional colorimetric dosimetry is vulnerable to lighting variations, color temperature,
            white balance, metamerism, and LED spectral drift. AEGIS-BAND instead measures the
            <strong> spatial advance of a chemical reaction front</strong> against printed fiducial markers,
            providing a more robust and repeatable measurement.
          </p>
        </section>

        <section className="card" style={{ marginBottom: 32 }}>
          <h2>Key Features</h2>
          <ul style={{ lineHeight: 2 }}>
            <li><strong>Passive Operation:</strong> No electronics, batteries, or charging required</li>
            <li><strong>Distance-Based Measurement:</strong> Spatial edge detection vs. unreliable color intensity</li>
            <li><strong>Three-Lane Design:</strong> Dose measurement (A), humidity reference (B), integrity check (R)</li>
            <li><strong>Smartphone Readout:</strong> Uses existing phone camera — no specialized hardware</li>
            <li><strong>Ratiometric Correction:</strong> Lane A/B ratio compensates for humidity effects</li>
            <li><strong>Fail-Closed Safety:</strong> Lane R integrity check prevents false readings</li>
            <li><strong>Digital Records:</strong> Persistent local storage with instant retrieval</li>
            <li><strong>Privacy First:</strong> All image processing and dosimetry data remain on your local machine</li>
          </ul>
        </section>

        <section className="card" style={{ marginBottom: 32 }}>
          <h2>Technical Approach</h2>
          <h3>Fick's Law Geometry</h3>
          <p>
            The band uses a 4:1 funnel geometry (inlet area 1.0 cm² → reaction lane 0.25 cm²) to passively
            concentrate H₂S for enhanced sensitivity. Uptake rate is calculated from:
          </p>
          <div style={{
            padding: 20,
            background: 'var(--color-bg)',
            borderRadius: 8,
            textAlign: 'center',
            fontFamily: 'monospace',
            fontSize: '1.2rem',
            margin: '16px 0',
            color: 'var(--color-primary)',
          }}>
            U = (D × A) / L ≈ 21.1 mL/min
          </div>

          <h3>Calibration Domain</h3>
          <p>Project specification describes 34-run Face-Centred Central Composite Design across:</p>
          <ul>
            <li>Dose: 2–80 ppm·hr</li>
            <li>Temperature: 15–35 °C</li>
            <li>Relative Humidity: 20–80 % RH</li>
          </ul>
        </section>

        <section className="card" style={{ marginBottom: 32 }}>
          <h2>Technology Stack</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            <TechItem label="Frontend" value="Next.js 14 (App Router), React 18" />
            <TechItem label="Styling" value="Modern CSS, Responsive Design" />
            <TechItem label="Storage" value="Browser LocalStorage (Zero Cloud Dependency)" />
            <TechItem label="Computer Vision" value="HTML5 Canvas API, Spatial Edge Detection" />
            <TechItem label="Data Security" value="100% Private, Local-Only Data Storage" />
            <TechItem label="Runtime" value="Node.js Local Server" />
          </div>
        </section>

        <section className="card" style={{ marginBottom: 32 }}>
          <h2>Project Status</h2>
          <div className="alert alert-warning">
            <h4 style={{ marginTop: 0 }}>⚠️ Research Prototype</h4>
            <p style={{ marginBottom: 0 }}>
              AEGIS-BAND v2 is an <strong>engineering/research/software prototype</strong> unless independently
              validated and certified. It is <strong>NOT a legally certified gas detector or personal protective device</strong>.
            </p>
          </div>
          <p style={{ marginTop: 16, marginBottom: 0 }}>
            All performance claims, formulas, calibration parameters, and uncertainty estimates represent
            <strong> project specifications and stated validation targets</strong>, not independently certified
            real-world measurements. Clearly distinguish project claims from validated performance in all
            communications and applications.
          </p>
        </section>

        <section className="card" style={{ marginBottom: 32 }}>
          <h2>Standards Referenced</h2>
          <ul>
            <li><strong>ASTM D4599:</strong> Colorimetric measurement comparison reference</li>
            <li><strong>IS 5182 Part 7:</strong> Active sampling reference for H₂S</li>
          </ul>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 0 }}>
            Reference to these standards indicates comparison methodology used in project development,
            not certification or compliance claims.
          </p>
        </section>

        <section className="card">
          <h2>Contact & Support</h2>
          <p>
            For questions about AEGIS-BAND v2, project methodology, or technical implementation:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
            <Link href="/methodology" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ExternalLink size={16} />
              View Full Methodology
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

function TechItem({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: 'var(--color-bg)',
      borderRadius: 6,
      gap: 16,
    }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{ color: 'var(--color-text-secondary)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}
