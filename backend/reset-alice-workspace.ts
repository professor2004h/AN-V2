import { supabaseAdmin } from './src/lib/supabase.js';

async function resetAliceWorkspace() {
    console.log('Resetting Alice workspace...\n');

    // Get all students with their profiles
    const { data: students, error: studentsError } = await supabaseAdmin
        .from('students')
        .select('id, user_id, profiles!students_user_id_fkey(email)');

    if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return;
    }

    console.log('Found', students?.length, 'students');

    const alice = students?.find((s: any) => s.profiles?.email === 'alice@apranova.com');

    if (!alice) {
        console.error('Alice not found');
        return;
    }

    console.log('Found Alice, student ID:', alice.id);

    // Reset workspace fields
    const { data, error } = await supabaseAdmin
        .from('students')
        .update({
            workspace_status: null,
            workspace_url: null,
        })
        .eq('id', alice.id)
        .select();

    if (error) {
        console.error('Error resetting workspace:', error);
    } else {
        console.log('✅ Workspace reset successfully!');
        console.log('Updated record:', data);
    }
}

resetAliceWorkspace();
