-- Quick diagnostic query to check clinic_settings table
-- Run this in your Supabase SQL Editor

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'clinic_settings'
) as table_exists;

-- If table exists, check the data
SELECT * FROM public.clinic_settings LIMIT 1;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'clinic_settings';
