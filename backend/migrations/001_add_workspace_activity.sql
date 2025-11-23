-- Migration: Add workspace_last_activity to students table

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS workspace_last_activity TIMESTAMP WITH TIME ZONE;

-- Optional: Index for performance
CREATE INDEX IF NOT EXISTS idx_students_workspace_status_activity 
ON students(workspace_status, workspace_last_activity);
