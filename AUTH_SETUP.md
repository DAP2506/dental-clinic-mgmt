# 🔐 Google Authentication Setup Guide

This guide will help you set up Google Authentication for your Dental Clinic Management System.

## 📋 Prerequisites

- Supabase account with your project set up
- Access to Supabase SQL Editor
- Google Cloud Console access (for OAuth setup)

---

## 🚀 Step-by-Step Setup

### 1️⃣ Run the Authentication SQL Script

**⚠️ SAFE TO RUN**: This script only creates NEW authentication tables and does NOT modify your existing data!

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor** (in the left sidebar)
4. Copy the contents of `setup-auth.sql` and paste it
5. Click **RUN** to execute the script

This will:
✅ Create the `authorized_users` table (separate from your existing tables)
✅ Add the user role enum type
✅ Insert the default admin user (dhruvpanchaljob2506@gmail.com)
✅ Set up Row Level Security (RLS) policies
✅ Create helper functions for role checking
✅ **Does NOT touch**: patients, doctors, appointments, cases, or any existing data

---

### 2️⃣ Configure Google OAuth in Supabase

1. Go to **Authentication** > **Providers** in your Supabase Dashboard
2. Find **Google** in the list of providers
3. Enable Google Authentication
4. You'll need to set up a Google OAuth application...

#### Setting up Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Configure the OAuth consent screen if prompted:
   - User Type: Internal (for organization) or External (for anyone with Google account)
   - App name: DentalCare Clinic
   - User support email: your email
   - Developer contact: your email
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: DentalCare Clinic
   - Authorized JavaScript origins:
     ```
     https://cykqmnheaytogzdzzzxw.supabase.co
     http://localhost:3000
     ```
   - Authorized redirect URIs:
     ```
     https://cykqmnheaytogzdzzzxw.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     ```
7. Click **CREATE**
8. Copy the **Client ID** and **Client Secret**

#### Add credentials to Supabase:

1. Back in Supabase: **Authentication** > **Providers** > **Google**
2. Paste your **Client ID** and **Client Secret**
3. Click **Save**

---

### 3️⃣ Update Environment Variables (Optional)

Your `.env.local` already has the required variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://cykqmnheaytogzdzzzxw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

No additional environment variables needed!

---

### 4️⃣ Test the Authentication

1. Make sure your development server is running:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. You should be automatically redirected to `/login`

4. Click **Continue with Google**

5. Sign in with `dhruvpanchaljob2506@gmail.com` (default admin)

6. You'll be redirected to the dashboard

---

## 👥 User Roles & Permissions

### Role Types:

| Role    | Access Level                                                  |
|---------|--------------------------------------------------------------|
| **Admin**   | Full access + User Management                            |
| **Doctor**  | Patient records, Cases, Treatments, Appointments        |
| **Helper**  | Patient records, Appointments, Billing                  |
| **Patient** | Limited access (future: only their own records)         |

### Navigation Access by Role:

- **Dashboard**: Admin, Doctor, Helper
- **Patients**: Admin, Doctor, Helper
- **Appointments**: Admin, Doctor, Helper
- **Cases**: Admin, Doctor
- **Treatments**: Admin, Doctor
- **Billing**: Admin, Helper
- **User Management**: Admin only
- **Settings**: Admin, Doctor, Helper

---

## 🔧 Adding New Users

### As an Admin:

1. Log in with an admin account
2. Navigate to **User Management** (in sidebar)
3. Click **Add User**
4. Enter:
   - Email address (must be a valid Google account)
   - Full name (optional)
   - Role (admin, doctor, helper, or patient)
5. Click **Add User**

The user can now sign in with their Google account!

---

## 🔒 Security Features

✅ **Google OAuth only** - No password management needed
✅ **Role-based access control** - Different permissions per role
✅ **Authorized users only** - Only emails in database can access
✅ **Row Level Security** - Database-level access control
✅ **Session management** - Automatic token refresh
✅ **Admin protection** - Admins can't delete themselves or remove their own admin role

---

## 🚨 Troubleshooting

### "Access Denied" after login
- Check if your email is in the `authorized_users` table
- Verify the `is_active` flag is `TRUE`
- Check the role is assigned correctly

### Can't see User Management page
- Only **admin** role has access to this page
- Verify your role in the database

### OAuth redirect not working
- Check redirect URIs in Google Cloud Console match exactly
- Verify Supabase URL is correct
- Clear browser cache and try again

### Running the SQL script
```sql
-- Check if table exists
SELECT * FROM authorized_users;

-- Check your user role
SELECT * FROM authorized_users WHERE email = 'your@email.com';

-- Manually add a user
INSERT INTO authorized_users (email, role, full_name, is_active)
VALUES ('newemail@gmail.com', 'admin', 'New Admin', TRUE);
```

---

## 📝 Default Users

The system comes with one default admin:

- **Email**: dhruvpanchaljob2506@gmail.com
- **Role**: Admin
- **Access**: Full system access including user management

---

## 🔄 Database Schema

```sql
authorized_users
├── id (UUID)
├── email (VARCHAR, UNIQUE)
├── role (ENUM: admin, doctor, helper, patient)
├── full_name (VARCHAR)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── created_by_email (VARCHAR)
└── last_login_at (TIMESTAMP)
```

---

## 📧 Support

For issues or questions:
- Check Supabase logs: Dashboard > Logs
- Review browser console for errors
- Check network tab for failed requests

---

## ✅ Setup Checklist

- [ ] Run `setup-auth.sql` in Supabase SQL Editor
- [ ] Set up Google OAuth in Google Cloud Console
- [ ] Add Google credentials to Supabase
- [ ] Test login with default admin email
- [ ] Add additional users via User Management page
- [ ] Verify role-based access works correctly

---

**🎉 That's it! Your authentication system is ready!**
