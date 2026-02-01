# Quick Setup Guide - Appointments System

## Step-by-Step Setup

### Step 1: Run Database Migrations

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL files in order:

#### File 1: `update-appointments-table.sql`
```sql
-- Copy and paste the entire content from update-appointments-table.sql
-- This adds doctor_email column and RLS policies
```

#### File 2 (Optional): `setup-patient-doctors-mapping.sql`
```sql
-- Copy and paste the entire content from setup-patient-doctors-mapping.sql
-- This creates the patient-doctor mapping table
```

### Step 2: Add Doctor Users

If you don't have any doctors in your system:

1. Go to `/users` in your app (User Management page)
2. Click "Add User"
3. Fill in the form:
   - **Email**: doctor@example.com
   - **Full Name**: Dr. John Smith
   - **Role**: doctor
4. Click "Add User"

Or run this SQL in Supabase:
```sql
INSERT INTO public.authorized_users (email, full_name, role, is_active)
VALUES 
  ('doctor1@dentalclinic.com', 'Dr. Sarah Johnson', 'doctor', true),
  ('doctor2@dentalclinic.com', 'Dr. Michael Chen', 'doctor', true);
```

### Step 3: Verify Setup

Run this query to verify everything is set up:

```sql
-- Check if appointments table has doctor_email column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
  AND column_name = 'doctor_email';

-- Check if you have active doctors
SELECT email, full_name, role, is_active 
FROM public.authorized_users 
WHERE role = 'doctor' 
  AND is_active = true;

-- Check RLS policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'appointments';
```

### Step 4: Test the Appointments Page

1. **Login as Admin**
   - Navigate to `/login`
   - Use an admin account

2. **Go to Appointments**
   - Click on "Appointments" in the sidebar
   - Or navigate to `/appointments`

3. **Create Test Appointment**
   - Click "New Appointment" button
   - Select a patient from dropdown
   - Select a doctor from dropdown
   - Choose date and time
   - Add purpose and notes (optional)
   - Click "Create Appointment"

4. **Verify Appointment**
   - Appointment should appear in the grid
   - Should show patient name, doctor, date, time
   - Status badge should be visible

5. **Test Edit**
   - Click "Edit" button on appointment card
   - Modify some fields
   - Save changes
   - Verify changes are reflected

6. **Test Delete**
   - Click "Delete" button
   - Confirm deletion
   - Verify appointment is removed

### Step 5: Test Filters

1. **Date Filter**
   - Change the date in the date picker
   - Appointments should filter to show only those on or after selected date

2. **Status Filter**
   - Select different statuses from dropdown
   - Appointments should filter accordingly

## Common Issues and Solutions

### Issue 1: "No doctors showing in dropdown"
**Cause**: No users with role='doctor' in authorized_users table

**Solution**: Add doctors via User Management page or SQL:
```sql
INSERT INTO public.authorized_users (email, full_name, role, is_active)
VALUES ('doctor@example.com', 'Dr. John Doe', 'doctor', true);
```

### Issue 2: "Cannot create appointments" (Error 42501)
**Cause**: RLS policies not properly configured

**Solution**: Re-run the RLS policy section from `update-appointments-table.sql`

### Issue 3: "Doctor name not showing on appointment cards"
**Cause**: doctor_email doesn't match any email in authorized_users

**Solution**: Check the mapping:
```sql
SELECT a.doctor_email, au.email, au.full_name
FROM appointments a
LEFT JOIN authorized_users au ON a.doctor_email = au.email;
```

### Issue 4: "Patients not showing in dropdown"
**Cause**: All patients might be soft-deleted

**Solution**: Check patients table:
```sql
SELECT id, first_name, last_name, deleted_at 
FROM patients 
WHERE deleted_at IS NULL;
```

### Issue 5: "TypeError: Cannot read property 'full_name' of null"
**Cause**: Appointment has doctor_email that doesn't exist in authorized_users

**Solution**: Update the appointment with a valid doctor email:
```sql
UPDATE appointments 
SET doctor_email = 'valid-doctor@example.com' 
WHERE doctor_email NOT IN (
  SELECT email FROM authorized_users WHERE role = 'doctor'
);
```

## Data Validation Checklist

Before using the appointments system, verify:

- [ ] `appointments` table exists
- [ ] `doctor_email` column exists in appointments
- [ ] At least one doctor user exists (role='doctor', is_active=true)
- [ ] At least one patient exists (deleted_at IS NULL)
- [ ] RLS policies are enabled on appointments table
- [ ] Current user has admin role for creating appointments
- [ ] Supabase environment variables are configured in .env.local

## Environment Variables

Ensure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Quick Test SQL

Run this to create a test appointment manually:

```sql
-- Create test appointment
INSERT INTO public.appointments (
  patient_id,
  doctor_email,
  appointment_date,
  appointment_time,
  status,
  purpose,
  notes
)
SELECT 
  p.id,
  'doctor@example.com',
  CURRENT_DATE + INTERVAL '1 day',
  '10:00:00',
  'Scheduled',
  'Routine checkup',
  'Test appointment'
FROM patients p
WHERE p.deleted_at IS NULL
LIMIT 1;
```

## Next Steps

After appointments are working:

1. **Add more doctors** - Go to User Management and add all your doctors
2. **Create appointments** - Schedule appointments for your patients
3. **Train staff** - Show users how to create/manage appointments
4. **Monitor usage** - Check that appointments are being created correctly

## Support

If you encounter issues not covered here:
1. Check browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Verify you're logged in as admin
4. Ensure all migrations have been run
5. Check network tab for failed API calls

## Success Indicators

You'll know everything is working when:
- ✅ Appointments page loads without errors
- ✅ Doctor dropdown shows active doctors
- ✅ Patient dropdown shows non-deleted patients
- ✅ Can create new appointments
- ✅ Can edit existing appointments
- ✅ Can delete appointments (admin only)
- ✅ Filters work correctly
- ✅ Appointment cards display all information
- ✅ Status badges show correct colors
