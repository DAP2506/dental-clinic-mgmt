-- ================================================================
-- ROLLBACK SCRIPT - Old Appointments Setup
-- ================================================================
-- This script reverts changes from previously run SQL files that:
-- 1. Added doctor_email column to appointments
-- 2. Created patient_doctors mapping table
-- 3. Set up appointments to use doctors table
-- ================================================================

-- Step 1: Drop patient_doctors table if it exists
DROP TABLE IF EXISTS public.patient_doctors CASCADE;

-- Step 2: Remove doctor_email column from appointments if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'doctor_email'
    ) THEN
        ALTER TABLE public.appointments DROP COLUMN doctor_email CASCADE;
        RAISE NOTICE 'Removed doctor_email column';
    ELSE
        RAISE NOTICE 'doctor_email column does not exist (skipping)';
    END IF;
END $$;

-- Step 3: Drop indexes related to doctor_email
DROP INDEX IF EXISTS public.idx_appointments_doctor_email;

-- Step 4: Re-add doctor_id column if it was removed
-- First check if doctor_id exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'doctor_id'
    ) THEN
        -- Add doctor_id back as UUID
        ALTER TABLE public.appointments 
        ADD COLUMN doctor_id UUID;
        
        -- Add foreign key to doctors table if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doctors') THEN
            ALTER TABLE public.appointments
            ADD CONSTRAINT appointments_doctor_id_fkey 
            FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE RESTRICT;
        END IF;
        
        RAISE NOTICE 'Added doctor_id column back to appointments table';
    ELSE
        RAISE NOTICE 'doctor_id column already exists in appointments table';
    END IF;
END $$;

-- Step 5: Drop the new RLS policies (that were for doctor_email)
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;

-- Step 6: Recreate basic RLS policies (if needed)
-- Policy: All authenticated users can view appointments
CREATE POLICY "All authenticated can view appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert appointments
CREATE POLICY "Authenticated can insert appointments"
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update their appointments
CREATE POLICY "Authenticated can update appointments"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete appointments
CREATE POLICY "Authenticated can delete appointments"
  ON public.appointments
  FOR DELETE
  TO authenticated
  USING (true);

-- Step 7: Drop comments added by old migrations (if column exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'doctor_email'
    ) THEN
        EXECUTE 'COMMENT ON COLUMN public.appointments.doctor_email IS NULL';
    END IF;
END $$;

-- Step 8: Verify the rollback
SELECT 
    'Rollback verification' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'appointments' 
            AND column_name = 'doctor_id'
        ) THEN '✅ doctor_id column exists'
        ELSE '❌ doctor_id column missing'
    END as doctor_id_status,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'appointments' 
            AND column_name = 'doctor_email'
        ) THEN '✅ doctor_email column removed'
        ELSE '❌ doctor_email column still exists'
    END as doctor_email_status,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'patient_doctors'
        ) THEN '✅ patient_doctors table removed'
        ELSE '❌ patient_doctors table still exists'
    END as patient_doctors_status;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Rollback completed successfully!';
    RAISE NOTICE 'Removed: doctor_email column';
    RAISE NOTICE 'Removed: patient_doctors table';
    RAISE NOTICE 'Restored: doctor_id column (if needed)';
    RAISE NOTICE '========================================';
END $$;
