-- ================================================================
-- COMPLETE DATABASE CLEANUP AND RESET FOR APPOINTMENTS
-- ================================================================
-- This script completely resets the appointments table structure
-- to work with authorized_users only (no doctors table dependency)
-- ================================================================

-- Step 1: Drop ALL existing policies on appointments
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'appointments' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.appointments';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 2: Drop all foreign key constraints on appointments
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.appointments'::regclass 
        AND contype = 'f'
    ) LOOP
        EXECUTE 'ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;

-- Step 3: Drop old columns if they exist
ALTER TABLE public.appointments DROP COLUMN IF EXISTS doctor_email CASCADE;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS doctor_id CASCADE;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS case_id CASCADE;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS case_treatment_id CASCADE;

-- Step 4: Add the new column structure
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS doctor_user_id UUID;

-- Add back other optional columns
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS case_id UUID;

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS case_treatment_id UUID;

-- Step 5: Add foreign key to authorized_users
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_doctor_user_id_fkey 
FOREIGN KEY (doctor_user_id) REFERENCES public.authorized_users(id) ON DELETE RESTRICT;

-- Step 6: Add foreign keys for cases (if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cases') THEN
        ALTER TABLE public.appointments
        ADD CONSTRAINT appointments_case_id_fkey 
        FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE SET NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'case_treatments') THEN
        ALTER TABLE public.appointments
        ADD CONSTRAINT appointments_case_treatment_id_fkey 
        FOREIGN KEY (case_treatment_id) REFERENCES public.case_treatments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 7: Update indexes
DROP INDEX IF EXISTS public.idx_appointments_doctor_email;
DROP INDEX IF EXISTS public.idx_appointments_doctor;

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_user_id ON public.appointments(doctor_user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON public.appointments(deleted_at);

-- Step 8: Ensure soft delete columns exist
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;

-- Step 9: Ensure other required columns exist
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS purpose VARCHAR(200);

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Scheduled';

-- Step 10: Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Step 11: Create new RLS policies for authorized_users-based access
CREATE POLICY "Authenticated users can view appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert appointments"
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.authorized_users
      WHERE authorized_users.id = auth.uid()
      AND authorized_users.role = 'admin'
      AND authorized_users.is_active = true
    )
  );

CREATE POLICY "Admins can update appointments"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.authorized_users
      WHERE authorized_users.id = auth.uid()
      AND authorized_users.role = 'admin'
      AND authorized_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.authorized_users
      WHERE authorized_users.id = auth.uid()
      AND authorized_users.role = 'admin'
      AND authorized_users.is_active = true
    )
  );

CREATE POLICY "Admins can delete appointments"
  ON public.appointments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.authorized_users
      WHERE authorized_users.id = auth.uid()
      AND authorized_users.role = 'admin'
      AND authorized_users.is_active = true
    )
  );

-- Step 12: Grant permissions
GRANT SELECT ON public.appointments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.appointments TO authenticated;

-- Step 13: Add helpful comments
COMMENT ON COLUMN public.appointments.doctor_user_id IS 'UUID of the doctor from authorized_users table (role=doctor)';
COMMENT ON COLUMN public.appointments.deleted_at IS 'Timestamp when appointment was soft deleted. NULL means not deleted.';
COMMENT ON COLUMN public.appointments.deleted_by IS 'Email of admin who deleted the appointment.';

-- Step 14: Drop patient_doctors table if it exists (no longer needed)
DROP TABLE IF EXISTS public.patient_doctors CASCADE;

-- Step 15: Verification query
SELECT 
    'Cleanup and Reset Verification' as status,
    (SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'appointments' 
     AND column_name = 'doctor_user_id') as has_doctor_user_id,
    (SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'appointments' 
     AND column_name = 'doctor_email') as has_doctor_email_removed,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE tablename = 'appointments' AND schemaname = 'public') as policy_count,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE table_schema = 'public' AND table_name = 'appointments' 
     AND constraint_type = 'FOREIGN KEY') as fk_count;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database cleanup and reset completed!';
    RAISE NOTICE 'appointments table now uses doctor_user_id (authorized_users.id)';
    RAISE NOTICE 'All old dependencies removed';
    RAISE NOTICE 'RLS policies recreated';
    RAISE NOTICE '========================================';
END $$;
