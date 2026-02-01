# Appointments System - Database Migration Guide

## Overview
This guide helps you migrate your appointments system to use **only** the `authorized_users` table (no dependencies on `doctors` or `doctors_with_access` tables).

## Migration Steps

### Step 1: Understand What Changed

**OLD APPROACH** (What you had before):
- Appointments used `doctor_email` or `doctor_id` columns
- Referenced separate `doctors` table
- May have had `patient_doctors` mapping table

**NEW APPROACH** (What we're implementing):
- Appointments use `doctor_user_id` (UUID from `authorized_users.id`)
- No dependency on `doctors` table
- Doctors are users with `role = 'doctor'` in `authorized_users`
- Enhanced doctor profile in `authorized_users` (specialization, license_number, phone)

### Step 2: Backup Your Data (IMPORTANT!)

Before running any migrations, backup your appointments:

```sql
-- Backup existing appointments
CREATE TABLE appointments_backup AS 
SELECT * FROM public.appointments;

-- Verify backup
SELECT COUNT(*) FROM appointments_backup;
```

### Step 3: Run the Migration Scripts IN ORDER

#### Script 1: Rollback Old Setup (if you ran previous migrations)
**File:** `rollback-old-appointments-setup.sql`

This removes:
- `doctor_email` column
- `patient_doctors` table  
- Old RLS policies

```sql
-- Run this in Supabase SQL Editor
-- Copy/paste content from rollback-old-appointments-setup.sql
```

#### Script 2: Clean Reset for authorized_users
**File:** `reset-appointments-for-authorized-users.sql`

This:
- Drops all existing constraints and policies
- Removes old columns (doctor_email, doctor_id)
- Adds new column: `doctor_user_id` (UUID)
- Creates foreign key to `authorized_users(id)`
- Sets up proper RLS policies
- Creates indexes

```sql
-- Run this in Supabase SQL Editor
-- Copy/paste content from reset-appointments-for-authorized-users.sql
```

#### Script 3: Enhance authorized_users for Doctors
**File:** `setup-appointments-with-doctors.sql`

This adds:
- `specialization` column to authorized_users
- `license_number` column
- `phone` column
- Updates existing doctors (if any)

```sql
-- Run this in Supabase SQL Editor
-- Copy/paste content from setup-appointments-with-doctors.sql
```

#### Script 4: Create Sample Data (Optional)
**File:** `setup-sample-appointments.sql`

This creates:
- Sample doctor users
- Sample appointments
- Test data for development

```sql
-- OPTIONAL: Only run this if you want sample data
-- Copy/paste content from setup-sample-appointments.sql
```

### Step 4: Migrate Existing Data

If you have existing appointments that reference old doctor columns, migrate them:

```sql
-- Option A: If you have old appointments with doctor_email
-- (Only if doctor_email column still exists after rollback)
UPDATE appointments a
SET doctor_user_id = au.id
FROM authorized_users au
WHERE au.email = a.doctor_email
  AND au.role = 'doctor'
  AND a.doctor_user_id IS NULL;

-- Option B: If you have appointments with doctor_id from doctors table
-- (Only if doctor_id column exists and references old doctors table)
UPDATE appointments a
SET doctor_user_id = au.id
FROM doctors d
JOIN authorized_users au ON d.email = au.email
WHERE d.id = a.doctor_id
  AND au.role = 'doctor'
  AND a.doctor_user_id IS NULL;

-- Verify migration
SELECT 
    COUNT(*) as total_appointments,
    COUNT(doctor_user_id) as appointments_with_doctor,
    COUNT(*) - COUNT(doctor_user_id) as appointments_missing_doctor
FROM appointments;
```

### Step 5: Add Your Doctors to authorized_users

If you have existing doctors in the old `doctors` table, add them to `authorized_users`:

```sql
-- Add doctors from old doctors table to authorized_users
INSERT INTO public.authorized_users (email, full_name, role, is_active, specialization, license_number, phone)
SELECT 
    d.email,
    d.name,
    'doctor',
    true,
    d.specialization,
    d.license_number,
    d.phone
FROM public.doctors d
WHERE NOT EXISTS (
    SELECT 1 FROM public.authorized_users au 
    WHERE au.email = d.email
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    specialization = EXCLUDED.specialization,
    license_number = EXCLUDED.license_number,
    phone = EXCLUDED.phone,
    role = 'doctor',
    is_active = true;

-- Verify doctors were added
SELECT id, email, full_name, role, specialization, license_number, phone
FROM authorized_users 
WHERE role = 'doctor';
```

### Step 6: Clean Up Old Tables (Optional)

Once you've verified everything works, you can optionally remove old tables:

```sql
-- CAUTION: Only run this after verifying everything works!
-- This will permanently delete the old tables

-- Drop old tables (if you're sure you don't need them)
DROP TABLE IF EXISTS public.patient_doctors CASCADE;

-- You may want to keep the doctors table as backup for a while
-- Or rename it:
ALTER TABLE IF EXISTS public.doctors RENAME TO doctors_backup_old;

-- Later, when you're confident, you can drop it:
-- DROP TABLE IF EXISTS public.doctors_backup_old CASCADE;
```

### Step 7: Verification

Run this comprehensive verification script:

```sql
-- ========================================
-- VERIFICATION CHECKLIST
-- ========================================

-- 1. Check appointments table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'appointments'
  AND column_name IN ('id', 'patient_id', 'doctor_user_id', 'appointment_date', 'appointment_time', 'status', 'deleted_at')
ORDER BY column_name;

-- Expected: doctor_user_id should exist, doctor_email should NOT exist

-- 2. Check for active doctors
SELECT 
    id,
    email, 
    full_name,
    role,
    specialization,
    license_number,
    phone,
    is_active
FROM authorized_users 
WHERE role = 'doctor' 
  AND is_active = true;

-- Expected: At least 1 doctor

-- 3. Check appointments with doctor mapping
SELECT 
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    p.first_name || ' ' || p.last_name as patient_name,
    au.full_name as doctor_name,
    au.specialization as doctor_specialization
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN authorized_users au ON a.doctor_user_id = au.id
WHERE a.deleted_at IS NULL
ORDER BY a.appointment_date DESC
LIMIT 5;

-- Expected: Should show appointments with doctor names

-- 4. Check RLS policies
SELECT 
    policyname,
    cmd as operation,
    roles,
    qual as using_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'appointments'
ORDER BY cmd;

-- Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- 5. Check foreign keys
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    a.attname as column_name,
    af.attname as referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f' 
  AND c.conrelid = 'public.appointments'::regclass;

-- Expected: Should show doctor_user_id references authorized_users(id)

-- 6. Check for orphaned appointments (without valid doctor)
SELECT COUNT(*) as orphaned_appointments
FROM appointments a
WHERE a.doctor_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM authorized_users au 
    WHERE au.id = a.doctor_user_id 
      AND au.role = 'doctor'
  );

-- Expected: 0 (no orphaned appointments)

-- ========================================
-- If all checks pass, your migration is complete! ✅
-- ========================================
```

## Rollback Plan (If Something Goes Wrong)

If you need to revert everything:

```sql
-- 1. Restore from backup
DROP TABLE IF EXISTS public.appointments CASCADE;
ALTER TABLE appointments_backup RENAME TO appointments;

-- 2. Restore constraints and indexes (you'll need to recreate these)
-- 3. Contact support or check your backup files
```

## Summary

### Files to Run (In Order):
1. ✅ `rollback-old-appointments-setup.sql` - Remove old structure
2. ✅ `reset-appointments-for-authorized-users.sql` - Set up new structure  
3. ✅ `setup-appointments-with-doctors.sql` - Enhance authorized_users
4. ⚠️ `setup-sample-appointments.sql` - (Optional) Sample data
5. ✅ Manual data migration SQL (if you have existing appointments)
6. ✅ Verification queries

### What You'll Have After Migration:
- ✅ `appointments.doctor_user_id` → references `authorized_users.id`
- ✅ Doctors are in `authorized_users` with `role = 'doctor'`
- ✅ Enhanced doctor profiles (specialization, license, phone)
- ✅ Proper RLS policies for security
- ✅ No dependency on old `doctors` table
- ✅ Clean, maintainable structure

### Next Steps After Migration:
1. Test the appointments page (`/appointments`)
2. Create test appointments
3. Verify doctor dropdowns work
4. Check that appointment details display correctly
5. Test edit and delete functionality

## Troubleshooting

### Error: "column doctor_user_id does not exist"
**Solution:** Run `reset-appointments-for-authorized-users.sql`

### Error: "foreign key constraint violation"  
**Solution:** Ensure doctors exist in `authorized_users` before creating appointments

### Error: "no policy allows access"
**Solution:** Run the RLS policy section from `reset-appointments-for-authorized-users.sql`

### No doctors showing in dropdown
**Solution:** Add doctors to `authorized_users` with `role = 'doctor'` and `is_active = true`

## Need Help?

If you encounter issues:
1. Check the verification queries above
2. Review the Supabase logs
3. Check browser console for frontend errors
4. Verify your RLS policies
5. Ensure your auth token is valid
