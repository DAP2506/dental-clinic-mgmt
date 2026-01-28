-- Add soft delete columns to patients and cases tables
-- This allows "deleting" records without actually removing them from the database

-- Add deleted_at column to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;

-- Add deleted_at column to cases table
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON public.patients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_cases_deleted_at ON public.cases(deleted_at);

-- Add comment to explain the columns
COMMENT ON COLUMN public.patients.deleted_at IS 'Timestamp when patient was soft deleted. NULL means not deleted.';
COMMENT ON COLUMN public.patients.deleted_by IS 'Email of admin who deleted the patient.';
COMMENT ON COLUMN public.cases.deleted_at IS 'Timestamp when case was soft deleted. NULL means not deleted.';
COMMENT ON COLUMN public.cases.deleted_by IS 'Email of admin who deleted the case.';
