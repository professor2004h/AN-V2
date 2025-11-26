import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = 'http://localhost:3001/api';
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function assignTasks() {
    console.log('🎯 Starting Task Assignment...\n');

    // 1. Login as Trainer
    console.log('1. Logging in as Trainer...');
    const trainerLogin = await axios.post(`${API_URL}/auth/signin`, {
        email: 'trainer@apranova.com',
        password: 'Trainer123!'
    });
    const trainerToken = trainerLogin.data.session.access_token;
    console.log('✅ Trainer logged in\n');

    // 2. Get all students from database
    console.log('2. Fetching students from database...');
    const { data: students, error } = await supabase
        .from('students')
        .select('id, user_id')
        .in('user_id', [
            (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'alice@apranova.com')?.id,
            (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'bob@apranova.com')?.id,
            (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'charlie@apranova.com')?.id
        ].filter(Boolean));

    if (error || !students || students.length === 0) {
        console.error('❌ Failed to fetch students:', error);
        return;
    }

    console.log(`✅ Found ${students.length} students\n`);

    // 3. Get user emails to map to student IDs
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const studentMap = new Map();

    for (const student of students) {
        const user = users.find(u => u.id === student.user_id);
        if (user) {
            studentMap.set(user.email, student.id);
        }
    }

    const aliceId = studentMap.get('alice@apranova.com');
    const bobId = studentMap.get('bob@apranova.com');
    const charlieId = studentMap.get('charlie@apranova.com');

    console.log('Student IDs:');
    console.log(`  Alice: ${aliceId}`);
    console.log(`  Bob: ${bobId}`);
    console.log(`  Charlie: ${charlieId}\n`);

    // 4. Assign Tasks
    console.log('3. Assigning tasks...\n');

    const tasks = [
        {
            title: "Alice's Special Project",
            description: "Complete the advanced analytics module",
            studentId: aliceId,
            priority: "high",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            title: "Bob's Backend Challenge",
            description: "Optimize the database queries",
            studentId: bobId,
            priority: "medium",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            title: "Charlie's First Assignment",
            description: "Setup your workspace and say hello",
            studentId: charlieId,
            priority: "low",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];

    for (const task of tasks) {
        try {
            await axios.post(`${API_URL}/tasks`, task, {
                headers: { Authorization: `Bearer ${trainerToken}` }
            });
            console.log(`✅ Created: ${task.title}`);
        } catch (err: any) {
            console.error(`❌ Failed to create ${task.title}:`, err.response?.data || err.message);
        }
    }

    console.log('\n✨ Task assignment complete!');
}

assignTasks().catch(console.error);
