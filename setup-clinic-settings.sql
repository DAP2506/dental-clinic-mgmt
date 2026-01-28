-- Create clinic_settings table for storing configurable clinic information
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_name TEXT NOT NULL DEFAULT 'Dental Clinic',
  clinic_email TEXT,
  clinic_phone TEXT,
  clinic_address TEXT,
  clinic_city TEXT,
  clinic_state TEXT,
  clinic_postal_code TEXT,
  clinic_country TEXT DEFAULT 'India',
  business_hours TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  currency TEXT DEFAULT 'INR',
  currency_symbol TEXT DEFAULT '₹',
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create a single row for clinic settings (singleton pattern)
-- Delete any existing rows first
DELETE FROM public.clinic_settings;

-- Insert default clinic settings
INSERT INTO public.clinic_settings (
  clinic_name,
  clinic_email,
  clinic_phone,
  clinic_address,
  clinic_city,
  clinic_state,
  clinic_postal_code,
  clinic_country,
  business_hours
) VALUES (
  'Dental Clinic',
  'info@dentalclinic.com',
  '(555) 123-4567',
  '123 Medical Street',
  'City',
  'State',
  '12345',
  'India',
  'Mon-Sat: 9:00 AM - 7:00 PM'
);

-- Enable RLS
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Everyone can read clinic settings
CREATE POLICY "Anyone can view clinic settings"
  ON public.clinic_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy: Only admins can update clinic settings
CREATE POLICY "Only admins can update clinic settings"
  ON public.clinic_settings
  FOR UPDATE
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

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_clinic_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clinic_settings_updated_at
  BEFORE UPDATE ON public.clinic_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clinic_settings_updated_at();

-- Grant permissions
GRANT SELECT ON public.clinic_settings TO authenticated;
GRANT UPDATE ON public.clinic_settings TO authenticated;
