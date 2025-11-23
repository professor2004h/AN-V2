-- ================================
-- CRITICAL FIX: ADD MISSING RLS POLICIES
-- Execute this in Supabase SQL Editor
-- ================================

-- This script adds missing Row Level Security policies for the batches table
-- The backend is currently failing to create batches because RLS is enabled
-- but no policies exist for admins to insert/update/delete batches.

-- Step 1: Add policies for batches table
-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can manage batches" ON batches;
DROP POLICY IF EXISTS "Authenticated users can view batches" ON batches;
DROP POLICY IF EXISTS "Everyone can view batches" ON batches;

-- Allow admins and superadmins to perform ALL operations on batches
CREATE POLICY "Admins can manage batches" ON batches FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin')
    )
);

-- Allow all authenticated users to view batches
-- (Students and trainers need to see batch information)
CREATE POLICY "Authenticated users can view batches" ON batches FOR SELECT
USING (auth.role() = 'authenticated');

-- ================================
-- OPTIONAL: Temporarily disable RLS if above doesn't work
-- Uncomment the line below ONLY if you continue to face issues
-- ================================
-- ALTER TABLE batches DISABLE ROW LEVEL SECURITY;

-- Note: Service role bypasses RLS, so the backend using supabaseAdmin
-- should work without RLS. But if RLS is enabled and policies don't exist,
-- even service role requests through PostgREST API may fail.

-- ================================
-- Verify the policies were created
-- ================================
SELECT 
    schemaname,
    tablename, 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'batches'
ORDER BY policyname;

-- ================================
-- Success message
-- ================================
SELECT '✅ RLS policies for batches table have been added successfully!' as status;
