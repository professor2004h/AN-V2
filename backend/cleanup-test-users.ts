
import { supabaseAdmin } from './src/lib/supabase';

async function cleanupTestUsers() {
    console.log('Cleaning up test users...');

    const emails = ['alice@apranova.com', 'bob@apranova.com', 'trainer@apranova.com'];

    for (const email of emails) {
        console.log(`Checking ${email}...`);

        // Get user from Auth
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) {
            console.error('Error listing users:', error);
            continue;
        }

        const user = users.find(u => u.email === email);

        if (user) {
            console.log(`Found user ${email} (${user.id})`);

            // Try to delete from students/trainers first (to be safe, though cascade should handle it)
            // We need to find the student/trainer record first.

            // Check student
            const { data: student } = await supabaseAdmin.from('students').select('id').eq('user_id', user.id).single();
            if (student) {
                console.log(`Deleting student record ${student.id}...`);
                await supabaseAdmin.from('students').delete().eq('id', student.id);
            }

            // Check trainer
            const { data: trainer } = await supabaseAdmin.from('trainers').select('id').eq('user_id', user.id).single();
            if (trainer) {
                console.log(`Deleting trainer record ${trainer.id}...`);
                await supabaseAdmin.from('trainers').delete().eq('id', trainer.id);
            }

            // Now delete Auth user
            console.log(`Deleting auth user ${user.id}...`);
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            if (deleteError) {
                console.error(`Error deleting user ${email}:`, deleteError);
            } else {
                console.log(`Deleted user ${email}`);
            }
        } else {
            console.log(`User ${email} not found`);
        }
    }
}

cleanupTestUsers();
