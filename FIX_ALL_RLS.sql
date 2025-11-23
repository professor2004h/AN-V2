-- ================================
-- COMPREHENSIVE RLS POLICIES FIX
-- ================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. TRAINERS
DROP POLICY IF EXISTS "Admins can manage trainers" ON trainers;
DROP POLICY IF EXISTS "Trainers can view themselves" ON trainers;
DROP POLICY IF EXISTS "Everyone can view trainers" ON trainers;

CREATE POLICY "Admins can manage trainers" ON trainers FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "Trainers can view themselves" ON trainers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Everyone can view trainers" ON trainers FOR SELECT USING (true);

-- 3. STUDENTS
DROP POLICY IF EXISTS "Admins can manage students" ON students;
DROP POLICY IF EXISTS "Students can view themselves" ON students;
DROP POLICY IF EXISTS "Trainers can view assigned students" ON students;

CREATE POLICY "Admins can manage students" ON students FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "Students can view themselves" ON students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Trainers can view assigned students" ON students FOR SELECT USING (
    EXISTS (SELECT 1 FROM trainers WHERE user_id = auth.uid() AND id = students.trainer_id)
);

-- 4. BATCHES (Already fixed, but including for completeness)
DROP POLICY IF EXISTS "Admins can manage batches" ON batches;
DROP POLICY IF EXISTS "Authenticated users can view batches" ON batches;

CREATE POLICY "Admins can manage batches" ON batches FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "Authenticated users can view batches" ON batches FOR SELECT USING (auth.role() = 'authenticated');

-- 5. PROJECTS
DROP POLICY IF EXISTS "Admins can manage projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;

CREATE POLICY "Admins can manage projects" ON projects FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "Authenticated users can view projects" ON projects FOR SELECT USING (auth.role() = 'authenticated');

-- 6. STUDENT_PROJECTS
DROP POLICY IF EXISTS "Admins can manage student_projects" ON student_projects;
DROP POLICY IF EXISTS "Students can view own projects" ON student_projects;
DROP POLICY IF EXISTS "Trainers can view assigned student projects" ON student_projects;

CREATE POLICY "Admins can manage student_projects" ON student_projects FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "Students can view own projects" ON student_projects FOR SELECT USING (
    EXISTS (SELECT 1 FROM students WHERE user_id = auth.uid() AND id = student_projects.student_id)
);
CREATE POLICY "Trainers can view assigned student projects" ON student_projects FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM students s
        JOIN trainers t ON s.trainer_id = t.id
        WHERE s.id = student_projects.student_id AND t.user_id = auth.uid()
    )
);

-- 7. TASKS
DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Trainers can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Students can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Students can update own tasks" ON tasks;

CREATE POLICY "Admins can manage tasks" ON tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "Trainers can manage tasks" ON tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM trainers WHERE user_id = auth.uid())
);
CREATE POLICY "Students can view own tasks" ON tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM students WHERE user_id = auth.uid() AND id = tasks.student_id)
);
CREATE POLICY "Students can update own tasks" ON tasks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM students WHERE user_id = auth.uid() AND id = tasks.student_id)
);

-- 8. SUBMISSIONS
DROP POLICY IF EXISTS "Admins can manage submissions" ON submissions;
DROP POLICY IF EXISTS "Students can manage own submissions" ON submissions;
DROP POLICY IF EXISTS "Trainers can view and update submissions" ON submissions;

CREATE POLICY "Admins can manage submissions" ON submissions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "Students can manage own submissions" ON submissions FOR ALL USING (
    EXISTS (SELECT 1 FROM students WHERE user_id = auth.uid() AND id = submissions.student_id)
);
CREATE POLICY "Trainers can view and update submissions" ON submissions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM students s
        JOIN trainers t ON s.trainer_id = t.id
        WHERE s.id = submissions.student_id AND t.user_id = auth.uid()
    )
);

-- 9. NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications; -- Usually handled by service role

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 10. MESSAGES
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
);
