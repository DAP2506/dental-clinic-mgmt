-- Verification Script for Appointments System
-- Run this after setting up the appointments system to verify everything is configured correctly

-- ========================================
-- 1. Check if appointments table has required columns
-- ========================================
SELECT 
    'Checking appointments table structure' as check_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'appointments'
  AND column_name IN ('id', 'patient_id', 'doctor_email', 'appointment_date', 'appointment_time', 'status', 'deleted_at', 'deleted_by')
ORDER BY column_name;

-- Expected: Should show all these columns with appropriate types
-- If doctor_email is missing, you need to run update-appointments-table.sql

-- ========================================
-- 2. Check for active doctors
-- ========================================
SELECT 
    'Active doctors count' as check_name,
    COUNT(*) as count,
    STRING_AGG(full_name || ' (' || email || ')', ', ') as doctors
FROM authorized_users 
WHERE role = 'doctor' 
  AND is_active = true;

-- Expected: At least 1 doctor
-- If 0, add doctors via User Management page or INSERT statement

-- ========================================
-- 3. Check for active patients
-- ========================================
SELECT 
    'Active patients count' as check_name,
    COUNT(*) as count
FROM patients 
WHERE deleted_at IS NULL;

-- Expected: At least 1 patient
-- If 0, add patients via Patients page

-- ========================================
-- 4. Check RLS policies on appointments
-- ========================================
SELECT 
    'RLS Policies' as check_name,
    policyname,
    cmd as operation,
    qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'appointments'
ORDER BY cmd;

-- Expected: At least 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- If missing, run the RLS policy section from update-appointments-table.sql

-- ========================================
-- 5. Check if RLS is enabled
-- ========================================
SELECT 
    'RLS Status' as check_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'appointments';

-- Expected: rls_enabled = true
-- If false, run: ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. Check for existing appointments
-- ========================================
SELECT 
    'Existing appointments' as check_name,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'Scheduled' THEN 1 END) as scheduled,
    COUNT(CASE WHEN status = 'Confirmed' THEN 1 END) as confirmed,
    COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
    COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active
FROM appointments;

-- Shows breakdown of appointments by status

-- ========================================
-- 7. Check for appointments with invalid doctor_email
-- ========================================
SELECT 
    'Invalid doctor references' as check_name,
    COUNT(*) as count_with_invalid_doctor
FROM appointments a
WHERE a.doctor_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM authorized_users au 
    WHERE au.email = a.doctor_email 
      AND au.role = 'doctor'
  );

-- Expected: 0
-- If > 0, appointments have doctor_email that doesn't exist in authorized_users

-- ========================================
-- 8. Check for appointments with invalid patient_id
-- ========================================
SELECT 
    'Invalid patient references' as check_name,
    COUNT(*) as count_with_invalid_patient
FROM appointments a
WHERE NOT EXISTS (
    SELECT 1 FROM patients p 
    WHERE p.id = a.patient_id
  );

-- Expected: 0
-- If > 0, appointments reference deleted or non-existent patients

-- ========================================
-- 9. Check indexes
-- ========================================
SELECT 
    'Indexes on appointments' as check_name,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'appointments'
ORDER BY indexname;

-- Expected: Multiple indexes including idx_appointments_doctor_email, idx_appointments_deleted_at

-- ========================================
-- 10. Sample query to verify appointment data structure
-- ========================================
SELECT 
    'Sample appointment data' as check_name,
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.doctor_email,
    au.full_name as doctor_name,
    p.first_name || ' ' || p.last_name as patient_name
FROM appointments a
LEFT JOIN authorized_users au ON a.doctor_email = au.email
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.deleted_at IS NULL
ORDER BY a.appointment_date DESC, a.appointment_time DESC
LIMIT 5;

-- Shows sample appointments with doctor and patient names joined

-- ========================================
-- VERIFICATION SUMMARY
-- ========================================
-- Run all queries above and verify:
-- ✅ All required columns exist in appointments table
-- ✅ At least 1 active doctor exists
-- ✅ At least 1 active patient exists
-- ✅ RLS policies are configured (at least 4)
-- ✅ RLS is enabled on appointments table
-- ✅ No invalid doctor_email references
-- ✅ No invalid patient_id references
-- ✅ Required indexes exist

-- If any check fails, refer to APPOINTMENTS_QUICK_START.md for solutions
