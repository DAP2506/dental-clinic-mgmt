# Fix Google OAuth Login Redirect Issue

## Problem
After Google OAuth login, users are being redirected to `http://localhost:3000` instead of your deployed website URL.

## Root Cause
The redirect URL in your Supabase Google OAuth configuration is set to localhost instead of your production domain.

---

## Solution: Update Supabase OAuth Configuration

### Step 1: Get Your Deployed Website URL
Your deployed website URL should be something like:
- `https://your-app.vercel.app`
- `https://your-domain.com`
- Or whatever your hosting provider gave you

### Step 2: Update Supabase Authentication Settings

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project: `cykvmnheavtogzdzzzxw`

2. **Go to Authentication → URL Configuration**
   - Click on "Authentication" in the left sidebar
   - Click on "URL Configuration"

3. **Update Site URL**
   ```
   Site URL: https://your-deployed-website.com
   ```
   ⚠️ Replace with your actual deployed URL (not localhost!)

4. **Update Redirect URLs**
   Add both your deployed URL and localhost (for development):
   ```
   Redirect URLs:
   https://your-deployed-website.com/auth/callback
   http://localhost:3000/auth/callback
   ```
   This allows both production and local development to work.

### Step 3: Update Google Cloud Console

1. **Go to Google Cloud Console**
   - Navigate to https://console.cloud.google.com
   - Select your project

2. **Go to APIs & Services → Credentials**
   - Click on your OAuth 2.0 Client ID

3. **Update Authorized redirect URIs**
   Add your deployed Supabase callback URL:
   ```
   Authorized redirect URIs:
   https://cykvmnheavtogzdzzzxw.supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback (for local dev)
   ```

4. **Update Authorized JavaScript origins**
   Add your deployed website URL:
   ```
   Authorized JavaScript origins:
   https://your-deployed-website.com
   http://localhost:3000 (for local dev)
   ```

5. **Click "Save"**

### Step 4: Update Environment Variables (If Needed)

If you have environment variables for redirect URLs, update them:

**In your hosting platform (Vercel/Netlify/etc.):**
```env
NEXT_PUBLIC_SITE_URL=https://your-deployed-website.com
NEXT_PUBLIC_SUPABASE_URL=https://cykvmnheavtogzdzzzxw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Local `.env.local` (keep as is):**
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://cykvmnheavtogzdzzzxw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Testing the Fix

### Test Production Login
1. Go to your deployed website: `https://your-deployed-website.com`
2. Click "Sign in with Google"
3. Complete Google authentication
4. You should be redirected back to your deployed site (not localhost)
5. Check that you're logged in and can access the dashboard

### Test Local Development
1. Go to `http://localhost:3000`
2. Click "Sign in with Google"
3. Complete Google authentication
4. You should be redirected to localhost
5. Everything should work as before

---

## Common Issues & Solutions

### Issue 1: Still Redirecting to Localhost
**Solution:**
- Clear your browser cache and cookies
- Try in incognito/private browsing mode
- Wait 5-10 minutes for Google OAuth changes to propagate

### Issue 2: "redirect_uri_mismatch" Error
**Solution:**
- The redirect URI in Google Cloud Console doesn't match Supabase
- Make sure you added the exact Supabase callback URL:
  ```
  https://cykvmnheavtogzdzzzxw.supabase.co/auth/v1/callback
  ```

### Issue 3: "Unauthorized" After Login
**Solution:**
- Your email might not be in the `authorized_users` table
- Add your email to authorized_users:
  ```sql
  INSERT INTO authorized_users (email, role, full_name, is_active)
  VALUES ('dhruvpanchaljob2506@gmail.com', 'admin', 'Dhruv Panchal', true);
  ```

### Issue 4: Works Locally But Not in Production
**Solution:**
- Check environment variables in your hosting platform
- Ensure `NEXT_PUBLIC_SITE_URL` is set to your production domain
- Redeploy your application after changing environment variables

---

## Verification Checklist

After making changes, verify:

- [ ] Supabase Site URL is set to production domain
- [ ] Supabase Redirect URLs include both production and localhost
- [ ] Google Cloud redirect URIs include Supabase callback URL
- [ ] Google Cloud JavaScript origins include production domain
- [ ] Environment variables are set correctly in hosting platform
- [ ] Browser cache is cleared
- [ ] Can login successfully on production site
- [ ] Redirected to production site (not localhost)
- [ ] Can access dashboard after login
- [ ] Local development still works

---

## Quick Fix Commands

### Check Current Authorized Users
```sql
SELECT email, role, is_active FROM authorized_users;
```

### Add Yourself as Admin (if needed)
```sql
INSERT INTO authorized_users (email, role, full_name, is_active)
VALUES ('dhruvpanchaljob2506@gmail.com', 'admin', 'Dhruv Panchal', true)
ON CONFLICT (email) DO UPDATE
SET role = 'admin', is_active = true;
```

### Check Active Session
```sql
SELECT * FROM auth.users WHERE email = 'dhruvpanchaljob2506@gmail.com';
```

---

## Example: Complete Configuration

### Supabase Authentication Settings
```
Site URL: https://dental-clinic.vercel.app

Redirect URLs:
https://dental-clinic.vercel.app/auth/callback
http://localhost:3000/auth/callback

Additional Redirect URLs:
https://dental-clinic.vercel.app/**
http://localhost:3000/**
```

### Google Cloud Console OAuth Settings
```
Authorized JavaScript origins:
https://dental-clinic.vercel.app
http://localhost:3000
https://cykvmnheavtogzdzzzxw.supabase.co

Authorized redirect URIs:
https://cykvmnheavtogzdzzzxw.supabase.co/auth/v1/callback
http://localhost:54321/auth/v1/callback
```

### Vercel Environment Variables
```
NEXT_PUBLIC_SITE_URL=https://dental-clinic.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://cykvmnheavtogzdzzzxw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## Still Not Working?

If you've followed all steps and it's still not working:

1. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs
   - Look for authentication errors

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

3. **Verify OAuth Flow**
   - The URL should go: Your Site → Google → Supabase → Your Site
   - If it goes to localhost, Supabase Site URL is wrong

4. **Contact Support**
   - Provide: Your deployed URL, error messages, screenshots
   - Check Supabase Discord for help

---

## Summary

The fix requires updating **3 places**:

1. **Supabase Dashboard**: Site URL and Redirect URLs
2. **Google Cloud Console**: Authorized redirect URIs and JavaScript origins  
3. **Hosting Platform**: Environment variables (if applicable)

After making these changes:
- Clear browser cache
- Wait 5-10 minutes
- Test login on production site
- Should work! 🎉

---

**Your Current User:**
- Email: dhruvpanchaljob2506@gmail.com
- Name: Dhruv Panchal
- User ID: 7ebb985d-baff-468a-a05f-0b950a156b1d

Make sure this email is in your `authorized_users` table with `role='admin'` and `is_active=true`.
