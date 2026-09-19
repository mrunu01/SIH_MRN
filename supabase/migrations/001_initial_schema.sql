-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  organization TEXT,
  worker_id TEXT,
  avatar_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  band_id TEXT,
  captured_at TIMESTAMPTZ NOT NULL,
  original_image_path TEXT NOT NULL,
  processed_image_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  integrity_status TEXT,
  image_quality_status TEXT,
  analysis_method TEXT DEFAULT 'auto',
  analysis_version TEXT DEFAULT 'v1.0',
  manual_correction_used BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scan_measurements table
CREATE TABLE IF NOT EXISTS scan_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  lane_a_length_mm DECIMAL(10, 3),
  lane_b_length_mm DECIMAL(10, 3),
  lane_r_status TEXT,
  a_b_ratio DECIMAL(10, 4),
  fiducial_start_mm DECIMAL(10, 3),
  fiducial_end_mm DECIMAL(10, 3),
  reaction_front_a_mm DECIMAL(10, 3),
  reaction_front_b_mm DECIMAL(10, 3),
  temperature_c DECIMAL(5, 2),
  relative_humidity DECIMAL(5, 2),
  concentration_ppm DECIMAL(10, 3),
  exposure_time_hours DECIMAL(10, 3),
  dose_ppm_hr DECIMAL(10, 3),
  uptake_rate DECIMAL(10, 6),
  diffusion_coefficient DECIMAL(10, 6),
  inlet_area_cm2 DECIMAL(10, 3),
  diffusion_path_cm DECIMAL(10, 3),
  calibration_alpha DECIMAL(10, 6),
  confidence_score DECIMAL(5, 4),
  measurement_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scan_analysis table
CREATE TABLE IF NOT EXISTS scan_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  quality_score DECIMAL(5, 4),
  edge_detection_score DECIMAL(5, 4),
  fiducial_score DECIMAL(5, 4),
  perspective_score DECIMAL(5, 4),
  glare_score DECIMAL(5, 4),
  warnings_json JSONB,
  analysis_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_band_id ON scans(band_id);
CREATE INDEX IF NOT EXISTS idx_scan_measurements_scan_id ON scan_measurements(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_analysis_scan_id ON scan_analysis(scan_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_scan_id ON audit_logs(scan_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for scans
CREATE POLICY "Users can read own scans"
  ON scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
  ON scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scans"
  ON scans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans"
  ON scans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for scan_measurements
CREATE POLICY "Users can read own scan measurements"
  ON scan_measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_measurements.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own scan measurements"
  ON scan_measurements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_measurements.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own scan measurements"
  ON scan_measurements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_measurements.scan_id
      AND scans.user_id = auth.uid()
    )
  );

-- RLS Policies for scan_analysis
CREATE POLICY "Users can read own scan analysis"
  ON scan_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_analysis.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own scan analysis"
  ON scan_analysis FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_analysis.scan_id
      AND scans.user_id = auth.uid()
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Users can read own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scans_updated_at
  BEFORE UPDATE ON scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
