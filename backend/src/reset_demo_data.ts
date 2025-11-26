
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const DEMO_USERS = [
    { email: 'alice@apranova.com', name: 'Alice Johnson', pass: 'Student123!' },
    { email: 'bob@apranova.com', name: 'Bob Smith', pass: 'Student123!' },
    { email: 'charlie@apranova.com', name: 'Charlie Davis', pass: 'Student123!' }
];

async function resetData() {
    console.log('Starting Data Reset...');

    // 1. Get all users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    // 2. Delete Demo Users
    for (const u of DEMO_USERS) {
        const user = users.find(x => x.email === u.email);
        if (user) {
            console.log(`Found Auth User: ${u.email} (${user.id})`);

            // Delete from students table using user_id
            const { error: delStudentError } = await supabase
                .from('students')
                .delete()
                .eq('user_id', user.id);

            if (delStudentError) {
                console.error(`Failed to delete student record for ${u.email}:`, delStudentError);
            } else {
                console.log(`Deleted student record for ${u.email}`);
            }

            // Delete Auth User
            const { error: delAuthError } = await supabase.auth.admin.deleteUser(user.id);
            if (delAuthError) {
                console.error(`Failed to delete Auth user ${u.email}:`, delAuthError);
            } else {
                console.log(`Deleted Auth user ${u.email}`);
            }
        }
    }

    console.log('Cleanup Complete. Now Creating Users...');

    // 3. Get a Batch ID
    const { data: batches } = await supabase.from('batches').select('id').limit(1);
    if (!batches || batches.length === 0) {
        console.error('No batches found! Create a batch first.');
        return;
    }
    const batchId = batches[0].id;

    // 4. Create Users
    for (const u of DEMO_USERS) {
        console.log(`Creating ${u.name}...`);

        // Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.pass,
            email_confirm: true,
            user_metadata: { full_name: u.name }
        });

        if (authError) {
            console.error(`Failed to create Auth for ${u.email}:`, authError);
            continue;
        }

        if (!authData.user) {
            console.error(`No user data returned for ${u.email}`);
            continue;
        }

        // Create Student Record
        // Ensure Profile exists first (if trigger didn't catch it)
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: u.email,
            full_name: u.name,
            role: 'student'
        });

        if (profileError) {
            console.error(`Failed to ensure profile for ${u.email}:`, profileError);
        }

        const { error: dbError } = await supabase.from('students').insert({
            user_id: authData.user.id,
            batch_id: batchId,
            track: 'full_stack_dev'
        });

        if (dbError) {
            console.error(`Failed to create Student Record for ${u.email}:`, dbError);
        } else {
            console.log(`Successfully created ${u.name}`);
        }
    }

    console.log('Reset Complete!');
}

resetData();
