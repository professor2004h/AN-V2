-- Workspace Cleanup Script
-- Run this in Supabase SQL Editor to clean up existing workspace

-- Option 1: Clean up workspace for a specific student by email
UPDATE students 
SET workspace_status = NULL, 
    workspace_url = NULL, 
    workspace_task_arn = NULL,
    workspace_last_activity = NULL
WHERE user_id IN (
    SELECT id FROM profiles WHERE email = 'testuser3@example.com'
);

-- Option 2: Clean up ALL student workspaces (use with caution!)
-- UPDATE students 
-- SET workspace_status = NULL, 
--     workspace_url = NULL, 
--     workspace_task_arn = NULL,
--     workspace_last_activity = NULL;

-- Verify the cleanup
SELECT 
    p.email,
    s.workspace_status,
    s.workspace_url,
    s.workspace_task_arn
FROM students s
JOIN profiles p ON s.user_id = p.id
WHERE p.email = 'testuser3@example.com';
