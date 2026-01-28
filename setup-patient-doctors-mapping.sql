-- Create patient_doctors mapping table
-- This allows mapping patients to their primary/assigned doctor

CREATE TABLE IF NOT EXISTS public.patient_doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_email VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Ensure a patient can only have one primary doctor
  CONSTRAINT unique_primary_doctor UNIQUE (patient_id, is_primary)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_doctors_patient ON public.patient_doctors(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_doctors_doctor ON public.patient_doctors(doctor_email);
CREATE INDEX IF NOT EXISTS idx_patient_doctors_primary ON public.patient_doctors(patient_id, is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE public.patient_doctors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy: All authenticated users can view patient-doctor mappings
DROP POLICY IF EXISTS "Authenticated users can view patient doctors" ON public.patient_doctors;
CREATE POLICY "Authenticated users can view patient doctors"
  ON public.patient_doctors
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins can manage patient-doctor mappings
DROP POLICY IF EXISTS "Admins can manage patient doctors" ON public.patient_doctors;
CREATE POLICY "Admins can manage patient doctors"
  ON public.patient_doctors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.authorized_users
      WHERE authorized_users.email = auth.email()
      AND authorized_users.role = 'admin'
      AND authorized_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.authorized_users
      WHERE authorized_users.email = auth.email()
      AND authorized_users.role = 'admin'
      AND authorized_users.is_active = true
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_patient_doctors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_patient_doctors_updated_at
  BEFORE UPDATE ON public.patient_doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_patient_doctors_updated_at();

-- Grant permissions
GRANT SELECT ON public.patient_doctors TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.patient_doctors TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.patient_doctors IS 'Maps patients to their assigned doctors';
COMMENT ON COLUMN public.patient_doctors.is_primary IS 'Whether this is the patients primary/main doctor';
COMMENT ON COLUMN public.patient_doctors.doctor_email IS 'Email of the doctor from authorized_users table';
