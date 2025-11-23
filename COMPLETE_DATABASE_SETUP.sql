-- ================================
-- COMPLETE DATABASE SETUP FOR APRANOVA LMS
-- This script does EVERYTHING except create auth users
-- Execute this in Supabase SQL Editor
-- ================================

-- ================================
-- PART 1: DATABASE MIGRATIONS
-- ================================

-- 1. Create task_priority enum type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
    END IF;
END $$;

-- 2. Migrate tasks.priority from INTEGER to ENUM
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'priority' AND data_type = 'integer'
    ) THEN
        -- Add temporary column
        ALTER TABLE tasks ADD COLUMN priority_new task_priority;
        
        -- Migrate data (1-2 = low, 3 = medium, 4-5 = high)
        UPDATE tasks 
        SET priority_new = CASE 
            WHEN priority <= 2 THEN 'low'::task_priority
            WHEN priority = 3 THEN 'medium'::task_priority
            ELSE 'high'::task_priority
        END;
        
        -- Drop old column and rename
        ALTER TABLE tasks DROP COLUMN priority;
        ALTER TABLE tasks RENAME COLUMN priority_new TO priority;
        ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 'medium'::task_priority;
    END IF;
END $$;

-- 3. Fix trainers.specialization from ARRAY to TEXT
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trainers' AND column_name = 'specialization' AND data_type = 'ARRAY'
    ) THEN
        -- Add new column
        ALTER TABLE trainers ADD COLUMN specialization_new TEXT;
        
        -- Migrate data (take first element if array exists)
        UPDATE trainers 
        SET specialization_new = CASE 
            WHEN specialization IS NOT NULL AND array_length(specialization, 1) > 0 
            THEN specialization[1]::TEXT
            ELSE NULL
        END;
        
        -- Drop old column and rename
        ALTER TABLE trainers DROP COLUMN specialization;
        ALTER TABLE trainers RENAME COLUMN specialization_new TO specialization;
    END IF;
END $$;

-- 4. Fix students.trainer_id to reference trainers table
DO $$ 
BEGIN
    -- Check if foreign key needs to be updated
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_trainer_id_fkey' 
        AND table_name = 'students'
    ) THEN
        -- Drop existing constraint if it references wrong table
        ALTER TABLE students DROP CONSTRAINT IF EXISTS students_trainer_id_fkey;
    END IF;
    
    -- Add new column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'trainer_id_new'
    ) THEN
        ALTER TABLE students ADD COLUMN trainer_id_new UUID;
        
        -- Migrate data
        UPDATE students s
        SET trainer_id_new = t.id
        FROM trainers t
        WHERE s.trainer_id = t.user_id;
        
        -- Drop old column and rename
        ALTER TABLE students DROP COLUMN IF EXISTS trainer_id;
        ALTER TABLE students RENAME COLUMN trainer_id_new TO trainer_id;
    END IF;
    
    -- Add proper foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_trainer_id_fkey' 
        AND table_name = 'students'
    ) THEN
        ALTER TABLE students 
        ADD CONSTRAINT students_trainer_id_fkey 
        FOREIGN KEY (trainer_id) REFERENCES trainers(id);
    END IF;
END $$;

-- 5. Add projects.order_index column
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

-- 6. Add stripe_payment_intent_id column to payments table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'stripe_payment_intent_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN stripe_payment_intent_id TEXT UNIQUE;
    END IF;
END $$;

-- 7. Create performance indexes
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

-- ================================
-- MIGRATION COMPLETED
-- ================================
SELECT '✅ Database migration completed successfully!' as status;

