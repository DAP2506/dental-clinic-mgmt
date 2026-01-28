-- ================================================================
-- UPDATE CASES TABLE - Use authorized_users instead of doctors
-- ================================================================
-- This migration updates the cases table to reference authorized_users
-- instead of the doctors table for doctor assignments
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Starting cases table migration';
    RAISE NOTICE 'Updating doctor references to use authorized_users';
    RAISE NOTICE '========================================';
END $$;

-- ========================================
-- Step 1: Add new doctor_user_id column
-- ========================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 1: Adding doctor_user_id column...';
    
    -- Add doctor_user_id column (references authorized_users.id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cases' 
        AND column_name = 'doctor_user_id'
    ) THEN
        ALTER TABLE public.cases 
        ADD COLUMN doctor_user_id UUID REFERENCES public.authorized_users(id) ON DELETE RESTRICT;
        
        RAISE NOTICE '✓ doctor_user_id column added';
    ELSE
        RAISE NOTICE '✓ doctor_user_id column already exists';
    END IF;
END $$;

-- ========================================
-- Step 2: Migrate existing data (doctor_id to doctor_user_id)
-- ========================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 2: Migrating existing doctor assignments...';
    
    -- If you have existing doctors table with data, try to migrate
    -- This assumes doctors.email matches authorized_users.email
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doctors') THEN
        UPDATE public.cases c
        SET doctor_user_id = au.id
        FROM public.doctors d
        JOIN public.authorized_users au ON d.email = au.email
        WHERE c.doctor_id = d.id 
        AND au.role = 'doctor'
        AND c.doctor_user_id IS NULL;
        
        RAISE NOTICE '✓ Migrated existing doctor assignments';
    ELSE
        RAISE NOTICE '✓ No doctors table found, skipping migration';
    END IF;
END $$;

-- ========================================
-- Step 3: Create index for performance
-- ========================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 3: Creating indexes...';
    
    CREATE INDEX IF NOT EXISTS idx_cases_doctor_user_id ON public.cases(doctor_user_id);
    
    RAISE NOTICE '✓ Indexes created';
END $$;

-- ========================================
-- Step 4: Update RLS policies (if needed)
-- ========================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 4: Updating RLS policies...';
    
    -- Cases should already have RLS enabled
    -- Just ensure policies exist for viewing cases
    
    -- Drop old policies if they exist
    DROP POLICY IF EXISTS "Users can view cases" ON public.cases;
    DROP POLICY IF EXISTS "Users can insert cases" ON public.cases;
    DROP POLICY IF EXISTS "Users can update cases" ON public.cases;
    DROP POLICY IF EXISTS "Users can delete cases" ON public.cases;
    
    -- Create new policies
    CREATE POLICY "Authenticated users can view cases"
      ON public.cases
      FOR SELECT
      TO authenticated
      USING (deleted_at IS NULL);
    
    CREATE POLICY "Authenticated users can insert cases"
      ON public.cases
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
    
    CREATE POLICY "Authenticated users can update cases"
      ON public.cases
      FOR UPDATE
      TO authenticated
      USING (deleted_at IS NULL)
      WITH CHECK (deleted_at IS NULL);
    
    CREATE POLICY "Admins can delete cases"
      ON public.cases
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
    
    RAISE NOTICE '✓ RLS policies updated';
END $$;

-- ========================================
-- Step 5: Add comment for documentation
-- ========================================
COMMENT ON COLUMN public.cases.doctor_user_id IS 'References authorized_users.id where role=doctor';

-- ========================================
-- Step 6: Verify migration
-- ========================================
DO $$
DECLARE
    unmapped_count INTEGER;
BEGIN
    RAISE NOTICE 'Step 6: Verifying migration...';
    
    -- Check for cases without doctor_user_id
    SELECT COUNT(*) INTO unmapped_count
    FROM public.cases 
    WHERE doctor_user_id IS NULL 
    AND deleted_at IS NULL;
    
    IF unmapped_count > 0 THEN
        RAISE NOTICE '⚠ Warning: % cases without doctor_user_id assignment', unmapped_count;
        RAISE NOTICE 'You may need to manually assign doctors to these cases';
    ELSE
        RAISE NOTICE '✓ All cases have doctor assignments';
    END IF;
END $$;

-- ========================================
-- IMPORTANT NOTES
-- ========================================
-- After running this migration:
-- 1. The old doctor_id column is NOT dropped (for safety)
-- 2. New cases should use doctor_user_id
-- 3. Update your frontend code to use doctor_user_id
-- 4. Once verified, you can drop doctor_id:
--    ALTER TABLE cases DROP COLUMN doctor_id;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Cases table migration completed!';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '  - Added doctor_user_id column';
    RAISE NOTICE '  - Migrated existing assignments';
    RAISE NOTICE '  - Created indexes';
    RAISE NOTICE '  - Updated RLS policies';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update frontend to use doctor_user_id';
    RAISE NOTICE '  2. Test creating/editing cases';
    RAISE NOTICE '  3. Verify doctor assignments work';
    RAISE NOTICE '========================================';
END $$;
