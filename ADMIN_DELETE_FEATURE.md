# Admin-Only Delete Feature Documentation

## Overview

This document describes the admin-only delete functionality for patients and cases in the Dental Clinic Management System.

## Features Implemented

### 1. Delete Patient (Admin Only)
**Location**: `/patients/[id]` page

**Access Control**:
- ✅ Only users with `role === 'admin'` can see the delete button
- ✅ Non-admin users (doctor, helper, patient) cannot delete patients
- ❌ Delete button is hidden for non-admin users

**What Gets Deleted**:
When a patient is deleted, the system permanently removes:
- Patient record
- All associated cases
- All appointments
- All invoices
- All case treatments

**Confirmation**:
- Shows detailed confirmation dialog before deletion
- Lists all data that will be deleted
- Requires explicit confirmation

### 2. Delete Case (Admin Only)
**Location**: `/case/[id]` page

**Access Control**:
- ✅ Only users with `role === 'admin'` can see the delete button
- ✅ Non-admin users (doctor, helper, patient) cannot delete cases
- ❌ Delete button is hidden for non-admin users

**What Gets Deleted**:
When a case is deleted, the system permanently removes:
- Case record
- All case treatments
- Associated invoices

**Confirmation**:
- Shows detailed confirmation dialog before deletion
- Displays patient name and diagnosis
- Lists all data that will be deleted
- Requires explicit confirmation

---

## User Interface

### Patient Detail Page

**For Admin Users**:
```
[Back to Patients]                    [Edit Patient] [Delete Patient]
```

**For Non-Admin Users**:
```
[Back to Patients]                    [Edit Patient]
```

### Case Detail Page

**For Admin Users (Not Editing)**:
```
[Back]     [Edit Case] [Create Invoice] [View Invoices] [Delete Case]
```

**For Non-Admin Users (Not Editing)**:
```
[Back]     [Edit Case] [Create Invoice] [View Invoices]
```

---

## How It Works

### Role Check

The system uses the `useAuth()` hook to check the current user's role:

```typescript
const { role } = useAuth();

// Only show delete button for admins
{role === 'admin' && (
  <button onClick={handleDelete}>Delete</button>
)}
```

### Delete Patient Flow

1. **Admin clicks "Delete Patient"**
2. **System checks role**:
   - If not admin → Show "Only administrators can delete patients" alert
   - If admin → Continue
3. **Confirmation dialog**:
   - Shows patient name
   - Lists all data that will be deleted
   - Requires explicit "OK" to proceed
4. **Deletion**:
   - Deletes patient record from database
   - Supabase handles cascading deletes for related records
5. **Success**:
   - Shows success alert
   - Redirects to patients list

### Delete Case Flow

1. **Admin clicks "Delete Case"**
2. **System checks role**:
   - If not admin → Show "Only administrators can delete cases" alert
   - If admin → Continue
3. **Confirmation dialog**:
   - Shows patient name and diagnosis
   - Lists all data that will be deleted
   - Requires explicit "OK" to proceed
4. **Deletion**:
   - Deletes case record from database
   - Supabase handles cascading deletes for related records
5. **Success**:
   - Shows success alert
   - Redirects to patient detail page

---

## Security

### Frontend Protection

- ✅ Delete buttons only visible to admins
- ✅ Role check in delete handler functions
- ✅ Alert message if non-admin tries to delete
- ✅ Button disabled during deletion process

### Backend Protection (Recommended)

You should also add Row Level Security (RLS) policies in Supabase:

```sql
-- Only admins can delete patients
CREATE POLICY "Only admins can delete patients"
  ON public.patients
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

-- Only admins can delete cases
CREATE POLICY "Only admins can delete cases"
  ON public.cases
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
```

---

## Error Handling

### Network Errors
- Catches Supabase deletion errors
- Shows user-friendly error message
- Keeps user on same page to retry

### Permission Errors
- Checks role before attempting deletion
- Shows clear message about admin requirement
- Prevents unnecessary API calls

### Loading States
- Button shows "Deleting..." during deletion
- Button is disabled to prevent double-clicks
- User cannot navigate away during deletion

---

## Code Changes

### Files Modified

1. **`/src/app/patients/[id]/page.tsx`**
   - Added `useAuth` import
   - Added `Trash2` icon import
   - Added `deleting` state
   - Added `handleDeletePatient` function
   - Added delete button (admin-only)

2. **`/src/app/case/[id]/page.tsx`**
   - Added `useAuth` import
   - Added `Trash2` icon import
   - Added `deleting` state
   - Added `handleDeleteCase` function
   - Added delete button (admin-only)

### Key Functions

**Delete Patient**:
```typescript
const handleDeletePatient = async () => {
  if (role !== 'admin') {
    alert('Only administrators can delete patients.');
    return;
  }
  
  if (!confirm('Confirmation message...')) {
    return;
  }
  
  try {
    setDeleting(true);
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId);
    
    if (error) throw error;
    
    alert('Patient deleted successfully.');
    router.push('/patients');
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to delete patient.');
  } finally {
    setDeleting(false);
  }
};
```

**Delete Case**:
```typescript
const handleDeleteCase = async () => {
  if (role !== 'admin') {
    alert('Only administrators can delete cases.');
    return;
  }
  
  if (!confirm('Confirmation message...')) {
    return;
  }
  
  try {
    setDeleting(true);
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', caseId);
    
    if (error) throw error;
    
    alert('Case deleted successfully.');
    router.push(`/patients/${caseDetails.patient_id}`);
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to delete case.');
  } finally {
    setDeleting(false);
  }
};
```

---

## Testing Checklist

### As Admin User:

- [ ] Can see "Delete Patient" button on patient detail page
- [ ] Can see "Delete Case" button on case detail page
- [ ] Clicking delete shows confirmation dialog
- [ ] Canceling confirmation does nothing
- [ ] Confirming deletion removes the record
- [ ] After deletion, redirected to appropriate page
- [ ] Deleted patient no longer appears in patients list
- [ ] Deleted case no longer appears in patient's cases

### As Non-Admin User (Doctor/Helper):

- [ ] Cannot see "Delete Patient" button
- [ ] Cannot see "Delete Case" button
- [ ] Can still edit patients and cases
- [ ] Can view all information normally

### Edge Cases:

- [ ] Cannot delete a patient with active appointments
- [ ] Cannot delete a case with paid invoices (consider business logic)
- [ ] Proper error message if network fails
- [ ] Button disabled during deletion to prevent double-delete

---

## User Roles

| Role | View Patient | Edit Patient | Delete Patient | View Case | Edit Case | Delete Case |
|------|-------------|--------------|----------------|-----------|-----------|-------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Doctor** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Helper** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Patient** | 🔒 Own Only | ❌ | ❌ | 🔒 Own Only | ❌ | ❌ |

---

## Best Practices

### Before Deleting

**Admins should verify**:
1. No outstanding payments/invoices
2. No upcoming appointments
3. All necessary data has been backed up
4. Patient has been properly notified (if applicable)

### Alternatives to Deletion

Consider **soft delete** instead:
- Add `is_deleted` boolean field
- Hide deleted records from normal views
- Allow recovery within a time period
- Maintain audit trail

### Audit Trail

Consider logging deletions:
```sql
CREATE TABLE deletion_log (
  id UUID PRIMARY KEY,
  deleted_by TEXT,
  deleted_at TIMESTAMP,
  record_type TEXT,
  record_id UUID,
  record_data JSONB
);
```

---

## Future Enhancements

### Potential Improvements:

1. **Soft Delete**
   - Add `deleted_at` field
   - Hide instead of permanently delete
   - Allow recovery within 30 days

2. **Batch Delete**
   - Select multiple patients/cases
   - Delete in bulk
   - Progress indicator

3. **Archive**
   - Move old records to archive table
   - Keep for historical reference
   - Reduce main table size

4. **Confirmation Requirements**
   - Type "DELETE" to confirm
   - Add secondary password check
   - Require reason for deletion

5. **Activity Log**
   - Log all deletions
   - Show who deleted what and when
   - Admin audit trail

---

## Troubleshooting

### Delete Button Not Showing

**Check**:
1. Are you logged in as admin?
   ```sql
   SELECT role FROM authorized_users WHERE email = 'your-email';
   ```
2. Is `useAuth()` working?
3. Browser console for errors

### Delete Fails

**Common Issues**:
1. Foreign key constraints
2. Network error
3. Permission denied (RLS policies)
4. Record doesn't exist

**Solution**:
- Check browser console
- Check Supabase logs
- Verify RLS policies
- Check foreign key constraints

### Accidental Deletion

**Recovery**:
1. Check database backups
2. Use Supabase point-in-time recovery
3. Restore from most recent backup
4. Implement soft delete to prevent this

---

## Support

For issues or questions about the delete functionality:
1. Check this documentation
2. Review browser console errors
3. Check Supabase logs
4. Verify user role in database

---

*Last Updated: January 28, 2026*
*Feature Version: 1.0*
