# 🚨 Quick Fix: Enable Google Authentication

## Error: "Unsupported provider: provider is not enabled"

This means Google OAuth is not enabled in your Supabase project yet.

## ⚡ Quick Fix Steps:

### 1. Enable Google Provider in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/cykqmnheaytogzdzzzxw
2. Click on **Authentication** (🔐 icon in left sidebar)
3. Click on **Providers**
4. Find **Google** in the list
5. Toggle it to **ENABLED**

### 2. Two Options for Testing:

#### Option A: Quick Test (Use Supabase's Test OAuth - Easiest)
- Just enable Google provider
- Supabase provides test OAuth credentials automatically
- ✅ **Use this for immediate testing!**

#### Option B: Production Setup (Your Own OAuth - For Production)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth credentials (detailed steps in AUTH_SETUP.md)
3. Add Client ID and Secret to Supabase

### 3. For Now - Use Option A (Test Mode)

1. In Supabase Dashboard:
   - Go to Authentication > Providers > Google
2. Enable it (toggle switch)
3. **Skip** the Client ID/Secret for now
4. Supabase will use default test credentials
5. Click **Save**

### 4. Update Redirect URL Settings

In Supabase, make sure your redirect URLs include:
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/**`

Go to: Authentication > URL Configuration
Add to "Redirect URLs":
```
http://localhost:3000/**
```

---

## ✅ After Enabling:

1. Restart your dev server:
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

2. Try logging in again!

---

## 🎯 Expected Flow:

1. Click "Continue with Google"
2. Redirect to Google login page
3. Choose your Google account
4. Redirect back to http://localhost:3000/auth/callback
5. Then redirect to dashboard (/)

---

## 📝 Note:

The test OAuth credentials are fine for development. You only need to set up your own Google OAuth credentials for production deployment.
