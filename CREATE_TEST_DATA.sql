-- ================================
-- CREATE COMPREHENSIVE TEST DATA
-- Execute this in Supabase SQL Editor AFTER setting up default users
-- ================================

-- ================================
-- 1. CREATE TEST BATCHES
-- ================================

INSERT INTO batches (name, track, start_date, end_date, max_students, is_active)
VALUES 
  ('Batch 2024-Q1 Data Professional', 'data_professional', '2024-01-15', '2024-04-15', 30, true),
  ('Batch 2024-Q2 Full Stack', 'full_stack_dev', '2024-04-15', '2024-07-15', 25, true)
ON CONFLICT DO NOTHING;

-- ================================
-- 2. CREATE TEST STUDENTS
-- ================================

-- First, we need to create auth users and profiles for students
-- Note: This requires the auth users to be created first via the setup endpoint or Supabase UI

-- For now, let's create a SQL function to help with this
-- You'll need to create the auth users manually or via the API

-- Get the trainer ID
DO $$
DECLARE
  trainer_id_var UUID;
  batch1_id UUID;
  batch2_id UUID;
  alice_user_id UUID;
  bob_user_id UUID;
BEGIN
  -- Get trainer ID
  SELECT id INTO trainer_id_var FROM trainers WHERE user_id = (
    SELECT id FROM profiles WHERE email = 'trainer@apranova.com'
  );

  -- Get batch IDs
  SELECT id INTO batch1_id FROM batches WHERE name = 'Batch 2024-Q1 Data Professional';
  SELECT id INTO batch2_id FROM batches WHERE name = 'Batch 2024-Q2 Full Stack';

  -- Check if students already exist
  SELECT id INTO alice_user_id FROM auth.users WHERE email = 'alice@apranova.com';
  SELECT id INTO bob_user_id FROM auth.users WHERE email = 'bob@apranova.com';

  -- If students don't exist, we can't create them via SQL
  -- They must be created via the API or Supabase Dashboard
  
  IF alice_user_id IS NOT NULL THEN
    -- Create student record for Alice
    INSERT INTO students (user_id, track, batch_id, trainer_id, enrollment_date, status)
    VALUES (alice_user_id, 'data_professional', batch1_id, trainer_id_var, NOW(), 'active')
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Alice student record created';
  ELSE
    RAISE NOTICE 'Alice auth user not found - create via API first';
  END IF;

  IF bob_user_id IS NOT NULL THEN
    -- Create student record for Bob
    INSERT INTO students (user_id, track, batch_id, trainer_id, enrollment_date, status)
    VALUES (bob_user_id, 'full_stack_dev', batch2_id, trainer_id_var, NOW(), 'active')
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Bob student record created';
  ELSE
    RAISE NOTICE 'Bob auth user not found - create via API first';
  END IF;

END $$;

-- ================================
-- 3. INITIALIZE STUDENT PROJECTS
-- ================================

-- This will be done automatically by the backend when students are created via API

-- ================================
-- 4. CREATE TEST TASKS
-- ================================

-- Tasks will be created via the API after students are set up

-- ================================
-- VERIFICATION
-- ================================

SELECT '✅ Test data setup complete!' as status;

-- Show created batches
SELECT 'BATCHES:' as info;
SELECT id, name, track, start_date, end_date, max_students 
FROM batches 
ORDER BY start_date;

-- Show students (if any)
SELECT 'STUDENTS:' as info;
SELECT p.email, p.full_name, s.track, b.name as batch_name
FROM students s
JOIN profiles p ON s.user_id = p.id
LEFT JOIN batches b ON s.batch_id = b.id
WHERE p.email IN ('alice@apranova.com', 'bob@apranova.com');

-- Instructions
SELECT '
NEXT STEPS:
1. Create student auth users via API:
   POST http://localhost:3001/api/admin/students
   
2. Students will be automatically assigned to batches and trainer
3. Projects will be auto-initialized
4. Then create tasks via trainer dashboard

' as instructions;

