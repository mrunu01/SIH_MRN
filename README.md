# AEGIS-BAND v2 — Passive H₂S Dosimetry Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-emerald?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/Status-Industrial%20Safety%20Prototype-orange)]()

> **"We measure a distance, not a colour."**

AEGIS-BAND v2 is an industrial personal safety platform combining a disposable, passive, electronics-free H₂S (Hydrogen Sulfide) dosimetry wristband with smartphone computer vision. It empowers workers and safety officers to measure cumulative hazardous gas exposure with laboratory precision using any mobile camera—without relying on lighting, color balance, or specialized hardware.

---

## 💡 The Core Problem & Our Innovation

### Why Colorimetry Fails in Industrial Environments
Traditional passive chemical badges rely on color matching (colorimetry). In real-world industrial environments (oil rigs, sewers, chemical plants, mining shafts), color-based readings frequently fail due to:
- **Variable Ambient Lighting:** Dim confined spaces vs. harsh sunlight skew color tones.
- **Camera Sensor Differences:** Auto-white balance and differing mobile camera hardware distort perceived color shade.
- **Metamerism & Spectral Drift:** Artificial LED worklights alter color appearance.

### The Solution: Distance-Based Dosimetry
AEGIS-BAND replaces subjective color estimation with **one-dimensional spatial displacement**:
- Ambient H₂S diffuses into capillary reaction channels.
- As the chemical reaction proceeds, an opaque reaction front steadily **migrates down the lane**.
- Using mobile computer vision and printed fiducial markers, the system measures the **physical distance in millimeters** that the front advanced.
- **Result:** Immune to lighting shifts, camera sensors, or color temperature changes. Works with any smartphone camera at any resolution.

---

## 🛡️ Three-Lane Safety Architecture

Each AEGIS-BAND features three functional chemical lanes designed for fail-safe measurement:

| Lane | Name | Function & Safety Mechanism |
|---|---|---|
| **Lane A** | **Dose Lane** (High Humectant) | Primary H₂S exposure lane. Reaction front advances proportionally to accumulated dose. |
| **Lane B** | **Humidity Reference** (Low Humectant) | Reference lane formulated with different humectant concentration to cancel out ambient humidity interference. |
| **Lane R** | **Integrity Verification** (Foil-Sealed) | **Poka-yoke (fail-closed) check.** Remains sealed during use. If darkened or stained, the band is marked invalid to prevent false readings. |

### Ratiometric Humidity Correction
Ambient humidity (% RH) alters diffusion kinetics. By computing the ratio between Lane A and Lane B:
```
R = Length_A / Length_B
```
The differential response mathematically eliminates humidity drift across changing environmental conditions (20% – 80% RH).

---

## 📱 How It Works (User Journey)

```
[ 1. Wear Band ] ───────▶ [ 2. Snap Photo ] ───────▶ [ 3. Instant CV Analysis ] ───────▶ [ 4. Digital Record ]
Worker wears passive       At shift end, capture      Mobile CV measures front       Dose recorded in ppm·hr;
wristband on site          photo with smartphone      distance in millimeters        secure cloud audit log
```

1. **Wear During Shift:** The worker puts on the lightweight, disposable wristband at the start of their shift. No batteries, no charging, no calibration needed.
2. **Photograph with Smartphone:** At the end of the shift, open the AEGIS-BAND web app and take a quick photo of the wristband using any phone camera.
3. **Adaptive Optical Readout:** The in-browser computer vision engine dynamically locates fiducial markers, isolates each lane, and measures front migration regardless of image resolution or lighting.
4. **Instant Safety Insights:** The app displays the worker's accumulated dose in **ppm·hr**, verifies the Lane R integrity check, and displays full calculation transparency.
5. **Centralized Compliance:** Exposure records and annotated scans are stored securely in the worker's history with audit-ready records for EHS safety officers.

---

## ✨ Key Platform Features

- 📸 **Resolution-Independent Computer Vision:** Adaptive pixel-to-millimeter scaling works reliably on high-end smartphones, budget devices, and desktop uploads.
- 🔒 **Fail-Closed Integrity (Poka-Yoke):** Automatically flags compromised or expired bands if Lane R is stained.
- 📊 **Worker Safety Dashboard:** Live telemetry showing latest dose, shift averages, valid/invalid scans, and risk indicators.
- 🔍 **Filterable Scan History:** Search, filter, and sort past exposure logs by date, band ID, dose level, and integrity status.
- 📐 **Transparent Mathematical Proofs:** Every scan details the exact formulas applied, input parameters (exposure hours, temperature, humidity), and calibration constants.
- 🛡️ **Enterprise Security & Privacy:** Built on Supabase Row-Level Security (RLS) with user-isolated data and 1-hour signed private image tokens.
- 🌙 **Modern Design System:** Accessible, mobile-first responsive layout with automatic dark and light mode adaptation.

---

## 🔬 Scientific Foundations & Dosimetry Model

### Fick's First Law of Diffusion
The passive sampling uptake rate U is governed by:
```
U = (D × A) / L
```
- **Diffusion Coefficient (D):** 0.176 cm²/s (H₂S in air)
- **Inlet Area (A):** 1.0 cm² (funneled 4:1 into 0.25 cm² reaction lane)
- **Diffusion Path Length (L):** 0.50 cm
- **Theoretical Uptake Rate (U):** 0.352 cm³/s ≈ 21.1 mL/min

### Dose Calculation Formula
```
Dose (ppm·hr) = Length_A × α × R
```
- **α:** 0.5 ppm·hr/mm (empirical calibration constant)
- **R:** Length_A / Length_B (ratiometric humidity factor)

### Calibration & Validation Domain
Derived from a 34-run Face-Centred Central Composite Design (CCD):
- **Dose Range:** 2.0 to 80.0 ppm·hr
- **Temperature:** 15°C to 35°C
- **Relative Humidity:** 20% to 80% RH
- **Limit of Detection Target:** ≤ 4 ppm·hr
- **Expanded Uncertainty (k=2):** ±19.4% (referenced to ASTM D4599 & IS 5182 Part 7)

---

## 🏗️ Technical Architecture

- **Frontend Framework:** Next.js 14 (App Router) + React 18
- **Edge Middleware:** Session management, route protection, and token refreshes via @supabase/ssr
- **Computer Vision Engine:** In-browser Canvas API signal processing (discrete Laplacian variance, centerline delta scanning, fiducial normalization)
- **Backend & Database:** Supabase (PostgreSQL 15 with Row-Level Security, private Storage buckets)
- **Styling:** Modular CSS tokens (`globals.css`) with light/dark theme variables
- **Icons:** Lucide React

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- Node.js 18+ and npm
- A free [Supabase](https://supabase.com) project

### 1. Clone & Install
```bash
git clone https://github.com/mrunu01/SIH_MRN.git
cd SIH_MRN
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Database Migrations
In your Supabase project's SQL Editor, execute:
1. `supabase/migrations/001_initial_schema.sql` (Creates tables & RLS policies)
2. `supabase/migrations/002_storage_setup.sql` (Sets up private image storage)

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Industrial Safety & Prototype Notice

AEGIS-BAND v2 is an engineering research and software prototype designed for industrial exposure tracking and demonstration. All parameters and performance targets represent project specifications and stated validation criteria.

---

**AEGIS-BAND v2 — Industrial H₂S Safety Technology**  
*"We measure a distance, not a colour."*
