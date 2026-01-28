# Quick Start: Configurable Clinic Settings

## 🚀 Setup in 3 Steps

### Step 1: Setup Database (2 minutes)

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `setup-clinic-settings.sql`
5. Click **Run**
6. Wait for confirmation: "Success. No rows returned"

### Step 2: Update Clinic Information (3 minutes)

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Log in as an **admin user**
   - Use: `dhruvpanchaljob2506@gmail.com`

3. Navigate to **Settings** from the sidebar

4. Fill in your clinic information:
   - **Clinic Name**: Your clinic's name
   - **Email**: Your contact email
   - **Phone**: Your phone number
   - **Address**: Complete address
   - **Business Hours**: Operating hours

5. Click **"Save Changes"**

6. Look for green success message

### Step 3: Test PDF Generation (1 minute)

1. Go to **Billing & Invoices**

2. Click **"View"** on any invoice

3. Click **"Download PDF"**

4. Open the downloaded PDF

5. Verify your clinic information appears correctly

## ✅ That's It!

Your clinic settings are now:
- ✅ Stored in the database
- ✅ Editable from Settings page
- ✅ Automatically appearing on all PDFs
- ✅ No more hardcoded values

## 📋 What You Get

### Settings Page Features:
- Professional UI with sidebar navigation
- Organized sections for different information
- Admin-only editing (others can view)
- Success notifications on save
- Real-time updates

### PDF Features:
- Your clinic name in bold header
- Complete address (no overlap!)
- Contact information (phone, email)
- Dynamic spacing that adapts to content
- Professional layout

## 🔐 Access Control

| Role | Can View Settings | Can Edit Settings |
|------|------------------|-------------------|
| Admin | ✅ Yes | ✅ Yes |
| Doctor | ✅ Yes | ❌ No |
| Helper | ✅ Yes | ❌ No |
| Patient | ❌ No | ❌ No |

## 🆘 Troubleshooting

### Can't Save Settings?
- Make sure you're logged in as admin
- Check browser console for errors
- Verify SQL script ran successfully

### PDF Shows "Dental Clinic"?
- Update settings and click Save
- Refresh the invoice page
- Try downloading PDF again

### Settings Page Has No Sidebar?
- Clear browser cache
- Restart dev server
- Check that you're using the new `settings/page.tsx`

## 📖 More Information

- **Full Settings Guide**: See `SETTINGS_GUIDE.md`
- **Implementation Details**: See `SETTINGS_IMPLEMENTATION.md`
- **Billing Guide**: See `BILLING_GUIDE.md`

---

**Need Help?** Check the documentation files or review the console logs for specific errors.

*Last Updated: January 28, 2026*
