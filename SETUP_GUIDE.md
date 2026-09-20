# Irisathenas Band — Local Setup & User Guide

## 🎯 Platform Overview

**Irisathenas Band** is a completely self-contained, 100% local web application for passive H₂S dosimetry wristband readout.

- ⚡ **Zero Cloud Dependencies:** No Supabase, no Vercel, no remote databases.
- 🔓 **Zero Login Friction:** No accounts, passwords, or email verifications needed.
- 🔒 **Complete Privacy:** All photos and scan data stay locally in your browser (`localStorage`).
- 📸 **Adaptive Tilt & Rotated Inspection:** Automatic angle detection ($-90^\circ$ to $+90^\circ$), rotated floating inspection lanes, and live camera viewfinder overlay.
- 🧪 **Calibrated Linear Dosimetry:** Anchor-calibrated ($35.0\text{ mm} = 8.0\text{ ppm}\cdot\text{hr}$, $\alpha = 0.2285714$) with verified linear loading reference scale.

---

## ⚡ Quick Start (Run Locally)

### 1. Requirements
- **Node.js**: Version 18.0.0 or higher
- **Browser**: Chrome, Edge, Firefox, or Safari

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Open in Browser
Navigate to **[http://localhost:3000](http://localhost:3000)**.
The app opens directly to the main interface with all features unlocked.

---

## 🛠️ Testing the Workflow

1. **Start a New Scan**:
   - Click **"New Scan"** in the top navigation.
   - Upload any wristband photo (JPEG, PNG, WebP) or capture via device camera with the live viewfinder alignment guide.
   - If the band is tilted or turned at an angle, the engine will automatically detect its tilt. Use the **Tilt Angle Slider** or preset buttons ($-90^\circ$ to $+90^\circ$) to adjust the 3 floating lanes (Lane A, Lane B, Lane R) over the band.
   - Fill in shift parameters (Exposure hours, Temperature, Humidity).
   - Click **"Analyze Image"**.
   - Review detected lane boundaries and calculated dose (calibrated to the 35mm anchor point).
   - Click **"Save Scan"**.

2. **Check Your Dashboard**:
   - Click **"Dashboard"** to see your live shift totals, average dose, and validity rate.

3. **Browse History**:
   - Click **"History"** to view your saved scans.
   - Filter by status, search by band ID, or click any scan to view full details and formulas.

4. **Customize Profile**:
   - Go to **"Profile"** to update your worker name, worker ID, or organization.
   - You can also export or clear your local scan data at any time.

---

## 🏗️ Technical Architecture

- **Framework**: Next.js 14 (App Router) + React 18
- **Data Persistence**: In-browser `localStorage` (`lib/storage/localStorage.js`)
- **Computer Vision**: HTML5 Canvas API with spatial edge detection, rotated lane geometry, Sobel tilt gradient estimation, and fiducial calibration (`lib/analysis/bandDetection.js`)
- **Dosimetry Engine**: Linear anchor-based model ($35.0\text{ mm} = 8.0\text{ ppm}\cdot\text{hr}$, sensitivity $S = 4.375\text{ mm}/(\text{ppm}\cdot\text{hr})$) (`lib/analysis/doseCalculation.js`)
- **Styling**: Pure CSS with responsive design and light/dark theme support (`styles/globals.css`)
- **Icons**: Lucide React

---

## ⚠️ Research Prototype Notice

Irisathenas Band is an engineering/research prototype designed for demonstration and passive dosimetry studies. It is not an officially certified gas detector or PPE device.


