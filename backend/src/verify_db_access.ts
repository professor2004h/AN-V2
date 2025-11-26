
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('Testing DB Access...');
console.log('URL:', supabaseUrl);
// console.log('Key:', supabaseServiceRoleKey); // Don't log the key

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function test() {
    try {
        // 1. Try to list users
        const { data: users, error: userError } = await supabase.auth.admin.listUsers();
        if (userError) {
            console.error('Error listing users:', userError);
        } else {
            console.log('Users found:', users.users.length);
            const alice = users.users.find(u => u.email === 'alice@apranova.com');
            if (alice) {
                console.log('Alice found:', alice.id);
            } else {
                console.log('Alice NOT found in Auth');
            }
        }

        // 2. Try to query public.students
        const { data: students, error: studentError } = await supabase
            .from('students')
            .select('*');

        if (studentError) {
            console.error('Error querying students table:', studentError);
        } else {
            console.log('Students in public table:', students.length);
            const aliceStudent = students.find(s => s.email === 'alice@apranova.com');
            if (aliceStudent) {
                console.log('Alice found in public.students:', aliceStudent.id);
            } else {
                console.log('Alice NOT found in public.students');
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

test();
