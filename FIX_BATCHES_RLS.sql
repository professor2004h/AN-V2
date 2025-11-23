-- Fix Missing RLS Policies for Batches Table
-- This script adds the missing Row Level Security policies for the batches table

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can manage batches" ON batches;
DROP POLICY IF EXISTS "Everyone can view batches" ON batches;

-- Allow admins to view and manage all batches
CREATE POLICY "Admins can manage batches" ON batches FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Allow authenticated users to view batches (students/trainers need to see batch info)
CREATE POLICY "Authenticated users can view batches" ON batches FOR SELECT USING (
    auth.role() = 'authenticated'
);

-- Verify policies are created
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'batches';
