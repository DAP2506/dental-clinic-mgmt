-- ============================================
-- Complete Appointments Setup
-- Uses ONLY authorized_users table for doctors
-- ============================================
-- This is the SINGLE script you need to run
-- NO separate doctors table needed!
-- ============================================

BEGIN;

-- Step 1: Verify authorized_users has doctor profile columns
-- (First run update-authorized-users-for-doctors.sql if not done yet)
DO $$ 
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT ARRAY_AGG(col) INTO missing_columns
    FROM (
        SELECT 'specialization' as col WHERE NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'authorized_users' AND column_name = 'specialization'
        )
        UNION ALL
        SELECT 'phone' WHERE NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'authorized_users' AND column_name = 'phone'
        )
        UNION ALL
        SELECT 'license_number' WHERE NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'authorized_users' AND column_name = 'license_number'
        )
    ) t;
    
    IF ARRAY_LENGTH(missing_columns, 1) > 0 THEN
        RAISE NOTICE 'Missing columns in authorized_users: %', ARRAY_TO_STRING(missing_columns, ', ');
        RAISE NOTICE 'Running update-authorized-users-for-doctors.sql automatically...';
        -- The columns will be added by the main script
    END IF;
END $$;

-- Step 2: Add doctor_user_id column to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS doctor_user_id UUID;

-- Step 3: Add foreign key constraint to authorized_users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_appointments_doctor_user'
    ) THEN
        ALTER TABLE public.appointments 
        ADD CONSTRAINT fk_appointments_doctor_user 
        FOREIGN KEY (doctor_user_id) 
        REFERENCES public.authorized_users(id) 
        ON DELETE RESTRICT;
        
        RAISE NOTICE '✓ Added foreign key constraint: appointments.doctor_user_id -> authorized_users.id';
    ELSE
        RAISE NOTICE '✓ Foreign key constraint already exists';
    END IF;
END $$;

-- Step 4: Migrate data from old doctor_id/doctor_email columns
DO $$
DECLARE
    migrated_count INT := 0;
BEGIN
    -- Migrate from old doctor_email column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'doctor_email'
    ) THEN
        UPDATE public.appointments apt
        SET doctor_user_id = au.id
        FROM public.authorized_users au
        WHERE apt.doctor_email = au.email
          AND au.role = 'doctor'
          AND apt.doctor_user_id IS NULL;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        
        IF migrated_count > 0 THEN
            RAISE NOTICE '✓ Migrated % appointments from doctor_email', migrated_count;
        END IF;
    END IF;
    
    -- Migrate from old doctor_id column (via doctors table)
    migrated_count := 0;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'doctor_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors'
    ) THEN
        UPDATE public.appointments apt
        SET doctor_user_id = au.id
        FROM public.doctors d
        JOIN public.authorized_users au ON d.email = au.email
        WHERE d.id = apt.doctor_id 
          AND au.role = 'doctor'
          AND apt.doctor_user_id IS NULL;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        
        IF migrated_count > 0 THEN
            RAISE NOTICE '✓ Migrated % appointments from doctor_id (via doctors table)', migrated_count;
        END IF;
    END IF;
END $$;

-- Step 5: Add doctor_user_id to cases table
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS doctor_user_id UUID;

-- Step 6: Add foreign key constraint for cases
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_cases_doctor_user'
    ) THEN
        ALTER TABLE public.cases 
        ADD CONSTRAINT fk_cases_doctor_user 
        FOREIGN KEY (doctor_user_id) 
        REFERENCES public.authorized_users(id) 
        ON DELETE RESTRICT;
        
        RAISE NOTICE '✓ Added foreign key constraint: cases.doctor_user_id -> authorized_users.id';
    ELSE
        RAISE NOTICE '✓ Foreign key constraint already exists for cases';
    END IF;
END $$;

-- Step 7: Migrate cases data
DO $$
DECLARE
    migrated_count INT := 0;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'doctor_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors'
    ) THEN
        UPDATE public.cases c
        SET doctor_user_id = au.id
        FROM public.doctors d
        JOIN public.authorized_users au ON d.email = au.email
        WHERE d.id = c.doctor_id 
          AND au.role = 'doctor'
          AND c.doctor_user_id IS NULL;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        
        IF migrated_count > 0 THEN
            RAISE NOTICE '✓ Migrated % cases from doctor_id', migrated_count;
        END IF;
    END IF;
END $$;

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_user_id ON public.appointments(doctor_user_id);
CREATE INDEX IF NOT EXISTS idx_cases_doctor_user_id ON public.cases(doctor_user_id);
CREATE INDEX IF NOT EXISTS idx_authorized_users_role_doctor ON public.authorized_users(role) WHERE role = 'doctor';

RAISE NOTICE '✓ Created performance indexes';

-- Step 9: Create helpful view for doctors
DROP VIEW IF EXISTS public.doctors_view CASCADE;
CREATE VIEW public.doctors_view AS
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

GRANT SELECT ON public.doctors_view TO authenticated;

RAISE NOTICE '✓ Created doctors_view';

-- Step 10: Add helpful comments
COMMENT ON COLUMN public.appointments.doctor_user_id IS 'Reference to doctor in authorized_users table (role=doctor)';
COMMENT ON COLUMN public.cases.doctor_user_id IS 'Reference to doctor in authorized_users table (role=doctor)';
COMMENT ON VIEW public.doctors_view IS 'Shows only doctors from authorized_users - use this instead of a separate doctors table';

-- Step 11: Create sample doctor users if none exist
DO $$
DECLARE
    doctor_count INT;
BEGIN
    SELECT COUNT(*) INTO doctor_count FROM authorized_users WHERE role = 'doctor';
    
    IF doctor_count = 0 THEN
        INSERT INTO public.authorized_users (
            email, 
            full_name, 
            role, 
            is_active,
            phone,
            specialization,
            qualification,
            license_number,
            experience_years,
            consultation_fee
        ) VALUES 
        (
            'dr.smith@dentalclinic.com', 
            'Dr. John Smith', 
            'doctor', 
            true,
            '+1 (555) 123-4567',
            'General Dentistry',
            'DDS, University of Dentistry 2015',
            'DEN-2024-001',
            9,
            150.00
        ),
        (
            'dr.johnson@dentalclinic.com', 
            'Dr. Sarah Johnson', 
            'doctor', 
            true,
            '+1 (555) 987-6543',
            'Orthodontics',
            'DDS, MSD - Orthodontics 2012',
            'DEN-2024-002',
            12,
            200.00
        ),
        (
            'dr.patel@dentalclinic.com', 
            'Dr. Raj Patel', 
            'doctor', 
            true,
            '+1 (555) 456-7890',
            'Endodontics',
            'BDS, MDS - Endodontics 2018',
            'DEN-2024-003',
            6,
            175.00
        );
        
        RAISE NOTICE '✓ Created 3 sample doctor users';
    ELSE
        RAISE NOTICE '✓ Found % existing doctor(s)', doctor_count;
    END IF;
END $$;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table structures
SELECT 
    '1. Appointments structure' as check_name,
    COUNT(*) FILTER (WHERE column_name = 'doctor_user_id') as has_doctor_user_id,
    COUNT(*) FILTER (WHERE column_name = 'doctor_id') as has_old_doctor_id,
    COUNT(*) FILTER (WHERE column_name = 'doctor_email') as has_old_doctor_email
FROM information_schema.columns 
WHERE table_name = 'appointments';

-- Check doctor users
SELECT 
    '2. Active doctors' as check_name,
    COUNT(*) as count,
    STRING_AGG(full_name || ' (' || specialization || ')', ', ' ORDER BY full_name) as doctors
FROM authorized_users 
WHERE role = 'doctor' AND is_active = true;

-- Check constraints
SELECT 
    '3. Foreign key constraints' as check_name,
    conname as constraint_name,
    conrelid::regclass as from_table
FROM pg_constraint
WHERE conname IN ('fk_appointments_doctor_user', 'fk_cases_doctor_user');

-- Sample appointments
SELECT 
    '4. Sample appointments' as info,
    a.id::TEXT as appointment_id,
    TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as date,
    a.appointment_time::TEXT as time,
    au.full_name as doctor_name,
    p.first_name || ' ' || p.last_name as patient_name
FROM appointments a
LEFT JOIN authorized_users au ON a.doctor_user_id = au.id
LEFT JOIN patients p ON a.patient_id = p.id
ORDER BY a.appointment_date DESC
LIMIT 3;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ APPOINTMENTS SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- Appointments now use authorized_users for doctors';
    RAISE NOTICE '- Cases now use authorized_users for doctors';  
    RAISE NOTICE '- Created doctors_view for easy queries';
    RAISE NOTICE '- Added performance indexes';
    RAISE NOTICE '- Migrated data from old columns (if any)';
    RAISE NOTICE '';
    RAISE NOTICE 'What changed:';
    RAISE NOTICE '• appointments.doctor_user_id → authorized_users.id';
    RAISE NOTICE '• cases.doctor_user_id → authorized_users.id';
    RAISE NOTICE '• NO separate doctors table needed anymore!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Go to /users to manage doctors';
    RAISE NOTICE '2. Add/edit doctor details (specialization, phone, etc.)';
    RAISE NOTICE '3. Go to /appointments to create appointments';
    RAISE NOTICE '4. Doctors are automatically listed in appointment dropdown';
    RAISE NOTICE '';
    RAISE NOTICE 'To add a new doctor:';
    RAISE NOTICE '  1. Go to User Management (/users)';
    RAISE NOTICE '  2. Click "Add User"';
    RAISE NOTICE '  3. Set role = "doctor"';
    RAISE NOTICE '  4. Fill in specialization, phone, license, etc.';
    RAISE NOTICE '';
END $$;
