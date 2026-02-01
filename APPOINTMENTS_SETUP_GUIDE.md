# Appointments System - Setup Guide

## Overview
The appointments system allows you to schedule, manage, and track patient appointments with doctors. It integrates with the existing doctors table and authorized_users for access control.

## Features
✅ Create, edit, and delete appointments
✅ Assign appointments to specific doctors from the doctors table
✅ Filter appointments by date and status
✅ View appointments in a card-based interface
✅ Admin-only edit and delete permissions
✅ Doctor and patient details displayed on each appointment card

## Database Structure

### Tables Used
1. **`appointments`** - Main appointments table
2. **`doctors`** - Existing doctors table (linked to appointments)
3. **`patients`** - Patient information
4. **`authorized_users`** - For authentication and access control

### Appointments Table Schema
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID REFERENCES doctors(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled',
    purpose VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Setup Instructions

### Step 1: Run the Database Migration

Execute the SQL migration script to set up the appointments table structure:

```bash
# In Supabase SQL Editor, run:
```sql
-- Run this file
setup-appointments-with-doctors.sql
```

This script will:
- Ensure doctors table has email column
- Make doctor email unique (for linking to authorized_users)
- Update appointments table to use doctor_id (UUID) from doctors table
- Create indexes for performance
- Create a helpful view: doctors_with_access

### Step 2: Add Doctors to the System

Doctors must exist in the `doctors` table with their email address:

```sql
-- Example: Add a doctor
INSERT INTO public.doctors (name, specialization, email, phone, license_number)
VALUES 
  ('Dr. John Smith', 'Orthodontist', 'john.smith@clinic.com', '555-1234', 'LIC123'),
  ('Dr. Sarah Johnson', 'Endodontist', 'sarah.johnson@clinic.com', '555-5678', 'LIC456');
```

### Step 3: Give Doctors System Access

Add doctors to `authorized_users` so they can log in:

```sql
-- Give doctor system access
INSERT INTO public.authorized_users (email, role, full_name, is_active)
VALUES 
  ('john.smith@clinic.com', 'doctor', 'Dr. John Smith', true),
  ('sarah.johnson@clinic.com', 'doctor', 'Dr. Sarah Johnson', true);
```

### Step 4: Verify Setup

Check that everything is connected:

```sql
-- View doctors with their system access
SELECT * FROM public.doctors_with_access;

-- This should show:
-- - Doctor info from doctors table
-- - Their role and access status from authorized_users
```

## Using the Appointments Page

### Accessing the Page
Navigate to `/appointments` in your application.

### Creating an Appointment

1. Click the **"New Appointment"** button
2. Fill in the form:
   - **Patient**: Select from the dropdown (shows active patients)
   - **Doctor**: Select from the dropdown (shows all doctors)
   - **Date**: Choose appointment date
   - **Time**: Choose appointment time (24-hour format)
   - **Status**: Scheduled, Confirmed, In Progress, Completed, or Cancelled
   - **Purpose**: (Optional) Reason for appointment
   - **Notes**: (Optional) Additional information
3. Click **"Save Appointment"**

### Filtering Appointments

- **Date Filter**: Use the date picker to view appointments for a specific date or later
- **Status Filter**: Filter by appointment status (All, Scheduled, Confirmed, etc.)

### Editing an Appointment (Admin Only)

1. Click the **"Edit"** button on an appointment card
2. Modify the details in the modal
3. Click **"Save Appointment"**

### Deleting an Appointment (Admin Only)

1. Click the **"Delete"** button on an appointment card
2. Confirm the deletion

## Appointment Statuses

- **Scheduled**: Initial status when appointment is created
- **Confirmed**: Patient has confirmed attendance
- **In Progress**: Patient is currently being seen
- **Completed**: Appointment finished
- **Cancelled**: Appointment was cancelled

## Patient-Doctor Mapping

When you create a case or appointment for a patient, that patient becomes associated with that doctor. You can view:
- Which patients a doctor has
- Which doctor(s) a patient has seen
- Appointment history per doctor-patient relationship

### View Patient's Doctors

```sql
-- See all doctors a patient has appointments with
SELECT DISTINCT 
  p.first_name, 
  p.last_name,
  d.name as doctor_name,
  d.specialization
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
WHERE p.id = 'PATIENT_UUID_HERE';
```

### View Doctor's Patients

```sql
-- See all patients a doctor has appointments with
SELECT DISTINCT 
  p.first_name,
  p.last_name,
  p.patient_phone,
  p.email
FROM appointments a
JOIN patients p ON a.patient_id = p.id
WHERE a.doctor_id = 'DOCTOR_UUID_HERE'
ORDER BY p.last_name, p.first_name;
```

## Permissions

### Role-Based Access

- **Admin**: Full access - create, edit, delete appointments
- **Doctor**: Can view appointments (edit/delete buttons hidden)
- **Helper**: Can view appointments (edit/delete buttons hidden)
- **Patient**: Can view their own appointments

### Modifying Permissions

Permissions are controlled in the component via the `useAuth()` hook:

```tsx
const { role } = useAuth();

// Only admins see action buttons
{role === 'admin' && (
  <div className="mt-4 flex gap-2">
    <button onClick={() => handleEditAppointment(appointment)}>
      Edit
    </button>
    <button onClick={() => handleDeleteAppointment(appointment.id)}>
      Delete
    </button>
  </div>
)}
```

## Troubleshooting

### Issue: No doctors appear in the dropdown

**Solution**:
```sql
-- Check if doctors exist
SELECT * FROM public.doctors;

-- If empty, add doctors
INSERT INTO public.doctors (name, email, phone, specialization)
VALUES ('Dr. Test', 'test@clinic.com', '555-0000', 'General Dentistry');
```

### Issue: "doctor_id cannot be null" error

**Solution**: The appointments table requires doctor_id. Make sure you:
1. Have doctors in the doctors table
2. Select a doctor when creating an appointment
3. Run the migration script properly

### Issue: Appointments not showing

**Solution**:
```sql
-- Check if appointments exist and have valid data
SELECT 
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.status,
  p.first_name as patient_name,
  d.name as doctor_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
ORDER BY a.appointment_date DESC, a.appointment_time DESC;
```

### Issue: Can't delete appointments

**Solution**: Only admins can delete. Check:
```sql
-- Verify your role
SELECT email, role, is_active 
FROM authorized_users 
WHERE email = 'your-email@example.com';

-- Should show role = 'admin'
```

## API Reference

### Fetch Appointments

```typescript
const { data, error } = await supabase
  .from('appointments')
  .select(`
    *,
    patients!inner(id, first_name, last_name, patient_phone, email),
    doctors(id, name, specialization, email, phone)
  `)
  .gte('appointment_date', selectedDate)
  .order('appointment_date', { ascending: true });
```

### Create Appointment

```typescript
const { error } = await supabase
  .from('appointments')
  .insert([{
    patient_id: 'patient-uuid',
    doctor_id: 'doctor-uuid',
    appointment_date: '2026-01-28',
    appointment_time: '10:00',
    status: 'Scheduled',
    purpose: 'Checkup',
    notes: 'Regular cleaning'
  }]);
```

### Update Appointment

```typescript
const { error } = await supabase
  .from('appointments')
  .update({
    status: 'Completed',
    notes: 'Treatment completed successfully'
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

## Next Steps

1. **Email Notifications**: Add email notifications when appointments are created/updated
2. **SMS Reminders**: Send SMS reminders to patients before their appointments
3. **Calendar View**: Implement a calendar view for better visualization
4. **Recurring Appointments**: Add support for recurring appointments
5. **Appointment History**: Show complete appointment history on patient detail page
6. **Doctor Schedule**: Create a doctor schedule management page
7. **Waitlist**: Implement a waitlist for fully booked time slots

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify database tables exist and have correct structure
3. Ensure RLS policies allow the operation
4. Check that doctors exist in the doctors table
5. Verify authorized_users has correct roles

---

**Last Updated**: January 28, 2026
**Version**: 1.0
