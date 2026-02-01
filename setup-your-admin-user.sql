-- Quick fix for OAuth login user
-- Run this in Supabase SQL Editor to ensure your user has proper access

-- Check if your email exists in authorized_users
SELECT 
    'Current user status' as check_name,
    email,
    role,
    full_name,
    is_active,
    created_at
FROM authorized_users
WHERE email = 'dhruvpanchaljob2506@gmail.com';

-- Add or update your user as admin (run this if the query above returns no results or wrong role)
INSERT INTO authorized_users (
    email,
    role,
    full_name,
    is_active,
    created_by_email
)
VALUES (
    'dhruvpanchaljob2506@gmail.com',
    'admin',
    'Dhruv Panchal',
    true,
    'system'
)
ON CONFLICT (email) 
DO UPDATE SET
    role = 'admin',
    full_name = 'Dhruv Panchal',
    is_active = true,
    updated_at = NOW();

-- Verify the update
SELECT 
    '✅ User setup complete' as status,
    email,
    role,
    full_name,
    is_active
FROM authorized_users
WHERE email = 'dhruvpanchaljob2506@gmail.com';

-- Check auth.users table (Supabase auth)
SELECT 
    'Auth user details' as check_name,
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users
WHERE email = 'dhruvpanchaljob2506@gmail.com';
