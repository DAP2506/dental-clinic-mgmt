-- ================================================================
-- DROP APPOINTMENTS TABLE (OPTIONAL)
-- ================================================================
-- This script removes the appointments table and all related objects
-- Run this ONLY if you're sure you want to completely remove
-- the appointments feature from your system
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'WARNING: This will permanently remove';
    RAISE NOTICE 'all appointments data from your system';
    RAISE NOTICE '========================================';
END $$;

-- ========================================
-- Step 1: Drop all RLS policies
-- ========================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 1: Dropping RLS policies...';
    
    DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;
    DROP POLICY IF EXISTS "Admins can insert appointments" ON public.appointments;
    DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;
    DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
    DROP POLICY IF EXISTS "All authenticated can view appointments" ON public.appointments;
    DROP POLICY IF EXISTS "Authenticated can insert appointments" ON public.appointments;
    DROP POLICY IF EXISTS "Authenticated can update appointments" ON public.appointments;
    DROP POLICY IF EXISTS "Authenticated can delete appointments" ON public.appointments;
    
    RAISE NOTICE '✓ RLS policies dropped';
END $$;

-- ========================================
-- Step 2: Drop all indexes
-- ========================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 2: Dropping indexes...';
    
    DROP INDEX IF EXISTS public.idx_appointments_patient;
    DROP INDEX IF EXISTS public.idx_appointments_doctor;
    DROP INDEX IF EXISTS public.idx_appointments_doctor_user_id;
    DROP INDEX IF EXISTS public.idx_appointments_doctor_email;
    DROP INDEX IF EXISTS public.idx_appointments_date;
    DROP INDEX IF EXISTS public.idx_appointments_deleted_at;
    
    RAISE NOTICE '✓ Indexes dropped';
END $$;

-- ========================================
-- Step 3: Drop the appointments table
-- ========================================
DO $$ 
BEGIN
    RAISE NOTICE 'Step 3: Dropping appointments table...';
    
    DROP TABLE IF EXISTS public.appointments CASCADE;
    
    RAISE NOTICE '✓ Appointments table dropped';
END $$;

-- ========================================
-- Step 4: Verify removal
-- ========================================
DO $$
BEGIN
    RAISE NOTICE 'Step 4: Verifying removal...';
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments'
    ) THEN
        RAISE NOTICE '✓ Appointments table successfully removed';
    ELSE
        RAISE WARNING '⚠ Appointments table still exists';
    END IF;
END $$;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Appointments feature removed!';
    RAISE NOTICE '';
    RAISE NOTICE 'What was removed:';
    RAISE NOTICE '  - appointments table';
    RAISE NOTICE '  - All RLS policies';
    RAISE NOTICE '  - All indexes';
    RAISE NOTICE '  - All appointment data';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: Frontend code has already been updated';
    RAISE NOTICE 'to remove appointments from navigation and UI';
    RAISE NOTICE '========================================';
END $$;
