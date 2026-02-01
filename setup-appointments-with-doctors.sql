-- ============================================
-- Setup Appointments with Doctors Integration
-- ============================================
-- This script:
-- 1. Ensures doctors table has email (links to authorized_users)
-- 2. Updates appointments table to use doctor_id (UUID) from doctors table
-- 3. Keeps existing cases structure (already uses doctor_id)
-- ============================================

-- Step 1: Ensure doctors table has email column (may already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'doctors' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.doctors ADD COLUMN email VARCHAR(255);
    END IF;
END $$;

-- Step 2: Make email unique in doctors table for linking to authorized_users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'doctors_email_key'
    ) THEN
        ALTER TABLE public.doctors ADD CONSTRAINT doctors_email_key UNIQUE (email);
    END IF;
END $$;

-- Step 3: Check if appointments table exists and has correct structure
DO $$ 
BEGIN
    -- Check if appointments table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
        
        -- Drop old doctor_email column if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'appointments' AND column_name = 'doctor_email'
        ) THEN
            -- First, try to migrate data if doctor_id doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'appointments' AND column_name = 'doctor_id'
            ) THEN
                -- Add doctor_id column
                ALTER TABLE public.appointments ADD COLUMN doctor_id UUID;
                
                -- Try to map doctor_email to doctor_id
                UPDATE public.appointments a
                SET doctor_id = d.id
                FROM public.doctors d
                WHERE a.doctor_email = d.email;
            END IF;
            
            -- Now drop the old column
            ALTER TABLE public.appointments DROP COLUMN IF EXISTS doctor_email;
        END IF;
        
        -- Ensure doctor_id column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'appointments' AND column_name = 'doctor_id'
        ) THEN
            ALTER TABLE public.appointments ADD COLUMN doctor_id UUID;
        END IF;
        
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'appointments_doctor_id_fkey'
        ) THEN
            ALTER TABLE public.appointments 
            ADD CONSTRAINT appointments_doctor_id_fkey 
            FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE RESTRICT;
        END IF;
        
        -- Make doctor_id NOT NULL after migration
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'appointments' 
            AND column_name = 'doctor_id' 
            AND is_nullable = 'YES'
        ) THEN
            -- Only set NOT NULL if all rows have doctor_id
            IF NOT EXISTS (SELECT 1 FROM public.appointments WHERE doctor_id IS NULL) THEN
                ALTER TABLE public.appointments ALTER COLUMN doctor_id SET NOT NULL;
            END IF;
        END IF;
        
    END IF;
END $$;

-- Step 4: Create index on doctor email for faster lookups
CREATE INDEX IF NOT EXISTS idx_doctors_email ON public.doctors(email);

-- Step 5: Add comments for documentation
COMMENT ON COLUMN public.doctors.email IS 'Email of the doctor, links to authorized_users for system access';
COMMENT ON COLUMN public.appointments.doctor_id IS 'Reference to doctor from doctors table';

-- Step 6: Create a view to see doctors with their authorized_users info
CREATE OR REPLACE VIEW public.doctors_with_access AS
SELECT 
    d.id,
    d.name,
    d.specialization,
    d.phone,
    d.email,
    d.license_number,
    au.role,
    au.is_active,
    au.full_name as auth_full_name,
    au.last_login_at,
    d.created_at,
    d.updated_at
FROM public.doctors d
LEFT JOIN public.authorized_users au ON d.email = au.email
WHERE d.email IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.doctors_with_access TO authenticated;

COMMENT ON VIEW public.doctors_with_access IS 'Shows doctors and their authorized_users access status';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Appointments and Doctors setup completed successfully!';
    RAISE NOTICE 'Doctors table: email column added and indexed';
    RAISE NOTICE 'Appointments table: now uses doctor_id (UUID) referencing doctors table';
    RAISE NOTICE 'View created: doctors_with_access (shows doctors with system access)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Ensure doctors have email addresses in the doctors table';
    RAISE NOTICE '2. Add doctors to authorized_users with role=''doctor'' using their email';
    RAISE NOTICE '3. Doctors can then log in and be assigned to appointments/cases';
END $$;
