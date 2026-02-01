-- ============================================================
-- DENTAL CLINIC AUTHENTICATION SETUP
-- ============================================================
-- This script is SAFE to run on existing databases!
-- It only creates NEW authentication tables and does NOT
-- modify any existing patient, doctor, appointment, or case data.
-- ============================================================

-- Step 1: Create user role enum (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'helper', 'patient');
    END IF;
END $$;

-- Step 2: Create authorized users table (if not exists)
-- This is a SEPARATE table - does not affect your existing data!
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

-- Step 3: Create indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON authorized_users(email);
CREATE INDEX IF NOT EXISTS idx_authorized_users_role ON authorized_users(role);

-- Step 4: Add default admin user (safe - uses ON CONFLICT)
-- If user already exists, it just updates the role to admin
INSERT INTO authorized_users (email, role, full_name, is_active)
VALUES ('dhruvpanchaljob2506@gmail.com', 'admin', 'Dhruv Panchal', TRUE)
ON CONFLICT (email) DO UPDATE 
SET role = 'admin', is_active = TRUE, updated_at = CURRENT_TIMESTAMP;

-- Step 5: Create helper function for timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Create trigger for updated_at (safe - drops if exists first)
DROP TRIGGER IF EXISTS update_authorized_users_updated_at ON authorized_users;
CREATE TRIGGER update_authorized_users_updated_at 
    BEFORE UPDATE ON authorized_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Enable Row Level Security
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read their own record" ON authorized_users;
DROP POLICY IF EXISTS "Admins can read all users" ON authorized_users;
DROP POLICY IF EXISTS "Admins can insert users" ON authorized_users;
DROP POLICY IF EXISTS "Admins can update users" ON authorized_users;
DROP POLICY IF EXISTS "Admins can delete users" ON authorized_users;

-- Step 9: Create RLS Policies

-- Allow users to read their own record (for role checking)
CREATE POLICY "Users can read their own record" 
ON authorized_users FOR SELECT 
USING (email = (auth.jwt() ->> 'email')::text);

-- Allow admins to read all user records
CREATE POLICY "Admins can read all users" 
ON authorized_users FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM authorized_users 
        WHERE email = (auth.jwt() ->> 'email')::text
        AND role = 'admin' 
        AND is_active = TRUE
    )
);

-- Allow admins to insert new users
CREATE POLICY "Admins can insert users" 
ON authorized_users FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM authorized_users 
        WHERE email = (auth.jwt() ->> 'email')::text
        AND role = 'admin' 
        AND is_active = TRUE
    )
);

-- Allow admins to update users (except their own role to prevent lockout)
CREATE POLICY "Admins can update users" 
ON authorized_users FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM authorized_users 
        WHERE email = (auth.jwt() ->> 'email')::text
        AND role = 'admin' 
        AND is_active = TRUE
    )
)
WITH CHECK (
    -- Prevent admins from demoting themselves
    CASE 
        WHEN email = (auth.jwt() ->> 'email')::text THEN role = 'admin'
        ELSE TRUE
    END
);

-- Allow admins to delete users (except themselves)
CREATE POLICY "Admins can delete users" 
ON authorized_users FOR DELETE 
USING (
    email != (auth.jwt() ->> 'email')::text
    AND EXISTS (
        SELECT 1 FROM authorized_users 
        WHERE email = (auth.jwt() ->> 'email')::text
        AND role = 'admin' 
        AND is_active = TRUE
    )
);

-- Step 10: Grant permissions
GRANT ALL ON authorized_users TO authenticated;
GRANT SELECT ON authorized_users TO anon;

-- Step 11: Create helper functions

-- Function to check user role
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

-- Function to log user login
CREATE OR REPLACE FUNCTION log_user_login(user_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE authorized_users
    SET last_login_at = CURRENT_TIMESTAMP
    WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VERIFICATION QUERIES (optional - run these to check)
-- ============================================================

-- Check if table was created
-- SELECT * FROM authorized_users;

-- Check if admin user was added
-- SELECT * FROM authorized_users WHERE role = 'admin';

-- Count total authorized users
-- SELECT COUNT(*) as total_users FROM authorized_users;

-- ============================================================
-- SUCCESS! 🎉
-- ============================================================
-- Authentication system is ready!
-- Your existing data (patients, doctors, appointments, etc.) 
-- remains completely untouched and safe.
-- ============================================================

COMMENT ON TABLE authorized_users IS 'Stores authorized users and their roles for the dental clinic management system. This is separate from clinical data.';
COMMENT ON COLUMN authorized_users.role IS 'User role: admin (full access), doctor (medical access), helper (limited access), patient (self data only)';
