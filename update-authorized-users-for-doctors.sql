-- Enhance authorized_users table to support detailed doctor profiles
-- This removes dependency on separate doctors table

-- Step 1: Add doctor-specific columns to authorized_users
ALTER TABLE public.authorized_users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS specialization VARCHAR(100),
ADD COLUMN IF NOT EXISTS license_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS qualification VARCHAR(200),
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS available_days TEXT[], -- Array of days: ['Monday', 'Tuesday', etc.]
ADD COLUMN IF NOT EXISTS available_hours TEXT, -- e.g., '9:00 AM - 5:00 PM'
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Step 2: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_authorized_users_role ON public.authorized_users(role);
CREATE INDEX IF NOT EXISTS idx_authorized_users_phone ON public.authorized_users(phone);
CREATE INDEX IF NOT EXISTS idx_authorized_users_specialization ON public.authorized_users(specialization);

-- Step 3: Add comments for documentation
COMMENT ON COLUMN public.authorized_users.phone IS 'Contact phone number for the user (especially for doctors)';
COMMENT ON COLUMN public.authorized_users.specialization IS 'Medical specialization (for doctors): e.g., General Dentistry, Orthodontics, Endodontics';
COMMENT ON COLUMN public.authorized_users.license_number IS 'Professional license number (for doctors)';
COMMENT ON COLUMN public.authorized_users.qualification IS 'Educational qualifications: e.g., BDS, MDS, DDS';
COMMENT ON COLUMN public.authorized_users.experience_years IS 'Years of professional experience';
COMMENT ON COLUMN public.authorized_users.profile_image_url IS 'URL to profile picture';
COMMENT ON COLUMN public.authorized_users.bio IS 'Professional biography or description';
COMMENT ON COLUMN public.authorized_users.consultation_fee IS 'Standard consultation fee for doctors';
COMMENT ON COLUMN public.authorized_users.available_days IS 'Array of available days for appointments';
COMMENT ON COLUMN public.authorized_users.available_hours IS 'Available hours for appointments';

-- Step 4: Update appointments table to use authorized_users.id instead of doctors.id
-- First, add the new column
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS doctor_user_id UUID;

-- Step 5: Create foreign key to authorized_users
ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_doctor_user 
FOREIGN KEY (doctor_user_id) 
REFERENCES public.authorized_users(id) 
ON DELETE RESTRICT;

-- Step 6: Migrate existing data if you have appointments with doctor_id from old doctors table
-- This attempts to match by email if both tables have it
-- ONLY run this if you have existing data to migrate:
/*
UPDATE public.appointments apt
SET doctor_user_id = au.id
FROM public.authorized_users au, public.doctors d
WHERE d.id = apt.doctor_id 
  AND d.email = au.email
  AND au.role = 'doctor'
  AND apt.doctor_user_id IS NULL;
*/

-- Step 7: Update cases table to use authorized_users.id
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS doctor_user_id UUID;

ALTER TABLE public.cases 
ADD CONSTRAINT fk_cases_doctor_user 
FOREIGN KEY (doctor_user_id) 
REFERENCES public.authorized_users(id) 
ON DELETE RESTRICT;

-- Step 8: Migrate cases data if needed
-- ONLY run this if you have existing data to migrate:
/*
UPDATE public.cases c
SET doctor_user_id = au.id
FROM public.authorized_users au, public.doctors d
WHERE d.id = c.doctor_id 
  AND d.email = au.email
  AND au.role = 'doctor'
  AND c.doctor_user_id IS NULL;
*/

-- Step 9: Add indexes on the new foreign keys
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_user_id ON public.appointments(doctor_user_id);
CREATE INDEX IF NOT EXISTS idx_cases_doctor_user_id ON public.cases(doctor_user_id);

-- Step 10: After verifying data migration, you can drop old columns
-- CAUTION: Only run these after confirming all data is migrated
/*
ALTER TABLE public.appointments DROP COLUMN IF EXISTS doctor_id;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS doctor_email;
ALTER TABLE public.cases DROP COLUMN IF EXISTS doctor_id;
*/

-- Step 11: Create a view for easy doctor access
CREATE OR REPLACE VIEW public.doctors_view AS
SELECT 
    id,
    email,
    full_name,
    phone,
    specialization,
    license_number,
    qualification,
    experience_years,
    profile_image_url,
    bio,
    consultation_fee,
    available_days,
    available_hours,
    address,
    city,
    state,
    postal_code,
    is_active,
    created_at,
    last_login_at
FROM public.authorized_users
WHERE role = 'doctor';

-- Grant access to the view
GRANT SELECT ON public.doctors_view TO authenticated;

-- Step 12: Add helpful comments
COMMENT ON VIEW public.doctors_view IS 'Convenient view showing only doctors from authorized_users table';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check doctor profiles
SELECT 
    id,
    email,
    full_name,
    phone,
    specialization,
    license_number,
    is_active
FROM public.authorized_users
WHERE role = 'doctor';

-- Check appointments with doctor info
SELECT 
    a.id,
    a.appointment_date,
    a.appointment_time,
    au.full_name as doctor_name,
    au.specialization,
    p.first_name || ' ' || p.last_name as patient_name
FROM appointments a
LEFT JOIN authorized_users au ON a.doctor_user_id = au.id
LEFT JOIN patients p ON a.patient_id = p.id
ORDER BY a.appointment_date DESC
LIMIT 5;

-- Check cases with doctor info
SELECT 
    c.id,
    c.case_status,
    au.full_name as doctor_name,
    au.specialization,
    p.first_name || ' ' || p.last_name as patient_name
FROM cases c
LEFT JOIN authorized_users au ON c.doctor_user_id = au.id
LEFT JOIN patients p ON c.patient_id = p.id
ORDER BY c.created_at DESC
LIMIT 5;
