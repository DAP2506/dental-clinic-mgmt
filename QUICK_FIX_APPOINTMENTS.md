# 🚀 Quick Fix Guide - Appointments System

## Your Error: "column doctor_email does not exist"

This means you're trying to rollback a column that was never created. **This is NORMAL if you haven't run previous migrations.**

---

## ✅ Quick Solution (2 Steps)

### Option A: Fresh Start (Recommended if unsure)
If you're not sure what you've run before:

1. **Run:** `reset-appointments-for-authorized-users.sql`
   - This completely resets appointments table
   - Safe to run multiple times

2. **Run:** `setup-appointments-complete.sql`
   - Sets up the new system with doctor_user_id
   - Adds doctor fields to authorized_users

### Option B: Careful Migration (If you have existing data)
If you have existing appointments you want to keep:

1. **Run:** `rollback-old-appointments-setup.sql`
   - Fixed version that checks if columns exist before dropping
   - Should now work without errors

2. **Run:** `setup-appointments-complete.sql`
   - Sets up new system

---

## 🧪 Test After Setup

Run this to verify everything worked:

```sql
-- Should return 3 columns
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'appointments' 
AND column_name IN ('doctor_user_id', 'deleted_at', 'deleted_by');

-- Should return at least 1 doctor
SELECT COUNT(*) 
FROM authorized_users 
WHERE role = 'doctor';
```

---

## 📝 Order of Operations

```
1. BACKUP DATA (create appointments_backup table)
   ↓
2. Run rollback-old-appointments-setup.sql (now fixed!)
   ↓
3. Run setup-appointments-complete.sql
   ↓
4. (Optional) Run setup-sample-appointments.sql for test data
   ↓
5. Test the /appointments page
```

---

## ⚠️ Common Errors Fixed

| Error | Solution |
|-------|----------|
| `column doctor_email does not exist` | ✅ Fixed in rollback script - now checks before dropping |
| `syntax error at or near RAISE` | ✅ Fixed - all RAISE wrapped in DO blocks |
| `relation patient_doctors does not exist` | ✅ Fixed - uses DROP IF EXISTS |
| `column doctor_user_id already exists` | ✅ Normal - setup already ran, skip and test |

---

## 🎯 What The System Does Now

- ✅ Appointments use `doctor_user_id` → references `authorized_users.id`
- ✅ Doctors in User Management can be assigned to appointments  
- ✅ Rich doctor profiles (specialization, phone, license)
- ✅ Soft delete for appointments
- ✅ Admin-only create/edit/delete
- ✅ No dependency on `doctors` or `doctors_with_access` tables

---

## 🔍 Quick Verification

After running the setup, this query should work:

```sql
SELECT 
    a.appointment_date,
    a.appointment_time,
    au.full_name as doctor_name,
    au.specialization,
    p.first_name || ' ' || p.last_name as patient_name
FROM appointments a
JOIN authorized_users au ON a.doctor_user_id = au.id
JOIN patients p ON a.patient_id = p.id
WHERE a.deleted_at IS NULL
LIMIT 5;
```

If this works → ✅ **Setup successful!**

---

## 📚 Full Documentation

For detailed guides, see:
- `APPOINTMENTS_MIGRATION_GUIDE.md` - Complete migration process
- `APPOINTMENTS_SETUP_GUIDE.md` - Feature documentation
- `verify-appointments-setup.sql` - All validation queries

---

## 🆘 Still Stuck?

1. Check which columns exist:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'appointments';
```

2. Check Supabase logs for the exact error
3. Try the "Fresh Start" option above
4. Ensure you're logged in as admin in the app

---

**Last Updated:** 2026-01-28  
**Status:** Rollback script fixed ✅
