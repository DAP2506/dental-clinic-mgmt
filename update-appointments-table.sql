-- Update appointments table to use doctor_email instead of doctor_id
-- This allows appointments to reference doctors from the authorized_users table

-- Step 1: Add the new doctor_email column
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS doctor_email VARCHAR(255);

-- Step 2: Migrate existing data (if you have any appointments with doctor_id)
-- This attempts to map existing doctor_id to email from authorized_users
-- You may need to adjust this based on your data
UPDATE public.appointments apt
SET doctor_email = au.email
FROM public.authorized_users au
WHERE au.role = 'doctor' 
  AND apt.doctor_email IS NULL
  AND EXISTS (
    SELECT 1 FROM public.doctors d 
    WHERE d.id = apt.doctor_id 
    AND d.email = au.email
  );

-- Step 3: Make doctor_email required (after data migration)
-- Uncomment this after ensuring all appointments have doctor_email set
-- ALTER TABLE public.appointments 
-- ALTER COLUMN doctor_email SET NOT NULL;

-- Step 4: Drop the old doctor_id foreign key constraint (if exists)
-- Find the constraint name first with:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.appointments'::regclass AND contype = 'f';
-- Then drop it (replace constraint_name with actual name):
-- ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;

-- Step 5: Make case_id optional (it's already nullable, just ensuring)
ALTER TABLE public.appointments 
ALTER COLUMN case_id DROP NOT NULL;

-- Step 6: Make case_treatment_id optional (it's already nullable)
ALTER TABLE public.appointments 
ALTER COLUMN case_treatment_id DROP NOT NULL;

-- Step 7: Update indexes
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_email ON public.appointments(doctor_email);

-- Step 8: Add soft delete columns for appointments (optional but recommended)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON public.appointments(deleted_at);

-- Step 9: Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies for appointments
-- Policy: All authenticated users can view appointments
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;
CREATE POLICY "Authenticated users can view appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins can insert appointments
DROP POLICY IF EXISTS "Admins can insert appointments" ON public.appointments;
CREATE POLICY "Admins can insert appointments"
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.authorized_users
      WHERE authorized_users.email = auth.email()
      AND authorized_users.role = 'admin'
      AND authorized_users.is_active = true
    )
  );

-- Policy: Admins can update appointments
DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;
CREATE POLICY "Admins can update appointments"
  ON public.appointments
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

-- Policy: Admins can delete appointments
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
CREATE POLICY "Admins can delete appointments"
  ON public.appointments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.authorized_users
      WHERE authorized_users.email = auth.email()
      AND authorized_users.role = 'admin'
      AND authorized_users.is_active = true
    )
  );

-- Step 11: Grant permissions
GRANT SELECT ON public.appointments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.appointments TO authenticated;

-- Step 12: Add comments for documentation
COMMENT ON COLUMN public.appointments.doctor_email IS 'Email of the doctor from authorized_users table';
COMMENT ON COLUMN public.appointments.deleted_at IS 'Timestamp when appointment was soft deleted. NULL means not deleted.';
COMMENT ON COLUMN public.appointments.deleted_by IS 'Email of admin who deleted the appointment.';

-- IMPORTANT NOTE:
-- After running this migration, you may want to:
-- 1. Verify all appointments have doctor_email set
-- 2. Then uncomment the NOT NULL constraint above
-- 3. Consider dropping the doctor_id column if no longer needed:
--    ALTER TABLE public.appointments DROP COLUMN IF EXISTS doctor_id;
