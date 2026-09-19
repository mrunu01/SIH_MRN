import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { BookOpen, Droplet, Ruler, Layers, ShieldAlert, Beaker, TrendingUp } from 'lucide-react'
import { PROJECT_CONFIG } from '@/lib/config/project'

export default function MethodologyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ marginBottom: 8 }}>Methodology</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Scientific principles and formulas behind AEGIS-BAND v2
          </p>
        </div>

        {/* Core Philosophy */}
        <section className="card" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: 16, marginBottom: 20 }}>
            <div style={{
              minWidth: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0066cc, #004999)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ruler size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>We Measure a Distance, Not a Colour</h2>
            </div>
          </div>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            Traditional colorimetric dosimetry suffers from ambient illumination, white balance,
            color temperature variations, metamerism, and LED spectral drift. AEGIS-BAND v2
            instead measures the <strong>spatial advance of a reaction front</strong> —
            a distance-based measurement using printed fiducial markers and smartphone edge detection.
          </p>
        </section>

        {/* What is H₂S */}
        <section className="card" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: 16, marginBottom: 20 }}>
            <div style={{
              minWidth: 48,
              height: 48,
              borderRadius: 12,
              background: '#ff6b3520',
              color: '#ff6b35',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Droplet size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>What is H₂S?</h2>
            </div>
          </div>
          <p>
            <strong>Hydrogen sulfide (H₂S)</strong> is a colorless, flammable, extremely hazardous gas
            with a characteristic "rotten egg" odor. It occurs naturally in crude petroleum, natural gas,
            volcanic gases, and hot springs. Industrial exposure risks exist in oil and gas operations,
            wastewater treatment, mining, paper manufacturing, and chemical processing.
          </p>
          <div style={{ marginTop: 16, padding: 16, background: 'var(--color-bg)', borderRadius: 8 }}>
            <strong>Health Effects:</strong> Even low concentrations can cause eye irritation, nausea,
            and respiratory issues. Higher exposures can lead to loss of consciousness, respiratory failure,
            and death. Importantly, H₂S paralyzes the sense of smell at higher concentrations,
            removing the odor warning.
          </div>
        </section>

        {/* ppm vs ppm·hr */}
        <section className="card" style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 20 }}>ppm vs ppm·hr: Concentration vs Dose</h2>

          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ padding: 20, background: 'var(--color-bg)', borderRadius: 8, borderLeft: '4px solid var(--color-info)' }}>
              <h3 style={{ marginTop: 0, color: 'var(--color-info)' }}>ppm (parts per million)</h3>
              <p style={{ margin: 0 }}>
                <strong>Instantaneous concentration</strong> — how much H₂S is in the air right now.
                Like speed in km/h — it tells you how fast you're going at this moment.
              </p>
            </div>

            <div style={{ padding: 20, background: 'var(--color-bg)', borderRadius: 8, borderLeft: '4px solid var(--color-primary)' }}>
              <h3 style={{ marginTop: 0, color: 'var(--color-primary)' }}>ppm·hr (parts per million × hours)</h3>
              <p style={{ margin: 0 }}>
                <strong>Accumulated exposure dose</strong> — total H₂S exposure over time.
                Like distance in kilometers — it tells you how far you've traveled.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 20, padding: 20, background: '#eff6ff', borderRadius: 8 }}>
            <h4 style={{ marginTop: 0 }}>Formula: Dose = Concentration × Time</h4>
            <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', margin: '12px 0', color: 'var(--color-primary)' }}>
              1 ppm × 8 hours = 8 ppm·hr
            </div>
            <p style={{ marginBottom: 0, fontSize: 14 }}>
              <strong>Example:</strong> Working in an environment with 1 ppm H₂S for an 8-hour shift
              results in a cumulative dose of 8 ppm·hr.
            </p>
          </div>
        </section>

        {/* Fick's Law */}
        <section className="card" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: 16, marginBottom: 20 }}>
            <div style={{
              minWidth: 48,
              height: 48,
              borderRadius: 12,
              background: '#00ba8820',
              color: '#00ba88',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Beaker size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Fick's Law: Passive Diffusive Sampling</h2>
            </div>
          </div>

          <p>
            AEGIS-BAND uses <strong>passive diffusive sampling</strong> — no pump, no battery, no electronics.
            H₂S molecules naturally diffuse from high concentration (ambient air) to low concentration
            (inside the band) according to Fick's First Law of Diffusion.
          </p>

          <div style={{ padding: 24, background: 'var(--color-bg)', borderRadius: 8, marginTop: 20 }}>
            <h3 style={{ textAlign: 'center', marginBottom: 16 }}>Fick's Law Formula</h3>
            <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', textAlign: 'center', margin: '20px 0', color: 'var(--color-primary)' }}>
              U = (D × A) / L
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span><strong>U</strong> = Uptake Rate</span>
                <span style={{ fontFamily: 'monospace' }}>{PROJECT_CONFIG.uptakeRate} cm³/s ≈ {PROJECT_CONFIG.uptakeRateML} mL/min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span><strong>D</strong> = Diffusion Coefficient (H₂S in air)</span>
                <span style={{ fontFamily: 'monospace' }}>{PROJECT_CONFIG.diffusionCoefficient} cm²/s</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span><strong>A</strong> = Inlet/Collection Area</span>
                <span style={{ fontFamily: 'monospace' }}>{PROJECT_CONFIG.inletArea} cm²</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span><strong>L</strong> = Diffusion Path Length</span>
                <span style={{ fontFamily: 'monospace' }}>{PROJECT_CONFIG.diffusionPath} cm</span>
              </div>
            </div>

            <div style={{ marginTop: 20, padding: 16, background: '#f0fdf4', borderRadius: 8 }}>
              <strong>4:1 Funnel Geometry:</strong> The band's inlet area (1.0 cm²) funnels into the
              reaction lane area (0.25 cm²), creating a 4:1 concentration effect that passively
              amplifies sensitivity.
            </div>
          </div>
        </section>

        {/* Three-Lane System */}
        <section className="card" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: 16, marginBottom: 20 }}>
            <div style={{
              minWidth: 48,
              height: 48,
              borderRadius: 12,
              background: '#f59e0b20',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Layers size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Three Functional Lanes</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {Object.entries(PROJECT_CONFIG.lanes).map(([key, lane]) => (
              <div key={key} style={{
                padding: 20,
                background: 'var(--color-bg)',
                borderRadius: 8,
                borderLeft: `4px solid ${key === 'A' ? '#0066cc' : key === 'B' ? '#00ba88' : '#ff6b35'}`,
              }}>
                <h3 style={{ marginTop: 0, color: key === 'A' ? '#0066cc' : key === 'B' ? '#00ba88' : '#ff6b35' }}>
                  {lane.name}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                  {lane.description}
                </p>
                <p style={{ marginBottom: 0 }}>{lane.purpose}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Humidity Correction */}
        <section className="card" style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 20 }}>Ratiometric Humidity Correction</h2>

          <p>
            Humidity can affect chemical reaction rates. AEGIS-BAND v2 uses a <strong>two-lane ratiometric design</strong>
            to reduce humidity sensitivity:
          </p>

          <ul style={{ marginTop: 12, marginBottom: 20 }}>
            <li><strong>Lane A</strong> contains a high humectant (moisture-attracting) formulation</li>
            <li><strong>Lane B</strong> contains a low humectant formulation</li>
            <li>Both lanes react with H₂S, but respond differently to humidity</li>
          </ul>

          <div style={{ padding: 24, background: 'var(--color-bg)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', margin: '20px 0', color: 'var(--color-primary)' }}>
              R = Length A / Length B
            </div>
            <p style={{ marginBottom: 0 }}>
              The <strong>ratio</strong> of the two reaction-front lengths partially cancels out humidity effects,
              providing a more robust dose measurement across varying environmental conditions.
            </p>
          </div>
        </section>

        {/* Lane R Integrity */}
        <section className="card" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: 16, marginBottom: 20 }}>
            <div style={{
              minWidth: 48,
              height: 48,
              borderRadius: 12,
              background: '#ef444420',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Lane R: Fail-Closed Integrity Check</h2>
            </div>
          </div>

          <p>
            <strong>Lane R</strong> is a foil-sealed integrity verification lane that should remain
            <strong> clean and unreacted</strong> throughout normal operation. This is a
            <strong> poka-yoke (mistake-proofing)</strong> mechanism:
          </p>

          <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
            <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, borderLeft: '4px solid #00ba88' }}>
              <strong style={{ color: '#00ba88' }}>Lane R Clean (PASS):</strong> Band integrity verified.
              Measurement is valid. Continue with dose calculation.
            </div>

            <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8, borderLeft: '4px solid #ef4444' }}>
              <strong style={{ color: '#ef4444' }}>Lane R Stained (FAIL):</strong> Band may be compromised
              (damaged seal, contamination, degradation). Measurement is <strong>invalid</strong>.
              Discard reading.
            </div>
          </div>

          <p style={{ marginTop: 20, marginBottom: 0 }}>
            This fail-closed design prevents false exposure readings from compromised bands.
          </p>
        </section>

        {/* Calibration & Validation */}
        <section className="card" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: 16, marginBottom: 20 }}>
            <div style={{
              minWidth: 48,
              height: 48,
              borderRadius: 12,
              background: '#3b82f620',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Calibration & Validation</h2>
            </div>
          </div>

          <h3>34-Run Face-Centred Central Composite Design (CCD)</h3>
          <p>
            The project specification describes a systematic calibration study across the following test domain:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
            <div style={{ padding: 16, background: 'var(--color-bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Dose Range</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {PROJECT_CONFIG.calibrationDoseMin}–{PROJECT_CONFIG.calibrationDoseMax} ppm·hr
              </div>
            </div>

            <div style={{ padding: 16, background: 'var(--color-bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Temperature</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {PROJECT_CONFIG.temperatureMin}–{PROJECT_CONFIG.temperatureMax} °C
              </div>
            </div>

            <div style={{ padding: 16, background: 'var(--color-bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Humidity</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {PROJECT_CONFIG.humidityMin}–{PROJECT_CONFIG.humidityMax} % RH
              </div>
            </div>
          </div>

          <h4 style={{ marginTop: 24 }}>Project Performance Targets</h4>
          <ul>
            <li>Minimum detectable dose target: ≤{PROJECT_CONFIG.minimumDetectableDose} ppm·hr</li>
            <li>Expanded uncertainty (k=2): ±{PROJECT_CONFIG.expandedUncertaintyK2}% (project validation target)</li>
            <li>Acceptance criterion: ±{PROJECT_CONFIG.acceptanceCriterion}% (stated criterion for diffusive samplers)</li>
          </ul>

          <h4>Standards Referenced</h4>
          <ul>
            <li><strong>{PROJECT_CONFIG.standards.comparison}</strong> — Colorimetric measurement comparison reference</li>
            <li><strong>{PROJECT_CONFIG.standards.activeSampling}</strong> — Active sampling reference</li>
          </ul>

          <div className="alert alert-warning" style={{ marginTop: 20 }}>
            <strong>Important:</strong> These are <strong>project specifications and stated validation targets</strong>,
            not independently certified performance claims. AEGIS-BAND v2 is a research/engineering prototype
            unless independently validated and certified.
          </div>
        </section>

        {/* Measurement Workflow */}
        <section className="card" style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 20 }}>Smartphone Measurement Workflow</h2>

          <ol style={{ lineHeight: 2, paddingLeft: 24 }}>
            <li>Worker wears disposable AEGIS-BAND wristband during exposure period</li>
            <li>H₂S diffuses into band, chemical reaction advances proportionally to dose</li>
            <li>At end of shift, worker photographs band with smartphone camera</li>
            <li>App detects printed fiducial markers for spatial calibration</li>
            <li>Edge detection identifies reaction fronts in Lanes A and B</li>
            <li>Distance measurements converted from pixels to millimeters</li>
            <li>Lane R integrity verified (must be clean)</li>
            <li>Ratiometric correction (A/B ratio) calculated</li>
            <li>Dose calculated using calibration parameters and formulas</li>
            <li>Result stored securely with full audit trail</li>
          </ol>
        </section>

        {/* System Architecture */}
        <section className="card" style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 20 }}>Three-Tier System Architecture</h2>

          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ padding: 20, background: 'var(--color-bg)', borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, color: 'var(--color-primary)' }}>Tier 1: Worker-Borne</h3>
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>Disposable AEGIS-BAND wristband</li>
                <li>No electronics, no battery, no charging burden</li>
                <li>Passive chemistry</li>
              </ul>
            </div>

            <div style={{ padding: 20, background: 'var(--color-bg)', borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, color: 'var(--color-success)' }}>Tier 2: Edge/Fog (Smartphone)</h3>
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>Primary readout path</li>
                <li>Fiducial normalization and edge detection</li>
                <li>Digital recording and initial processing</li>
              </ul>
            </div>

            <div style={{ padding: 20, background: 'var(--color-bg)', borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, color: 'var(--color-warning)' }}>Tier 3: Cloud/EHS Dashboard</h3>
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>Centralized exposure tracking</li>
                <li>Audit trails and compliance reporting</li>
                <li>Batch checking and analytics</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="alert alert-warning">
          <h4 style={{ marginTop: 0 }}>⚠️ Research Prototype Disclaimer</h4>
          <p style={{ marginBottom: 0 }}>
            AEGIS-BAND v2 is an <strong>engineering/research/software prototype</strong> unless
            independently validated and certified. Do NOT present it as a legally certified gas detector
            or personal protective device. All performance claims, formulas, and calculations represent
            <strong>project specifications and stated validation targets</strong>, not independently
            certified real-world measurements. Clearly distinguish project claims from validated performance
            in all communications and applications.
          </p>
        </div>
      </main>
    </div>
  )
}
