-- CREATE TEST DATA MANUALLY
-- This script creates batches only (students must be created via Supabase Auth API)

-- Step 1: Create Test Batches
INSERT INTO batches (name, track, start_date, end_date, max_students)
VALUES 
  ('Batch 2024-Q1 Data Professional', 'data_professional', '2024-01-15', '2024-04-15', 30),
  ('Batch 2024-Q2 Full Stack', 'full_stack_dev', '2024-04-15', '2024-07-15', 25)
ON CONFLICT DO NOTHING;

-- Step 2: Verify batches were created
SELECT id, name, track, start_date, end_date, max_students, created_at
FROM batches
ORDER BY created_at DESC
LIMIT 5;

-- Step 3: Get trainer ID for reference
SELECT id, full_name, email, specialization
FROM trainers
WHERE email = 'trainer@apranova.com';

-- Note: Students MUST be created via the Admin Dashboard or API
-- because they require Supabase Auth user creation which cannot be done via SQL

-- After creating students via UI, you can verify them with:
-- SELECT s.id, s.full_name, s.email, s.track, s.batch_id, s.trainer_id
-- FROM students s
-- WHERE s.email IN ('alice@apranova.com', 'bob@apranova.com');

