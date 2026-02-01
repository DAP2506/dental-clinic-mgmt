# ✅ OAuth Fix Checklist - Dental Clinic App

## Your App Details
- **URL:** https://dental-clinic-mgmt.vercel.app
- **Email:** dhruvpanchaljob2506@gmail.com
- **Supabase:** cykvmnheavtogzdzzzxw

---

## 📝 Step-by-Step Checklist

### ☐ Step 1: Supabase URL Configuration (MOST IMPORTANT!)

1. ☐ Open: https://supabase.com/dashboard/project/cykvmnheavtogzdzzzxw/auth/url-configuration

2. ☐ Change **Site URL** to:
   ```
   https://dental-clinic-mgmt.vercel.app
   ```
   
3. ☐ Add these to **Redirect URLs**:
   ```
   https://dental-clinic-mgmt.vercel.app/auth/callback
   https://dental-clinic-mgmt.vercel.app/**
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   ```

4. ☐ Click **Save**

5. ☐ Wait 1-2 minutes for changes to apply

---

### ☐ Step 2: Google Cloud Console

1. ☐ Open: https://console.cloud.google.com/apis/credentials

2. ☐ Find and click your **OAuth 2.0 Client ID**

3. ☐ Under **Authorized JavaScript origins**, add:
   ```
   https://dental-clinic-mgmt.vercel.app
   https://cykvmnheavtogzdzzzxw.supabase.co
   ```
   (Keep http://localhost:3000 if it's there)

4. ☐ Under **Authorized redirect URIs**, ensure this exists:
   ```
   https://cykvmnheavtogzdzzzxw.supabase.co/auth/v1/callback
   ```

5. ☐ Click **Save**

6. ☐ Wait 1-2 minutes for changes to apply

---

### ☐ Step 3: Set Yourself as Admin

1. ☐ Open: https://supabase.com/dashboard/project/cykvmnheavtogzdzzzxw/sql/new

2. ☐ Copy and paste this SQL:
   ```sql
   INSERT INTO authorized_users (email, role, full_name, is_active)
   VALUES ('dhruvpanchaljob2506@gmail.com', 'admin', 'Dhruv Panchal', true)
   ON CONFLICT (email) 
   DO UPDATE SET 
       role = 'admin', 
       is_active = true,
       updated_at = NOW();
   ```

3. ☐ Click **Run**

4. ☐ Verify with this SQL:
   ```sql
   SELECT email, role, is_active FROM authorized_users 
   WHERE email = 'dhruvpanchaljob2506@gmail.com';
   ```
   Should show: `admin` and `true`

---

### ☐ Step 4: Clear Cache & Test

1. ☐ Close all browser windows

2. ☐ Open a new **Incognito/Private** window

3. ☐ Go to: https://dental-clinic-mgmt.vercel.app

4. ☐ Click **"Sign in with Google"**

5. ☐ Login with: dhruvpanchaljob2506@gmail.com

6. ☐ After Google login, check the URL:
   - ✅ Should be: `https://dental-clinic-mgmt.vercel.app`
   - ❌ NOT: `http://localhost:3000`

7. ☐ Verify you can see the dashboard

8. ☐ Try navigating to different pages (Patients, Cases, Settings)

---

## 🎯 Success Criteria

After completing all steps, you should be able to:

- ☐ Visit https://dental-clinic-mgmt.vercel.app
- ☐ Click "Sign in with Google"
- ☐ Login successfully
- ☐ Stay on https://dental-clinic-mgmt.vercel.app (not redirected to localhost)
- ☐ See the dashboard
- ☐ Navigate to all pages (Patients, Cases, Billing, Settings, Users)
- ☐ Have admin access (can see all features)

---

## ⚠️ Common Mistakes to Avoid

- ❌ Don't forget to click **Save** after each change
- ❌ Don't forget the `https://` in URLs (not just `dental-clinic-mgmt.vercel.app`)
- ❌ Don't remove localhost URLs (you need both for development)
- ❌ Don't skip the admin user SQL (you won't have access otherwise)
- ❌ Don't test immediately (wait 1-2 minutes for changes to apply)
- ❌ Don't test in the same browser window (use incognito/private mode)

---

## 🔄 If It Still Doesn't Work

### Try These in Order:

1. ☐ **Wait longer** - Changes can take up to 10 minutes
   
2. ☐ **Clear everything**:
   - Press Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
   - Select "All time"
   - Check: Cookies, Cache, Site data
   - Click Clear

3. ☐ **Check Supabase Site URL again**:
   - Go back to Supabase auth settings
   - Verify Site URL is: `https://dental-clinic-mgmt.vercel.app`
   - NOT: `http://localhost:3000`

4. ☐ **Check your admin status**:
   ```sql
   SELECT * FROM authorized_users WHERE email = 'dhruvpanchaljob2506@gmail.com';
   ```
   Must show: `role = 'admin'`, `is_active = true`

5. ☐ **Try a different browser** - Sometimes browser cache is stubborn

6. ☐ **Check browser console** (F12):
   - Look for red error messages
   - Share them if you need help

---

## 📱 Mobile Testing

Once desktop works, test on mobile:

1. ☐ Open phone browser
2. ☐ Go to: https://dental-clinic-mgmt.vercel.app
3. ☐ Login with Google
4. ☐ Should work the same as desktop

---

## 🎉 After Success

Once login works, document your settings:

### Copy and Save These URLs:
```
Production URL: https://dental-clinic-mgmt.vercel.app
Supabase URL: https://cykvmnheavtogzdzzzxw.supabase.co
Admin Email: dhruvpanchaljob2506@gmail.com
```

### Next Steps:
1. ☐ Add other admin users (if needed)
2. ☐ Add doctors via Users page
3. ☐ Configure clinic info in Settings
4. ☐ Start adding patients and cases
5. ☐ Test all features

---

## 📞 Need Help?

If you complete all steps and it still doesn't work:

1. Check Supabase logs: https://supabase.com/dashboard/project/cykvmnheavtogzdzzzxw/logs
2. Check Vercel logs: https://vercel.com/dashboard (find your project)
3. Open browser console (F12) and check for errors
4. Take screenshots of any error messages

---

## 💡 Pro Tips

- **Always test in Incognito** - Avoids cache issues
- **Save your URLs** - Keep them somewhere safe
- **Document changes** - Write down what you changed
- **Backup settings** - Screenshot your Google OAuth settings
- **Test after each step** - Don't wait until the end

---

## ⏱️ Estimated Time

- Step 1 (Supabase): 2 minutes
- Step 2 (Google): 2 minutes  
- Step 3 (Admin SQL): 1 minute
- Step 4 (Testing): 2 minutes
- **Total: ~7 minutes** ⚡

---

**Print this checklist and check off each item as you complete it!**

Good luck! 🚀
