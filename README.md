# AEGIS-BAND v2 — Passive H₂S Dosimetry Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)
[![Platform](https://img.shields.io/badge/Platform-100%25%20Local%20%26%20Private-success)]()
[![License](https://img.shields.io/badge/Status-Industrial%20Safety%20Prototype-orange)]()

> **"We measure a distance, not a colour."**

**AEGIS-BAND v2** is a 100% local, privacy-first industrial personal safety web platform that measures accumulated hazardous hydrogen sulfide (H₂S) gas exposure using smartphone computer vision and passive wristband dosimetry.

No cloud databases, no logins, no email verifications, and zero configuration required. The application runs entirely on your local machine with persistent in-browser storage.

---

## 🎯 What AEGIS-BAND Does

In industrial environments (oil & gas, chemical plants, wastewater facilities, mining), workers wear disposable, passive chemical wristbands during their shift.

Traditional badges fail because they try to detect **color shades**, which change under dim worklights, sunlight, or different phone cameras.

**AEGIS-BAND solves this by measuring physical distance:**
1. H₂S gas diffuses into the band's reaction capillary channel.
2. A visible chemical reaction front **migrates along the lane**.
3. At the end of the shift, the user snaps a photo of the band with any smartphone or webcam.
4. The built-in computer vision engine detects the **length (in mm) that the reaction front traveled**.
5. The platform calculates the exact accumulated dose in **ppm·hr** along with safety status.

---

## 🛡️ Three-Lane Measurement System

Every AEGIS-BAND features three chemical lanes to guarantee reliable readings:

| Lane | Name | How It Works & Why It Matters |
|---|---|---|
| **Lane A** | **Dose Lane** | Main exposure channel. The distance the dark front moves directly reflects accumulated H₂S exposure. |
| **Lane B** | **Humidity Reference** | Measures environmental moisture effects. The ratio of Lane A to Lane B (`Length_A / Length_B`) eliminates humidity-induced measurement drift. |
| **Lane R** | **Integrity Verification (Poka-Yoke)** | Sealed control lane. If Lane R shows any staining or darkening, the band is marked **INVALID / COMPROMISED** to prevent false safety readings. |

---

## 🚀 How to Run Locally (Instant Start)

You do **not** need Supabase, Vercel, an account, or any API keys. Everything runs right out of the box.

### Prerequisites
- [Node.js 18+](https://nodejs.org/) installed on your computer.

### Step 1: Clone or Navigate to the Folder
```bash
git clone https://github.com/mrunu01/SIH_MRN.git
cd SIH_MRN
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Launch Application
```bash
npm run dev
```

### Step 4: Open in Your Browser
Open **[http://localhost:3000](http://localhost:3000)** in your browser.
The platform opens **directly** to the full system — no login screen or passwords required!

---

## 📖 User Guide: Measuring Your Band

### 1. Launch a New Scan
- Click **"New Scan"** in the top navigation bar or **"Launch Scanner"** from the home page.
- Choose **"Upload Photo"** or use your **device camera** to take a picture of your AEGIS-BAND wristband.
- **Image Flexibility:** Any camera or resolution works smoothly. Resolution and lighting checks are non-blocking so you can process your measurements right away.

### 2. Specify Shift Parameters
- **Exposure Time (hours):** Enter the shift duration (e.g., 8 hours).
- **Temperature (°C):** Ambient temperature on site (default: 25°C).
- **Relative Humidity (% RH):** Ambient humidity (default: 50%).

### 3. Automatic Computer Vision Analysis
- The computer vision engine analyzes the image in real time right in your browser.
- It identifies fiducial markers, isolates Lane A, Lane B, and Lane R, and measures the reaction front distance in millimeters.
- You can inspect the annotated visualization showing exact lane boundaries, detected edge positions, and integrity status.

### 4. Review Dosimetry Results
- **Accumulated Dose:** Reported in **ppm·hr** and time-weighted average (TWA in ppm).
- **Exposure Category:** Normal, Moderate, Elevated, or Exceeded based on OSHA / NIOSH safety thresholds.
- **Lane R Verification:** Confirms whether the band was intact and uncompromised.
- **Mathematical Breakdown:** Full formula transparency (`Dose = Length_A × α × R`) displayed with all intermediate variables.

### 5. Save & Manage Records
- Click **"Save Scan"** to record the measurement with both original and annotated images.
- Scans are securely stored locally on your device in browser `localStorage`.
- View all previous measurements in the **History** tab, filter by status, sort by date, or click any scan for a detailed breakdown.
- Track overall site statistics and shift compliance on the **Dashboard**.
- Update your worker ID, department, and site details in **Profile**.

---

## 📊 Pages & Capabilities

| Page | URL | Purpose |
|---|---|---|
| **Home** | `/` | Overview of distance-based dosimetry and direct launch buttons. |
| **New Scan** | `/new-scan` | Upload band photo, run CV analysis, preview measurements, and save. |
| **Dashboard** | `/dashboard` | Shift summary, cumulative exposure statistics, and recent activity. |
| **History** | `/history` | Full log of previous scans with search, filtering, and status badges. |
| **Scan Details** | `/scan/[id]` | Deep dive into a specific scan, formula proofs, and image overlays. |
| **Methodology** | `/methodology` | Scientific foundation, Fick's Law math, and calibration domain. |
| **Profile** | `/profile` | Worker name, ID, organization, and local data export/clear. |
| **About** | `/about` | Project mission, design rationale, and prototype status. |

---

## 🔒 100% Local & Privacy First

- **Zero Cloud Dependence:** No external APIs, no remote databases, no tracking.
- **Air-Gapped Ready:** Works completely offline without an internet connection once installed.
- **Your Data Stays on Your Device:** Scans, measurements, and images are stored strictly in your browser's local storage.

---

## 🔬 Scientific Foundations & Dosimetry Model

### Fick's First Law of Diffusion
The passive sampling uptake rate $U$ is governed by:
```
U = (D × A) / L
```
- **Diffusion Coefficient ($D$):** 0.176 cm²/s (H₂S in air)
- **Inlet Area ($A$):** 1.0 cm² (funneled 4:1 into 0.25 cm² reaction lane)
- **Diffusion Path Length ($L$):** 0.50 cm
- **Theoretical Uptake Rate ($U$):** 0.352 cm³/s ≈ 21.1 mL/min

### Dose Calculation Formula
```
Dose (ppm·hr) = Length_A × α × R
```
- **$\alpha$:** 0.5 ppm·hr/mm (empirical calibration constant)
- **$R$:** Length_A / Length_B (ratiometric humidity factor)

### Calibration & Validation Domain
Derived from a 34-run Face-Centred Central Composite Design (CCD):
- **Dose Range:** 2.0 to 80.0 ppm·hr
- **Temperature:** 15°C to 35°C
- **Relative Humidity:** 20% to 80% RH
- **Limit of Detection Target:** ≤ 4 ppm·hr
- **Expanded Uncertainty ($k=2$):** ±19.4% (referenced to ASTM D4599 & IS 5182 Part 7)

---

## ⚠️ Industrial Safety & Prototype Notice

AEGIS-BAND v2 is an engineering research and software prototype designed for industrial exposure tracking and demonstration. All parameters and performance targets represent project specifications and stated validation criteria.

---

**AEGIS-BAND v2 — Industrial H₂S Safety Technology**  
*"We measure a distance, not a colour."*
