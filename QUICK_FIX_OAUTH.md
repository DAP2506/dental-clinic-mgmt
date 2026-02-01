# 🚀 Quick Fix - OAuth Redirect to Localhost Issue

## Problem
After Google login, redirected to `http://localhost:3000` instead of your deployed website.

---

## ⚡ Quick Solution (3 Steps)

### Step 1: Update Supabase (2 minutes)
1. Go to: https://supabase.com/dashboard/project/cykvmnheavtogzdzzzxw/auth/url-configuration
2. Update **Site URL** to your deployed URL (e.g., `https://your-app.vercel.app`)
3. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
4. Click **Save**

### Step 2: Update Google Cloud (2 minutes)
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs**:
   ```
   https://cykvmnheavtogzdzzzxw.supabase.co/auth/v1/callback
   ```
4. Add to **Authorized JavaScript origins**:
   ```
   https://your-app.vercel.app
   ```
5. Click **Save**

### Step 3: Ensure You're an Admin User (1 minute)
1. Go to Supabase SQL Editor
2. Run this:
   ```sql
   INSERT INTO authorized_users (email, role, full_name, is_active)
   VALUES ('dhruvpanchaljob2506@gmail.com', 'admin', 'Dhruv Panchal', true)
   ON CONFLICT (email) DO UPDATE SET role = 'admin', is_active = true;
   ```

---

## ✅ Test It

1. Clear browser cache (Ctrl+Shift+Delete)
2. Go to your deployed site
3. Click "Sign in with Google"
4. Should redirect to your deployed site ✨

---

## 🔗 Important URLs

**Your Supabase Project:**
- Project: cykvmnheavtogzdzzzxw
- URL: https://cykvmnheavtogzdzzzxw.supabase.co

**Your User:**
- Email: dhruvpanchaljob2506@gmail.com
- User ID: 7ebb985d-baff-468a-a05f-0b950a156b1d

**Callback URL (must match exactly):**
- https://cykvmnheavtogzdzzzxw.supabase.co/auth/v1/callback

---

## 🐛 Still Not Working?

**Clear Everything:**
```bash
# In your browser
1. Open DevTools (F12)
2. Right-click refresh button
3. Click "Empty Cache and Hard Reload"
4. Or use Incognito mode
```

**Check Your Email is Admin:**
```sql
SELECT email, role, is_active 
FROM authorized_users 
WHERE email = 'dhruvpanchaljob2506@gmail.com';
```
Should return: `admin` and `true`

**Wait 5-10 Minutes:**
- Google OAuth changes can take a few minutes to propagate
- Try again after a short wait

---

## 📝 What We Fixed

| Before | After |
|--------|-------|
| Supabase Site URL: `http://localhost:3000` | Your deployed URL |
| Google redirect: Only localhost | Both localhost & deployed URL |
| User role: Not set | Admin with full access |

---

## 💡 Pro Tip

Keep both localhost and production URLs in your Supabase Redirect URLs. This way:
- ✅ Production login works
- ✅ Local development still works
- ✅ No need to change config when switching environments

---

For detailed instructions, see: `FIX_OAUTH_REDIRECT.md`
