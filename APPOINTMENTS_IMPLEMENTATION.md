# Appointments System Documentation

## Overview
The appointments system allows admin users to schedule, manage, and track patient appointments with doctors from the user management system.

## Features Implemented

### 1. **Appointments Management**
- ✅ Create new appointments
- ✅ Edit existing appointments
- ✅ Delete appointments (admin only)
- ✅ View appointments in a calendar/grid view
- ✅ Filter by date and status

### 2. **Doctor Assignment**
- ✅ Doctors are pulled from the `authorized_users` table (role = 'doctor')
- ✅ Each appointment is assigned to a specific doctor
- ✅ Doctor information is displayed on appointment cards

### 3. **Patient Mapping**
- ✅ Appointments link patients to doctors
- ✅ Only active, non-deleted patients can be selected
- ✅ Patient information is displayed on appointment cards

### 4. **Status Tracking**
Appointments support the following statuses:
- **Scheduled** - Initial state when appointment is created
- **Confirmed** - Patient has confirmed the appointment
- **In Progress** - Appointment is currently happening
- **Completed** - Appointment has been completed
- **Cancelled** - Appointment has been cancelled

## Database Structure

### Main Table: `appointments`
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),
    doctor_email VARCHAR(255),  -- Email from authorized_users table
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled',
    purpose VARCHAR(200),
    notes TEXT,
    deleted_at TIMESTAMP,  -- Soft delete
    deleted_by VARCHAR(255),  -- Admin who deleted
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Supporting Table: `patient_doctors`
```sql
CREATE TABLE patient_doctors (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),
    doctor_email VARCHAR(255),
    is_primary BOOLEAN DEFAULT true,
    assigned_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Setup Instructions

### 1. Run Database Migrations
Execute the following SQL files in your Supabase SQL editor:

```bash
# 1. Update appointments table to use doctor_email
update-appointments-table.sql

# 2. Create patient-doctor mapping table (optional but recommended)
setup-patient-doctors-mapping.sql
```

### 2. Verify Doctor Users
Ensure you have users with the 'doctor' role in the `authorized_users` table:

```sql
SELECT email, full_name, role, is_active 
FROM authorized_users 
WHERE role = 'doctor';
```

If you don't have any doctors, add them via the User Management page (/users) or SQL:

```sql
INSERT INTO authorized_users (email, full_name, role, is_active)
VALUES ('doctor@example.com', 'Dr. John Smith', 'doctor', true);
```

### 3. Test the Appointments Page
1. Navigate to `/appointments` in your app
2. Click "New Appointment" (admin only)
3. Select a patient and doctor
4. Fill in date, time, and other details
5. Save the appointment

## User Permissions

### Admin Role
- ✅ Create appointments
- ✅ Edit appointments
- ✅ Delete appointments
- ✅ View all appointments
- ✅ Assign patients to any doctor

### Doctor Role
- ✅ View appointments assigned to them
- ❌ Cannot create/edit/delete appointments
- ❌ Cannot see appointments for other doctors

### Helper Role
- ✅ View all appointments
- ❌ Cannot create/edit/delete appointments

### Patient Role
- ✅ View their own appointments
- ❌ Cannot see other patients' appointments
- ❌ Cannot create/edit/delete appointments

## Features

### Appointment Card
Each appointment card displays:
- Patient name and phone number
- Doctor name/email
- Appointment date and time
- Status badge (color-coded)
- Purpose and notes
- Edit/Delete buttons (admin only)

### Filters
- **Date Filter**: Show appointments from selected date onwards
- **Status Filter**: Filter by appointment status (All, Scheduled, Confirmed, etc.)

### Modal Form
The appointment form includes:
- Patient dropdown (searchable)
- Doctor dropdown (only active doctors)
- Date picker
- Time picker
- Status selector
- Purpose field (optional)
- Notes field (optional)

## API Endpoints

### Fetch Appointments
```typescript
const { data, error } = await supabase
  .from('appointments')
  .select(`
    *,
    patients!inner(id, first_name, last_name, patient_phone, email)
  `)
  .gte('appointment_date', selectedDate)
  .order('appointment_date', { ascending: true })
  .order('appointment_time', { ascending: true });
```

### Create Appointment
```typescript
const { error } = await supabase
  .from('appointments')
  .insert([{
    patient_id: formData.patient_id,
    doctor_email: formData.doctor_email,
    appointment_date: formData.appointment_date,
    appointment_time: formData.appointment_time,
    status: formData.status,
    purpose: formData.purpose,
    notes: formData.notes
  }]);
```

### Update Appointment
```typescript
const { error } = await supabase
  .from('appointments')
  .update({
    patient_id: formData.patient_id,
    doctor_email: formData.doctor_email,
    appointment_date: formData.appointment_date,
    appointment_time: formData.appointment_time,
    status: formData.status,
    purpose: formData.purpose,
    notes: formData.notes
  })
  .eq('id', appointmentId);
```

### Delete Appointment
```typescript
const { error } = await supabase
  .from('appointments')
  .delete()
  .eq('id', appointmentId);
```

## Future Enhancements

### Recommended Features
1. **Appointment Reminders**
   - Email/SMS reminders 24 hours before appointment
   - Configurable reminder settings

2. **Doctor's Schedule View**
   - Calendar view for doctors
   - Show available/busy time slots
   - Block out unavailable times

3. **Recurring Appointments**
   - Support for weekly/monthly recurring appointments
   - Edit single or all occurrences

4. **Patient Self-Booking**
   - Allow patients to book their own appointments
   - Show available time slots based on doctor's schedule

5. **Appointment History**
   - View past appointments
   - Statistics and analytics

6. **Soft Delete for Appointments**
   - Currently using hard delete
   - Implement soft delete with `deleted_at` column

7. **Conflict Detection**
   - Prevent double-booking same doctor at same time
   - Warn if patient has overlapping appointments

8. **Integration with Cases**
   - Link appointments to specific cases
   - Show case context in appointment details

## Troubleshooting

### Issue: No doctors showing in dropdown
**Solution**: Ensure you have active users with role='doctor':
```sql
SELECT * FROM authorized_users WHERE role = 'doctor' AND is_active = true;
```

### Issue: Appointments not loading
**Solution**: Check RLS policies are properly set:
```sql
SELECT * FROM pg_policies WHERE tablename = 'appointments';
```

### Issue: Cannot create appointments
**Solution**: Verify you're logged in as admin:
```sql
SELECT role FROM authorized_users WHERE email = 'your-email@example.com';
```

### Issue: Doctor names not showing
**Solution**: Ensure doctor_email matches email in authorized_users:
```sql
SELECT a.id, a.doctor_email, au.full_name 
FROM appointments a
LEFT JOIN authorized_users au ON a.doctor_email = au.email
WHERE a.doctor_email IS NOT NULL;
```

## Testing Checklist

- [ ] Can create a new appointment as admin
- [ ] Can edit an existing appointment as admin
- [ ] Can delete an appointment as admin
- [ ] Non-admins cannot see create/edit/delete buttons
- [ ] Doctor dropdown shows only active doctors
- [ ] Patient dropdown shows only non-deleted patients
- [ ] Date filter works correctly
- [ ] Status filter works correctly
- [ ] Appointment cards display all information correctly
- [ ] Time is formatted correctly (12-hour format with AM/PM)
- [ ] Status badges have correct colors
- [ ] Modal closes properly after save
- [ ] Form validation works (required fields)
- [ ] Database is updated after create/edit/delete

## Files Modified

### Frontend
- `src/app/appointments/page.tsx` - Main appointments page with full CRUD

### Database
- `update-appointments-table.sql` - Migration to add doctor_email column
- `setup-patient-doctors-mapping.sql` - Optional patient-doctor mapping table

### Documentation
- `APPOINTMENTS_IMPLEMENTATION.md` - This file

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the Supabase logs in the dashboard
3. Verify RLS policies are correct
4. Ensure all migrations have been run
5. Check that you're logged in as admin for create/edit/delete operations
