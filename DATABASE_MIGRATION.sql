-- ================================
-- DATABASE MIGRATION FOR APRANOVA LMS
-- Execute this in Supabase SQL Editor
-- ================================

-- 1. Create task_priority enum type
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

-- 2. Add temporary column for priority
ALTER TABLE tasks ADD COLUMN priority_new task_priority;

-- 3. Migrate existing data (map integer to enum)
-- 1-2 = low, 3 = medium, 4-5 = high
UPDATE tasks 
SET priority_new = CASE 
    WHEN priority <= 2 THEN 'low'::task_priority
    WHEN priority = 3 THEN 'medium'::task_priority
    ELSE 'high'::task_priority
END;

-- 4. Drop old priority column
ALTER TABLE tasks DROP COLUMN priority;

-- 5. Rename new column to priority
ALTER TABLE tasks RENAME COLUMN priority_new TO priority;

-- 6. Set default value
ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 'medium'::task_priority;

-- 7. Fix trainers table - change specialization from array to single value
-- First add new column
ALTER TABLE trainers ADD COLUMN specialization_new TEXT;

-- 8. Migrate existing data (take first element if array exists)
UPDATE trainers 
SET specialization_new = CASE 
    WHEN specialization IS NOT NULL AND array_length(specialization, 1) > 0 
    THEN specialization[1]::TEXT
    ELSE NULL
END;

-- 9. Drop old specialization column
ALTER TABLE trainers DROP COLUMN specialization;

-- 10. Rename new column
ALTER TABLE trainers RENAME COLUMN specialization_new TO specialization;

-- 11. Fix students table - trainer_id should reference trainers table, not profiles
-- First, let's add a new column
ALTER TABLE students ADD COLUMN trainer_id_new UUID;

-- 12. Migrate data - find trainer.id from profiles.id
UPDATE students s
SET trainer_id_new = t.id
FROM trainers t
WHERE s.trainer_id = t.user_id;

-- 13. Drop old trainer_id column
ALTER TABLE students DROP COLUMN trainer_id;

-- 14. Rename new column
ALTER TABLE students RENAME COLUMN trainer_id_new TO trainer_id;

-- 15. Add foreign key constraint
ALTER TABLE students 
ADD CONSTRAINT students_trainer_id_fkey 
FOREIGN KEY (trainer_id) REFERENCES trainers(id);

-- 16. Add index on projects.order_index if it doesn't exist
-- (Used in adminService.initializeStudentProjects)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'order_index'
    ) THEN
        ALTER TABLE projects ADD COLUMN order_index INTEGER;
        
        -- Set order_index based on project_number
        UPDATE projects SET order_index = project_number;
        
        -- Make it NOT NULL
        ALTER TABLE projects ALTER COLUMN order_index SET NOT NULL;
        
        -- Add unique constraint per track
        CREATE UNIQUE INDEX projects_track_order_index_key 
        ON projects(track, order_index);
    END IF;
END $$;

-- 17. Add stripe_payment_intent_id column to payments table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'stripe_payment_intent_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN stripe_payment_intent_id TEXT UNIQUE;
    END IF;
END $$;

-- 18. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_student_id ON tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_tasks_trainer_id ON tasks(trainer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_student_projects_student_id ON student_projects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_projects_status ON student_projects(status);
CREATE INDEX IF NOT EXISTS idx_students_trainer_id ON students(trainer_id);

-- 19. Verify the changes
SELECT 'Migration completed successfully!' as status;

-- 20. Show updated schema info
SELECT
    'tasks.priority type: ' || data_type as info
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'priority'
UNION ALL
SELECT
    'trainers.specialization type: ' || data_type
FROM information_schema.columns
WHERE table_name = 'trainers' AND column_name = 'specialization'
UNION ALL
SELECT
    'students.trainer_id references: trainers table' as info;

