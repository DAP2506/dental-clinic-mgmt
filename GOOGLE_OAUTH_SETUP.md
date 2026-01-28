# 🚀 Quick Fix: Enable Google Sign-In

## Problem
Getting error: "At least one Client ID is required when Google sign-in is enabled."

## Solution
You need to create Google OAuth credentials first, then add them to Supabase.

---

## 📋 Step-by-Step Guide

### 1️⃣ Create Google OAuth Credentials

1. **Go to Google Cloud Console**:
   👉 https://console.cloud.google.com/

2. **Create or Select a Project**:
   - Click the project dropdown at the top
   - Click "NEW PROJECT" or select existing
   - Name it: "DentalCare Clinic"
   - Click "CREATE"

3. **Configure OAuth Consent Screen**:
   - Go to: **APIs & Services** > **OAuth consent screen**
   - Choose User Type:
     - **Internal** = Only for your Google Workspace organization
     - **External** = Anyone with Google account (recommended for testing)
   - Click "CREATE"
   - Fill in:
     - App name: `DentalCare Clinic Management`
     - User support email: Your email
     - Developer contact: Your email
   - Click "SAVE AND CONTINUE"
   - Skip Scopes (click "SAVE AND CONTINUE")
   - Skip Test Users (click "SAVE AND CONTINUE")
   - Click "BACK TO DASHBOARD"

4. **Create OAuth 2.0 Client ID**:
   - Go to: **APIs & Services** > **Credentials**
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**
   - Application type: **Web application**
   - Name: `DentalCare Web App`
   
   **IMPORTANT - Add these EXACT URLs:**
   
   **Authorized JavaScript origins:**
   ```
   https://cykqmnheaytogzdzzzxw.supabase.co
   http://localhost:3000
   ```
   
   **Authorized redirect URIs:**
   ```
   https://cykqmnheaytogzdzzzxw.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
   
   - Click "CREATE"
   - **COPY** the Client ID and Client Secret (you'll need these!)

---

### 2️⃣ Add Credentials to Supabase

1. **Go to Supabase Dashboard**:
   👉 https://supabase.com/dashboard/project/cykqmnheaytogzdzzzxw

2. **Navigate to Authentication**:
   - Click **Authentication** in left sidebar
   - Click **Providers**
   - Find **Google**

3. **Enable and Configure**:
   - Toggle **Enable Sign in with Google** to ON
   - Paste your **Client ID** (from Google Cloud Console)
   - Paste your **Client Secret** (from Google Cloud Console)
   - Click **Save**

---

### 3️⃣ Verify Setup

1. **Check the redirect URL in Supabase**:
   - In the Google provider settings, you should see:
   - Callback URL (provided): `https://cykqmnheaytogzdzzzxw.supabase.co/auth/v1/callback`

2. **Make sure this EXACTLY matches** what you added in Google Cloud Console

---

## ✅ Quick Checklist

- [ ] Created Google Cloud project
- [ ] Configured OAuth consent screen
- [ ] Created OAuth 2.0 Client ID
- [ ] Added BOTH JavaScript origins
- [ ] Added BOTH redirect URIs
- [ ] Copied Client ID
- [ ] Copied Client Secret
- [ ] Pasted both in Supabase Google provider
- [ ] Clicked Save in Supabase

---

## 🔍 Troubleshooting

### Error: "redirect_uri_mismatch"
- Go back to Google Cloud Console
- Check the redirect URIs match EXACTLY (including https://)
- Common mistakes:
  - Missing `/auth/v1/callback` at the end
  - Using http:// instead of https:// for Supabase URL
  - Trailing slashes

### Can't find OAuth consent screen
- Make sure you selected the correct project in Google Cloud Console
- Try refreshing the page

### Still getting "Client ID required" error
- Make sure you clicked "Save" in Supabase after adding credentials
- Try refreshing the Supabase page
- Check there are no extra spaces in Client ID or Secret

---

## 📸 Visual Guide

### Google Cloud Console URLs to Add:

**JavaScript Origins:**
```
https://cykqmnheaytogzdzzzxw.supabase.co
http://localhost:3000
```

**Redirect URIs:**
```
https://cykqmnheaytogzdzzzxw.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
```

### Supabase Settings:

```
Authentication > Providers > Google
├── Enable Sign in with Google: ✅ ON
├── Client ID: [paste from Google]
├── Client Secret: [paste from Google]
└── Click: Save
```

---

## 🎯 Next Steps After Setup

1. Your Google provider is now enabled ✅
2. Run the SQL script (`setup-auth.sql`) if you haven't already
3. Start your dev server: `npm run dev`
4. Visit http://localhost:3000
5. You'll be redirected to `/login`
6. Click "Continue with Google"
7. Sign in with `dhruvpanchaljob2506@gmail.com`
8. You should be logged in! 🎉

---

## 📞 Need Help?

If you're still stuck:
1. Check Google Cloud Console credentials page
2. Verify redirect URIs match exactly
3. Check Supabase logs (Dashboard > Logs > Auth)
4. Clear browser cache and try again
