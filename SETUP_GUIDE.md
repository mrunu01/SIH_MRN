# AEGIS-BAND v2 — Complete Setup Guide

## 🎯 What You Have

A **complete production-ready web application** for AEGIS-BAND v2 passive H₂S dosimetry, built with:

- ✅ Next.js 14 (App Router)
- ✅ Supabase (Auth + Database + Storage)
- ✅ Complete authentication system
- ✅ 10+ fully functional pages
- ✅ Computer vision analysis engine
- ✅ Mobile camera integration
- ✅ Responsive design
- ✅ Row Level Security
- ✅ Ready for Vercel deployment

---

## 📋 Setup Steps

### Step 1: Supabase Project Setup

1. **Create Supabase Account**: Go to [supabase.com](https://supabase.com) and sign up

2. **Create New Project**:
   - Click "New Project"
   - Choose organization
   - Set project name: `aegis-band-v2`
   - Set database password (save it securely)
   - Choose region closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for provisioning

3. **Get Project Credentials**:
   - Go to Project Settings → API
   - Copy **Project URL** (looks like: `https://xxx.supabase.co`)
   - Copy **anon public** key (long string starting with `eyJ...`)
   - ⚠️ **NEVER** use the `service_role` key in browser code

4. **Run Database Migrations**:
   
   **Option A: SQL Editor (Recommended)**
   - In Supabase dashboard, go to SQL Editor
   - Click "New Query"
   - Copy entire contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and click "Run"
   - Wait for success ✓
   - Create another new query
   - Copy entire contents of `supabase/migrations/002_storage_setup.sql`
   - Paste and click "Run"
   - Wait for success ✓

   **Option B: Supabase CLI** (if you have CLI installed)
   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```

5. **Verify Setup**:
   - Go to Table Editor → you should see: `profiles`, `scans`, `scan_measurements`, `scan_analysis`, `audit_logs`
   - Go to Storage → you should see bucket: `scan-images` (private)
   - Go to Authentication → Policies → verify RLS is enabled on all tables

### Step 2: Local Environment Setup

1. **Update `.env.local`**:
   ```bash
   # Open .env.local and replace with your actual credentials:
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

2. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Application**:
   - Go to http://localhost:3000
   - You should see the landing page
   - Click "Create Account" to test signup

### Step 3: Test Complete Workflow

1. **Create Account**:
   - Click "Create Account"
   - Fill in: Name, Email, Password
   - Submit
   - Check email for confirmation (if email confirmation enabled in Supabase)
   - Login

2. **Test New Scan**:
   - Click "New Scan"
   - Upload a test image (any photo works for testing)
   - Follow the workflow
   - Save scan

3. **Verify Data**:
   - Check Dashboard for scan count
   - Go to History
   - Click on scan to view details
   - Verify images loaded from storage

### Step 4: Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow prompts
   - Link to existing project or create new
   - Select project settings

4. **Set Environment Variables in Vercel**:
   - Go to Vercel Dashboard → Your Project
   - Settings → Environment Variables
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - Apply to: Production, Preview, Development
   - Save

5. **Redeploy**:
   ```bash
   vercel --prod
   ```

6. **Test Production**:
   - Open your Vercel URL
   - Test complete workflow
   - Verify authentication works
   - Test scan creation

---

## 🗄️ Database Schema

Your Supabase database has these tables:

**profiles** — User profile information
- Links to Supabase Auth users
- Stores: full_name, organization, worker_id

**scans** — Individual scan records
- Linked to user via user_id
- Stores: band_id, images, status, integrity

**scan_measurements** — Measurement data
- Linked to scans
- Stores: lane lengths, dose, confidence, formulas

**scan_analysis** — Analysis metadata
- Linked to scans
- Stores: quality scores, warnings, detection data

**audit_logs** — Audit trail
- Tracks user actions
- For compliance and debugging

All tables have **Row Level Security (RLS)** enabled.
Users can only access their own data.

---

## 🔐 Security Checklist

- ✅ `.env.local` is gitignored
- ✅ Only `NEXT_PUBLIC_` variables exposed to browser
- ✅ RLS enabled on all tables
- ✅ Private storage bucket
- ✅ User-scoped file paths
- ✅ Input validation on uploads
- ✅ Signed URLs for images
- ⚠️ **NEVER** commit real credentials to git
- ⚠️ **NEVER** use service_role key in browser code

---

## 🐛 Troubleshooting

### "Cannot connect to Supabase"
- Verify `.env.local` has correct URL and key
- Check Supabase project is active (not paused)
- Confirm you're using **anon key**, not service_role key

### "User not authenticated" / Redirects to login
- Clear browser localStorage
- Check Supabase Auth is enabled
- Verify middleware.js is working
- Check protected routes in middleware.js

### "Image upload fails"
- Verify `scan-images` bucket exists
- Check bucket is set to **private**
- Confirm RLS policies ran successfully
- Test file size < 15MB

### "Cannot read scans" / Empty history
- Check RLS policies in Supabase
- Verify user_id matches in scans table
- Go to Supabase → Table Editor → scans → verify data exists

### Build fails with Supabase errors
- This is normal if `.env.local` has placeholder values
- Update with real Supabase credentials
- Or deploy to Vercel first (it will use Vercel environment variables)

---

## 📱 Features Implemented

### Authentication
- ✅ Email/password signup
- ✅ Email verification (configurable)
- ✅ Login/logout
- ✅ Password reset flow
- ✅ Session persistence
- ✅ Protected routes

### Scan Workflow
- ✅ Mobile camera capture
- ✅ File upload fallback
- ✅ Image quality assessment
- ✅ Band detection (CV engine)
- ✅ Lane measurement
- ✅ Dose calculation with formulas
- ✅ Lane R integrity check
- ✅ Ratiometric humidity correction
- ✅ Confidence scoring
- ✅ Save with full audit trail

### Data Management
- ✅ Scan history with filtering
- ✅ Search functionality
- ✅ Sort options
- ✅ Individual scan details
- ✅ Image viewing (original + processed)
- ✅ Delete scans
- ✅ User profile management

### Scientific Features
- ✅ Fick's Law calculations
- ✅ Distance-based measurement
- ✅ Multiple formula display
- ✅ Project configuration tracking
- ✅ Calibration parameter storage
- ✅ Warnings and validation

---

## 📊 Project Structure

```
app/
├── page.js                    # Landing page
├── login/page.js              # Login
├── signup/page.js             # Signup
├── dashboard/page.js          # Dashboard
├── new-scan/page.js           # Scan workflow (MAIN FEATURE)
├── history/page.js            # Scan history
├── scan/[id]/page.js          # Scan details
├── profile/page.js            # User profile
├── methodology/page.js        # Scientific info
└── about/page.js              # About page

lib/
├── analysis/
│   ├── bandDetection.js       # CV engine
│   ├── doseCalculation.js     # Formulas
│   └── imageQuality.js        # Quality check
├── config/project.js          # Constants
└── supabase/                  # DB clients

components/Navbar/             # Navigation
styles/globals.css             # Design system
supabase/migrations/           # SQL schemas
```

---

## 🎨 Design System

The application uses a professional industrial safety aesthetic:

**Colors:**
- Primary: #0066cc (trust, technology)
- Success: #00ba88 (pass, valid)
- Warning: #f59e0b (review, caution)
- Error: #ef4444 (fail, invalid)

**Typography:**
- System font stack for performance
- Clear hierarchy
- Monospace for data/measurements

**Components:**
- Clean cards with subtle shadows
- Professional badges (PASS/FAIL/etc.)
- Responsive tables
- Mobile-optimized forms
- Status indicators

**Theme Support:**
- Light mode (default)
- Dark mode (auto-switches based on OS preference)

---

## 🚀 Next Steps

### Immediate
1. ✅ Set up Supabase project
2. ✅ Run migrations
3. ✅ Update `.env.local`
4. ✅ Test locally
5. ✅ Deploy to Vercel

### Future Enhancements
- [ ] Export scans as PDF reports
- [ ] Batch upload multiple scans
- [ ] Admin dashboard for organizations
- [ ] Email notifications
- [ ] Advanced analytics/charts
- [ ] API for third-party integrations
- [ ] Mobile app (React Native)
- [ ] Improved CV algorithm with ML

---

## ⚠️ Important Disclaimers

**This is a research prototype:**
- Not a certified gas detector
- Not regulatory-compliant PPE
- Project specifications, not certified performance
- For research/development purposes only

Always clearly communicate this is a prototype when sharing.

---

## 📞 Support

If you encounter issues:

1. Check this README
2. Review Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
3. Check Next.js docs: [nextjs.org/docs](https://nextjs.org/docs)
4. Verify environment variables
5. Check browser console for errors
6. Check Supabase logs

---

## ✅ Production Readiness Checklist

Before going live:

- [ ] Supabase project created
- [ ] All migrations run successfully
- [ ] Storage bucket configured
- [ ] RLS policies verified
- [ ] Environment variables set in Vercel
- [ ] Test complete user flow
- [ ] Verify authentication works
- [ ] Test scan creation end-to-end
- [ ] Check mobile responsiveness
- [ ] Review security settings
- [ ] Set up monitoring/logging
- [ ] Plan backup strategy
- [ ] Document any custom modifications

---

**Your AEGIS-BAND v2 web platform is ready to deploy!**

*Built with Next.js 14, Supabase, and Vercel*
