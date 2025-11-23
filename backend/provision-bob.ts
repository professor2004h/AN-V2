import { workspaceService } from './src/services/workspaceService.js';
import { supabaseAdmin } from './src/lib/supabase.js';

async function provisionBob() {
    console.log('Provisioning Bob...');

    const { data: bob } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('profiles.email', 'bob@apranova.com') // Fetch by email to be safe
        .single();

    // Wait, I need to join with profiles to filter by email
    const { data: students } = await supabaseAdmin
        .from('students')
        .select('id, profiles!inner(email)')
        .eq('profiles.email', 'bob@apranova.com')
        .single();

    if (!students) {
        console.error('Bob not found');
        return;
    }

    try {
        const result = await workspaceService.provisionWorkspace(students.id);
        console.log('Provision result:', result);
    } catch (error) {
        console.error('Provision failed:', error);
    }
}

provisionBob();
