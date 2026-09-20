# Irisathenas Band — Passive H₂S Dosimetry Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)
[![Platform](https://img.shields.io/badge/Platform-100%25%20Local%20%26%20Private-success)]()
[![License](https://img.shields.io/badge/Status-Industrial%20Safety%20Prototype-orange)]()

> **"We measure a distance, not a colour."**

**Irisathenas Band** is a 100% local, privacy-first industrial personal safety web platform that measures accumulated hazardous hydrogen sulfide (H₂S) gas exposure using smartphone computer vision and passive wristband dosimetry.

No cloud databases, no logins, no email verifications, and zero configuration required. The application runs entirely on your local machine with persistent in-browser storage.

---

## 🎯 What Irisathenas Band Does

In industrial environments (oil & gas, chemical plants, wastewater facilities, mining), workers wear disposable, passive chemical wristbands during their shift.

Traditional badges fail because they try to detect **color shades**, which change under dim worklights, sunlight, or different phone cameras.

**Irisathenas Band solves this by measuring physical distance:**
1. H₂S gas diffuses into the band's reaction capillary channel.
2. A visible chemical reaction front **migrates along the lane**.
3. At the end of the shift, the user snaps a photo of the band with any smartphone or webcam.
4. The built-in computer vision engine detects the **length (in mm) that the reaction front traveled**.
5. The platform calculates the exact accumulated dose in **ppm·hr** along with safety status.

---

## 📐 Adaptive Rotated & Floating Alignment Lines

In real-world work environments, wristbands are rarely photographed in a perfectly level horizontal position. **Irisathenas Band** features an intelligent tilt & orientation engine:

- **Automatic Angle Detection:** Uses image moments and Sobel gradient vectors to automatically determine the tilt angle ($-90^\circ$ to $+90^\circ$) of the wristband.
- **Rotated Lane Inspection:** The three inspection ribbons (Lane A, Lane B, Lane R) dynamically rotate to match the orientation of the physical band, sampling pixel gradients along the rotated coordinate system.
- **Interactive Tilt Slider & Quick Presets:** Fine-tune the inspection angle in real time with an interactive slider ($-90^\circ$ to $+90^\circ$) or quick presets ($-90^\circ$, $-15^\circ$, $0^\circ$, $+15^\circ$, $+90^\circ$).
- **Live Camera Viewfinder Guide:** Displays a floating rectangular target and 3-lane preview overlay directly on the live camera stream to ensure optimal alignment before capturing.

---

## 🛡️ Three-Lane Measurement System

Every Irisathenas Band features three chemical lanes to guarantee reliable readings:

| Lane | Name | How It Works & Why It Matters |
|---|---|---|
| **Lane A** | **Dose Lane** | Main exposure channel. The distance the dark front moves directly reflects accumulated H₂S exposure. |
| **Lane B** | **Humidity Reference** | Measures environmental moisture effects. The ratio of Lane A to Lane B (`Length_A / Length_B`) eliminates humidity-induced measurement drift. |
| **Lane R** | **Integrity Verification (Poka-Yoke)** | Sealed control lane. If Lane R shows any staining or darkening, the band is marked **INVALID / COMPROMISED** to prevent false safety readings. |

---

## 🧪 Theoretical Calibration: Anchor Point (35.0 mm = 8.0 ppm·hr)

Irisathenas Band is calibrated to a verified linear loading relationship:
- **Anchor Point:** $35.0\text{ mm}$ stain length corresponds to exactly $8.0\text{ ppm}\cdot\text{hr}$ accumulated exposure.
- **Sensitivity ($S$):** $4.375\text{ mm}/(\text{ppm}\cdot\text{hr})$
- **Conversion Factor ($\alpha$):** $0.2285714\text{ (ppm}\cdot\text{hr})/\text{mm}$
- **Formula:** $\text{Dose (ppm}\cdot\text{hr)} = \text{Length}_A \times \alpha \times R$ (where $R = \text{Length}_A / \text{Length}_B$)

### Calibration Reference Scale (0 to 50.0 mm Common Scale):
| Nominal Dose (ppm·hr) | Theoretical Stain Length (mm) | OSHA / Industrial Status |
|:---:|:---:|:---|
| **1.0** | 4.4 mm | Normal (Baseline) |
| **2.0** | 8.8 mm | Normal |
| **4.0** | 17.5 mm | Normal |
| **6.0** | 26.3 mm | Moderate Exposure |
| **8.0** | **35.0 mm (Anchor)** | **Moderate Exposure** |
| **10.0** | 43.8 mm | Elevated Exposure |
| **11.4** | **50.0 mm (Scale Maximum)** | **Ceiling Limit (50 mm Physical Cap)** |

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
- Choose **"Upload Photo"** or use your **device camera** with the live alignment overlay.
- **Image Flexibility:** Any camera or resolution works smoothly. Resolution and lighting checks are non-blocking so you can process your measurements right away.

### 2. Tilt & Lane Orientation Alignment
- If your image is tilted or rotated, the engine automatically detects the angle.
- You can manually rotate or fine-tune using the **Tilt Angle Slider** or preset angle buttons.
- The 3 parallel lanes (Lane A, Lane B, Lane R) float and rotate directly over the band.

### 3. Specify Shift Parameters
- **Exposure Time (hours):** Enter the shift duration (e.g., 8 hours).
- **Temperature (°C):** Ambient temperature on site (default: 25°C).
- **Relative Humidity (% RH):** Ambient humidity (default: 50%).

### 4. Review Dosimetry Results
- **Accumulated Dose:** Reported in **ppm·hr** and time-weighted average (TWA in ppm).
- **Exposure Category:** Normal, Moderate, Elevated, or Exceeded based on OSHA / NIOSH safety thresholds.
- **Lane R Verification:** Confirms whether the band was intact and uncompromised.
- **Mathematical Breakdown:** Full formula transparency (`Dose = Length_A × 0.2285714 × R`) displayed with all intermediate variables.

### 5. Automated Vision AI Metrology (Groq / Gemini)
- **High-Precision Ruler Reading:** Automatically identifies the printed 0 to 50 mm common scale and reads the stain front positions for Strip 1, Strip 2, and Strip 3 without manual box alignment.
- **Easy Setup:** Enter your free Groq API key (`gsk_...`) or Gemini key (`AIza...`) directly in the app UI, or set `GROQ_API_KEY` in `.env.local` / Render environment variables.
- **Zero Front-End Prompts:** All analytical metrology prompts and JSON schemas are pre-configured on the backend.
- **Offline / Local Fallback:** Automatically falls back to client-side heuristic detection if no API key is provided.

### 6. Save & Manage Records
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
| **New Scan** | `/new-scan` | Upload band photo, camera viewfinder, adaptive rotated lanes, and calculation. |
| **Dashboard** | `/dashboard` | Shift summary, cumulative exposure statistics, and recent activity. |
| **History** | `/history` | Full log of previous scans with search, filtering, and status badges. |
| **Scan Details** | `/scan/[id]` | Deep dive into a specific scan, formula proofs, and image overlays. |
| **Methodology** | `/methodology` | Scientific foundation, 35mm anchor calibration, and Fick's Law math. |
| **Profile** | `/profile` | Worker name, ID, organization, and local data export/clear. |
| **About** | `/about` | Project mission, design rationale, and prototype status. |

---

## 🔒 100% Local & Privacy First

- **Zero Cloud Dependence:** No external APIs, no remote databases, no tracking.
- **Air-Gapped Ready:** Works completely offline without an internet connection once installed.
- **Your Data Stays on Your Device:** Scans, measurements, and images are stored strictly in your browser's local storage.

---

## ⚠️ Industrial Safety & Prototype Notice

Irisathenas Band is an engineering research and software prototype designed for industrial exposure tracking and demonstration. All parameters and performance targets represent project specifications and stated validation criteria.

---

**Irisathenas Band — Industrial H₂S Safety Technology**  
*"We measure a distance, not a colour."*
