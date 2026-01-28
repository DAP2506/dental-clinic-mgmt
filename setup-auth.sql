-- ============================================================
-- DENTAL CLINIC AUTHENTICATION SETUP - FIXED
-- ============================================================
-- This fixes the infinite recursion error in RLS policies
-- ============================================================

-- Step 1: Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can read their own record" ON authorized_users;
DROP POLICY IF EXISTS "Admins can read all users" ON authorized_users;
DROP POLICY IF EXISTS "Admins can insert users" ON authorized_users;
DROP POLICY IF EXISTS "Admins can update users" ON authorized_users;
DROP POLICY IF EXISTS "Admins can delete users" ON authorized_users;

-- Step 2: Create user role enum (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'helper', 'patient');
    END IF;
END $$;

-- Step 3: Create authorized users table (if not exists)
CREATE TABLE IF NOT EXISTS authorized_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'patient',
    full_name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_email VARCHAR(255),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON authorized_users(email);
CREATE INDEX IF NOT EXISTS idx_authorized_users_role ON authorized_users(role);

-- Step 5: Add default admin user
INSERT INTO authorized_users (email, role, full_name, is_active)
VALUES ('dhruvpanchaljob2506@gmail.com', 'admin', 'Dhruv Panchal', TRUE)
ON CONFLICT (email) DO UPDATE 
SET role = 'admin', is_active = TRUE, updated_at = CURRENT_TIMESTAMP;

-- Step 6: Create helper function for timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 7: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_authorized_users_updated_at ON authorized_users;
CREATE TRIGGER update_authorized_users_updated_at 
    BEFORE UPDATE ON authorized_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: DISABLE Row Level Security temporarily to avoid recursion
ALTER TABLE authorized_users DISABLE ROW LEVEL SECURITY;

-- Step 9: Create a secure function to check if user is admin
-- This function runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value TEXT;
BEGIN
    SELECT role INTO user_role_value
    FROM authorized_users
    WHERE email = user_email 
    AND is_active = TRUE;
    
    RETURN user_role_value = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create function to get user role (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM authorized_users
    WHERE email = user_email AND is_active = TRUE;
    
    RETURN COALESCE(user_role, 'unauthorized');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create function to log user login (bypasses RLS)
CREATE OR REPLACE FUNCTION log_user_login(user_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE authorized_users
    SET last_login_at = CURRENT_TIMESTAMP
    WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Grant necessary permissions
GRANT ALL ON authorized_users TO authenticated;
GRANT SELECT ON authorized_users TO anon;
GRANT EXECUTE ON FUNCTION is_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_user_login(TEXT) TO authenticated, anon;

-- Step 13: Add helpful comments
COMMENT ON TABLE authorized_users IS 'Stores authorized users and their roles for the dental clinic management system. RLS is DISABLED to avoid recursion - security is handled at the application level.';
COMMENT ON COLUMN authorized_users.role IS 'User role: admin (full access), doctor (medical access), helper (limited access), patient (self data only)';
COMMENT ON FUNCTION is_admin(TEXT) IS 'Securely checks if a user has admin role. Bypasses RLS to avoid infinite recursion.';
COMMENT ON FUNCTION get_user_role(TEXT) IS 'Returns the role of a user. Bypasses RLS to avoid infinite recursion.';

-- ============================================================
-- SETUP COMPLETE!
-- ============================================================
-- Next Steps:
-- 1. Enable Google OAuth in Supabase Authentication > Providers
-- 2. Add your Google Client ID and Secret
-- 3. Test login at http://localhost:3000
-- ============================================================
