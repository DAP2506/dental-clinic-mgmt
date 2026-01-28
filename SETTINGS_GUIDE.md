# Clinic Settings Setup Guide

This guide explains how to set up and use the configurable clinic settings feature.

## Overview

The clinic settings feature allows administrators to configure clinic information that appears on:
- PDF invoices
- Receipts
- Reports
- Other documents

## Database Setup

### Step 1: Run the SQL Setup Script

Execute the SQL script to create the clinic_settings table:

```bash
# In your Supabase SQL Editor, run:
setup-clinic-settings.sql
```

Or manually execute the SQL commands from the file in your Supabase dashboard.

### What the Script Does

1. **Creates `clinic_settings` table** with fields:
   - `clinic_name` - Name of your clinic
   - `clinic_email` - Contact email
   - `clinic_phone` - Contact phone number
   - `clinic_address` - Street address
   - `clinic_city` - City
   - `clinic_state` - State/Province
   - `clinic_postal_code` - ZIP/Postal code
   - `clinic_country` - Country (default: India)
   - `business_hours` - Operating hours
   - `timezone` - Timezone (default: Asia/Kolkata)
   - `currency` - Currency code (default: INR)
   - `currency_symbol` - Currency symbol (default: ₹)
   - `tax_rate` - Tax rate percentage

2. **Inserts default settings** - Creates initial configuration

3. **Sets up Row Level Security (RLS)**:
   - Everyone (authenticated users) can VIEW settings
   - Only ADMINS can UPDATE settings

4. **Creates triggers** for automatic `updated_at` timestamp

## Using the Settings Page

### Accessing Settings

1. Navigate to **Settings** from the sidebar (admin/doctor/helper access)
2. The page displays all clinic configuration options

### Updating Settings (Admins Only)

Only users with the `admin` role can modify settings:

1. **Basic Information Section**:
   - Clinic Name (required)
   - Email
   - Phone Number
   - Business Hours

2. **Address Information Section**:
   - Street Address
   - City
   - State/Province
   - Postal Code
   - Country

3. **Regional Settings Section**:
   - Timezone
   - Currency and Symbol

4. Click **"Save Changes"** to update

### Non-Admin Users

Users who are not admins will see:
- All settings fields (read-only/disabled)
- Warning message: "Only administrators can modify these settings"
- No save button

## How It Works with PDFs

### PDF Invoice Generation

When generating a PDF invoice:

1. **System fetches current clinic settings** from database
2. **Populates PDF header** with:
   - Clinic name (large, bold)
   - Address
   - City, State, Postal Code
   - Phone number
   - Email address

3. **Dynamic spacing** prevents content overlap:
   - PDF layout adjusts based on address length
   - Line separator position is calculated dynamically
   - All sections maintain proper spacing

### Default Fallback

If no settings exist or database is unreachable:
- System uses default values:
  ```
  Clinic Name: Dental Clinic
  Email: info@dentalclinic.com
  Phone: (555) 123-4567
  Address: 123 Medical Street
  City, State 12345
  Country: India
  ```

## Features

### ✅ Professional UI
- Clean, modern interface with DashboardLayout
- Organized sections with clear labels
- Color-coded status messages
- Responsive design for mobile/tablet

### ✅ Role-Based Access Control
- Admins: Full read/write access
- Doctors/Helpers: Read-only access
- Patients: No access (future feature)

### ✅ Data Validation
- Required fields enforced
- Email format validation
- Phone number format support
- Proper error handling

### ✅ Real-Time Updates
- Changes reflect immediately in PDFs
- Success notifications on save
- Auto-refresh after updates

### ✅ Security
- RLS policies enforce access control
- Only authenticated users can view
- Only admins can modify
- Audit trail with timestamps

## Customization Examples

### Example 1: Update Clinic Name

```typescript
// Settings page automatically handles this
// Just type in the "Clinic Name" field and click Save
```

The new name will appear on all future PDF invoices.

### Example 2: Multi-Line Address

If your address is long, the PDF will:
1. Display street address on first line
2. Display city, state, postal code on second line
3. Adjust all subsequent sections automatically
4. Prevent any text overlap

### Example 3: Different Currency

Change currency to USD:
1. Select "USD (US Dollar)" from Currency dropdown
2. Enter "$" in the Symbol field
3. Click Save

All new invoices will show prices in USD with $ symbol.

## Troubleshooting

### Settings Not Saving

**Problem**: Click save but nothing happens

**Solutions**:
1. Check if you're logged in as an admin
2. Check browser console for errors
3. Verify Supabase connection
4. Check RLS policies in Supabase dashboard

### Settings Table Doesn't Exist

**Problem**: Error message about missing table

**Solutions**:
1. Run the `setup-clinic-settings.sql` script
2. Check Supabase SQL editor for errors
3. Verify table was created in Supabase dashboard

### PDF Shows Default Values

**Problem**: PDF doesn't show updated clinic info

**Solutions**:
1. Verify settings were saved (check for success message)
2. Refresh the settings page to confirm data
3. Check Supabase table directly for saved values
4. Clear browser cache and try again

### Non-Admin Users Can't View Settings

**Problem**: Settings page is blank or shows error

**Solutions**:
1. Check user role in `authorized_users` table
2. Verify RLS policy allows SELECT for authenticated users
3. Check browser console for specific errors

## Database Schema

```sql
CREATE TABLE clinic_settings (
  id UUID PRIMARY KEY,
  clinic_name TEXT NOT NULL,
  clinic_email TEXT,
  clinic_phone TEXT,
  clinic_address TEXT,
  clinic_city TEXT,
  clinic_state TEXT,
  clinic_postal_code TEXT,
  clinic_country TEXT DEFAULT 'India',
  business_hours TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  currency TEXT DEFAULT 'INR',
  currency_symbol TEXT DEFAULT '₹',
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

## API Reference

### Fetching Settings

```typescript
const { data, error } = await supabase
  .from('clinic_settings')
  .select('*')
  .single();
```

### Updating Settings (Admin Only)

```typescript
const { error } = await supabase
  .from('clinic_settings')
  .update({
    clinic_name: 'New Clinic Name',
    clinic_email: 'newemail@clinic.com',
    // ... other fields
  })
  .eq('id', settingsId);
```

## Best Practices

### 1. Keep Information Updated
- Review settings monthly
- Update contact info immediately if changed
- Verify address accuracy for correspondence

### 2. Professional Information
- Use full, formal clinic name
- Include all contact methods
- Ensure address is complete and accurate

### 3. Currency Settings
- Set currency based on your primary market
- Use standard currency codes (INR, USD, EUR, GBP)
- Keep currency symbol consistent

### 4. Testing
- Generate a test PDF after updating settings
- Verify all information displays correctly
- Check for text overlap or formatting issues

## Security Considerations

### RLS Policies

**Read Access**: All authenticated users can view settings
```sql
-- Allows viewing clinic info for invoices, reports, etc.
POLICY "Anyone can view clinic settings"
  FOR SELECT TO authenticated
  USING (true);
```

**Write Access**: Only admins can modify
```sql
-- Prevents unauthorized changes
POLICY "Only admins can update clinic settings"
  FOR UPDATE TO authenticated
  USING (admin check)
  WITH CHECK (admin check);
```

### Audit Trail

Every update is tracked:
- `created_at`: When settings were first created
- `updated_at`: Last modification timestamp
- Automatic timestamp updates via trigger

## Future Enhancements

Planned features:
- Logo upload for PDF header
- Multiple clinic locations
- Department-specific settings
- Custom invoice templates
- Email signature configuration
- Social media links
- Accreditation information

---

## Quick Start Checklist

- [ ] Run `setup-clinic-settings.sql` in Supabase
- [ ] Verify table creation in Supabase dashboard
- [ ] Log in as admin user
- [ ] Navigate to Settings page
- [ ] Update clinic name
- [ ] Update address information
- [ ] Update contact information
- [ ] Click "Save Changes"
- [ ] Generate a test invoice PDF
- [ ] Verify clinic info appears correctly on PDF
- [ ] Test with non-admin user (should be read-only)

---

*Last Updated: January 28, 2026*
