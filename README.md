# AEGIS-BAND v2 — Passive H₂S Dosimetry Web Platform

**"We measure a distance, not a colour."**

A complete production-ready web application for AEGIS-BAND v2, a disposable, electronics-free, battery-free passive H₂S dosimetry wristband that uses smartphone computer vision to measure accumulated hydrogen sulfide exposure through reaction-front distance measurement.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Vercel account (for deployment)

### 1. Clone & Install

```bash
cd SIH_MRN
npm install
```

### 2. Supabase Setup

#### A. Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Save your project URL and anon key

#### B. Run Migrations
1. In Supabase dashboard, go to SQL Editor
2. Copy content from `supabase/migrations/001_initial_schema.sql`
3. Run the SQL
4. Copy content from `supabase/migrations/002_storage_setup.sql`
5. Run the SQL

#### C. Verify Storage Bucket
1. Go to Storage in Supabase dashboard
2. Confirm `scan-images` bucket exists and is **private**
3. RLS policies should be active

### 3. Environment Variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **SECURITY**: Never commit `.env.local` or expose service role keys to browser code.

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Project Settings → Environment Variables
# Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 📁 Project Structure

```
├── app/
│   ├── page.js                  # Landing page
│   ├── login/page.js            # Login
│   ├── signup/page.js           # Account creation
│   ├── forgot-password/page.js  # Password reset
│   ├── dashboard/page.js        # User dashboard
│   ├── new-scan/page.js         # New scan workflow
│   ├── history/page.js          # Scan history
│   ├── scan/[id]/page.js        # Individual scan details
│   ├── profile/page.js          # User profile
│   ├── methodology/page.js      # Scientific methodology
│   ├── about/page.js            # About page
│   └── layout.js                # Root layout
├── components/
│   └── Navbar/
│       └── index.js             # Navigation component
├── lib/
│   ├── analysis/
│   │   ├── bandDetection.js     # Computer vision engine
│   │   ├── doseCalculation.js   # Dose calculation formulas
│   │   └── imageQuality.js      # Image quality assessment
│   ├── config/
│   │   └── project.js           # Project configuration & constants
│   └── supabase/
│       ├── client.js            # Browser client
│       ├── server.js            # Server client
│       └── middleware.js        # Auth middleware
├── styles/
│   └── globals.css              # Global styles & design system
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_storage_setup.sql
├── middleware.js                # Next.js middleware
├── next.config.js
├── package.json
└── README.md
```

---

## 🔬 Core Features

### 1. Authentication
- **Supabase Auth** with email/password
- Account creation with profile
- Password reset flow
- Session persistence
- Protected routes

### 2. Image Capture & Analysis
- **Mobile camera support** (capture="environment")
- File upload fallback
- **Image quality assessment**
  - Resolution check (min 800×600)
  - Brightness/contrast analysis
  - Blur detection (Laplacian variance)
  - File size/type validation
- Real-time preview

### 3. Band Detection Pipeline
- **Computer vision engine**
  - Band region detection
  - Fiducial marker detection
  - Lane segmentation (A, B, R)
  - Reaction front detection
  - Edge detection
- **Distance-based measurement** (not color intensity)
- Annotated image generation
- Confidence scoring

### 4. Dose Calculation
- **Fick's Law** geometry
- **Ratiometric humidity correction** (Lane A/B ratio)
- **Lane R integrity check** (fail-closed)
- Multiple formula display
- Parameter tracking
- Uncertainty reporting

### 5. Data Management
- **Supabase PostgreSQL** database
- **Row Level Security** (RLS)
- Private image storage
- Full audit trails
- Scan history with filtering/sorting
- Search functionality

### 6. Security
- **User isolation** — users only see their own data
- **Private storage** with signed URLs
- Environment variable protection
- Input validation
- File type/size restrictions
- XSS/injection protection

---

## 🧪 Scientific Methodology

### Core Philosophy
**"We measure a distance, not a colour."**

Traditional colorimetric dosimetry suffers from lighting variations, white balance issues, and color temperature drift. AEGIS-BAND v2 measures the **spatial advance of a chemical reaction front** using printed fiducial markers and smartphone edge detection.

### Formulas

#### 1. Dose Calculation
```
Dose = Concentration × Time
Unit: ppm·hr

Example: 1 ppm × 8 hours = 8 ppm·hr
```

#### 2. Fick's Law (Uptake Rate)
```
U = (D × A) / L

Where:
U = uptake rate (0.352 cm³/s ≈ 21.1 mL/min)
D = diffusion coefficient (0.176 cm²/s)
A = inlet area (1.0 cm²)
L = diffusion path (0.50 cm)
```

#### 3. Ratiometric Correction
```
R = Length A / Length B

Reduces humidity sensitivity through
dual-lane differential response
```

### Three-Lane System

**Lane A** — Dose / High Humectant
- Primary H₂S exposure measurement
- Reaction front advances proportionally to dose

**Lane B** — Humidity Reference / Low Humectant
- Ratiometric humidity correction baseline
- Different humectant concentration

**Lane R** — Integrity / Foil-Sealed
- **Fail-closed verification** (poka-yoke)
- Should remain clean
- If stained → band invalid

### Calibration Domain

**34-run Face-Centred Central Composite Design**
- Dose: 2–80 ppm·hr
- Temperature: 15–35 °C
- Humidity: 20–80 % RH

**Project Performance Targets:**
- Minimum detectable dose: ≤4 ppm·hr
- Expanded uncertainty (k=2): ±19.4%
- Standards: ASTM D4599, IS 5182 Part 7

⚠️ **Important**: These are **project specifications and stated validation targets**, not independently certified performance.

---

## 🗄️ Database Schema

### Tables

**profiles**
```sql
- id (UUID, FK to auth.users)
- full_name
- organization
- worker_id
- avatar_path
- created_at, updated_at
```

**scans**
```sql
- id (UUID)
- user_id (FK to profiles)
- band_id
- captured_at
- original_image_path
- processed_image_path
- status
- integrity_status
- image_quality_status
- analysis_method
- analysis_version
- manual_correction_used
- notes
- created_at, updated_at
```

**scan_measurements**
```sql
- id (UUID)
- scan_id (FK to scans)
- lane_a_length_mm
- lane_b_length_mm
- lane_r_status
- a_b_ratio
- temperature_c
- relative_humidity
- concentration_ppm
- exposure_time_hours
- dose_ppm_hr
- uptake_rate
- diffusion_coefficient
- inlet_area_cm2
- diffusion_path_cm
- calibration_alpha
- confidence_score
- measurement_json (JSONB)
- created_at
```

**scan_analysis**
```sql
- id (UUID)
- scan_id (FK to scans)
- quality_score
- edge_detection_score
- fiducial_score
- perspective_score
- glare_score
- warnings_json (JSONB)
- analysis_json (JSONB)
- created_at
```

**audit_logs**
```sql
- id (UUID)
- user_id (FK to profiles)
- scan_id (FK to scans)
- action
- metadata_json (JSONB)
- created_at
```

### Row Level Security (RLS)

All tables enforce RLS:
- Users can only SELECT/INSERT/UPDATE/DELETE their own records
- Storage bucket policies enforce user-scoped paths
- No cross-user data access

---

## 📱 User Workflow

1. **Create Account** → Verify email → Login
2. **Dashboard** → View statistics and recent scans
3. **New Scan**:
   - Capture/upload band image
   - Image quality check
   - Automatic band detection
   - Review measurements
   - Enter parameters (band ID, exposure time, temp, humidity)
   - Calculate dose
   - Review & save
4. **History** → Filter, search, sort all scans
5. **Scan Details** → View images, measurements, formulas, parameters
6. **Profile** → Update account information

---

## 🎨 Design System

### Colors (CSS Variables)
```css
--color-primary: #0066cc
--color-success: #00ba88
--color-warning: #f59e0b
--color-error: #ef4444
--color-info: #3b82f6
```

### Components
- Cards with subtle shadows
- Professional badges (status indicators)
- Clean forms with validation
- Responsive tables
- Alert system (info, success, warning, error)
- Loading states
- Empty states

### Responsive
- Mobile-first design
- Breakpoint: 768px
- Touch-friendly tap targets (min 44×44px)
- Camera-optimized mobile workflow

### Theme Support
- Light mode (default)
- Dark mode via `prefers-color-scheme`
- CSS custom properties for all colors

---

## 🔐 Security Best Practices

### Environment Variables
✅ **DO:**
- Use `NEXT_PUBLIC_` prefix for client-safe variables
- Store secrets in `.env.local` (gitignored)
- Use Vercel environment variables for production

❌ **DON'T:**
- Commit `.env.local` to git
- Expose service role keys to browser
- Hard-code API keys

### Data Protection
- RLS on all tables
- Private storage bucket
- Signed URLs for images (1-hour expiry)
- User-scoped file paths: `{user_id}/{scan_id}/`

### Input Validation
- File type whitelist (JPEG, PNG, WebP)
- File size limit (15MB)
- Image dimension checks
- SQL injection protection (parameterized queries)
- XSS protection (React escapes by default)

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication**
- [ ] Sign up new account
- [ ] Email confirmation (if enabled)
- [ ] Login
- [ ] Forgot password flow
- [ ] Logout
- [ ] Protected route redirect

**Scan Workflow**
- [ ] Camera capture (mobile)
- [ ] File upload
- [ ] Image quality validation
- [ ] Band detection
- [ ] Measurement display
- [ ] Dose calculation
- [ ] Save scan
- [ ] View in history

**Data Management**
- [ ] Only see own scans
- [ ] Search functionality
- [ ] Filter by status/integrity
- [ ] Sort options
- [ ] Scan detail view
- [ ] Delete scan

**Responsive**
- [ ] Mobile layout (375px)
- [ ] Tablet layout (768px)
- [ ] Desktop layout (1200px+)

---

## 🚨 Important Disclaimers

### Research Prototype

⚠️ **AEGIS-BAND v2 is an engineering/research/software prototype** unless independently validated and certified.

**It is NOT:**
- A legally certified gas detector
- A personal protective device (PPE)
- Independently validated for industrial use

**Performance claims represent:**
- Project specifications
- Stated validation targets
- Engineering design goals

**NOT:**
- Independently certified measurements
- Guaranteed real-world performance
- Regulatory compliance

### Safety Warning

Always clearly communicate:
1. This is a prototype system
2. Results are project-specification calculations
3. Not independently certified
4. Not a substitute for certified equipment
5. For research/development purposes

---

## 🐛 Troubleshooting

### Build Errors

**"Module not found"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Supabase connection fails**
- Verify `.env.local` has correct URL and key
- Check Supabase project is running
- Confirm anon key (not service role key) is used

**Image upload fails**
- Check storage bucket exists
- Verify RLS policies are active
- Confirm bucket is set to private
- Check file size < 15MB

### Runtime Errors

**"User not authenticated"**
- Clear browser localStorage
- Re-login
- Check middleware.js is running

**"Cannot read scan"**
- Verify RLS policies
- Check user_id matches
- Confirm scan exists in database

**Images don't load**
- Check signed URL generation
- Verify storage policies
- Confirm image path format: `{user_id}/{scan_id}/filename`

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **CSS Modules** / Global CSS
- Responsive design
- Mobile-first

### Backend
- **Next.js Route Handlers**
- **Supabase** (PostgreSQL + Auth + Storage)
- Server-side functions
- Vercel-compatible

### Computer Vision
- Browser Canvas API
- Edge detection
- Image quality analysis
- Distance measurement

### Security
- Row Level Security (RLS)
- Environment variables
- Private storage
- Signed URLs
- Input validation

---

## 📊 Performance

### Optimization
- Image compression
- Lazy loading
- Dynamic imports for heavy libraries
- Minimal JS bundle
- Server-side rendering (SSR)

### Limits
- Max image size: 15MB
- Max scans per user: Unlimited
- Database: Supabase free tier sufficient for prototype
- Storage: 1GB free (Supabase)

---

## 🔄 Development Workflow

### Local Development
```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Git Workflow
```bash
git add .
git commit -m "Description"
git push

# Vercel auto-deploys from main branch
```

---

## 📞 Support & Documentation

### Resources
- **Methodology**: See `/methodology` page in app
- **About**: See `/about` page in app
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)

---

## 📄 License

Research prototype. Check with project owner for usage terms.

---

## ✅ Production Checklist

Before deploying to production:

- [ ] Set up Supabase project
- [ ] Run all migrations
- [ ] Configure storage bucket and RLS
- [ ] Set environment variables in Vercel
- [ ] Test authentication flow
- [ ] Test scan creation and retrieval
- [ ] Verify image upload/download
- [ ] Test on mobile devices
- [ ] Check responsive design
- [ ] Review security settings
- [ ] Verify RLS policies
- [ ] Test error handling
- [ ] Add monitoring/logging
- [ ] Document API endpoints
- [ ] Set up backup strategy

---

**Built with Next.js, Supabase, and Vercel**

*AEGIS-BAND v2 — Passive H₂S Dosimetry*
