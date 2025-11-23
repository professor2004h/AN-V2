-- ================================
-- SETUP ADMIN, TRAINER, AND SUPER ADMIN ACCOUNTS
-- Execute this AFTER DATABASE_MIGRATION.sql
-- ================================

-- NOTE: You must first create these users in Supabase Authentication
-- Go to Supabase Dashboard → Authentication → Users → Add User
-- Create these 3 users:
-- 1. admin@apranova.com / Admin123!
-- 2. trainer@apranova.com / Trainer123!
-- 3. superadmin@apranova.com / SuperAdmin123!

-- Then run this SQL script

-- ================================
-- 1. CREATE ADMIN PROFILE
-- ================================
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@apranova.com'),
  'admin@apranova.com',
  'System Admin',
  'admin'
)
ON CONFLICT (id) DO NOTHING;

-- ================================
-- 2. CREATE TRAINER PROFILE AND TRAINER RECORD
-- ================================
-- First create the profile
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'trainer@apranova.com'),
  'trainer@apranova.com',
  'John Trainer',
  'trainer'
)
ON CONFLICT (id) DO NOTHING;

-- Then create the trainer record
INSERT INTO trainers (user_id, specialization, bio)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'trainer@apranova.com'),
  'Data Science & Python',
  'Experienced trainer in data science and full-stack development'
)
ON CONFLICT (user_id) DO NOTHING;

-- ================================
-- 3. CREATE SUPER ADMIN PROFILE
-- ================================
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'superadmin@apranova.com'),
  'superadmin@apranova.com',
  'Super Administrator',
  'superadmin'
)
ON CONFLICT (id) DO NOTHING;

-- ================================
-- VERIFICATION
-- ================================
SELECT 'Setup completed!' as status;

-- Show created users
SELECT email, full_name, role FROM profiles 
WHERE email IN ('admin@apranova.com', 'trainer@apranova.com', 'superadmin@apranova.com')
ORDER BY role;

-- Show trainer details
SELECT u.email, t.specialization, t.bio FROM trainers t
JOIN profiles u ON t.user_id = u.id
WHERE u.email = 'trainer@apranova.com';

