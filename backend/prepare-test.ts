import { supabaseAdmin } from './src/lib/supabase.js';
import { workspaceService } from './src/services/workspaceService.js';

async function prepareTestAccounts() {
    console.log('Preparing test accounts...');

    const emails = ['alice@apranova.com', 'bob@apranova.com'];

    for (const email of emails) {
        const { data: student } = await supabaseAdmin
            .from('students')
            .select('id, user_id, profiles!inner(email)')
            .eq('profiles.email', email)
            .single();

        if (student) {
            console.log(`Found ${email} (ID: ${student.id}). Resetting workspace...`);
            // Stop container if running
            try {
                await workspaceService.stopWorkspace(student.id);
            } catch (e) { /* ignore */ }

            // Remove container
            try {
                const containerName = `codeserver-${student.id.substring(0, 8)}`;
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                const execAsync = promisify(exec);
                await execAsync(`docker rm -f ${containerName} || true`);
            } catch (e) { /* ignore */ }

            // Reset DB status
            await supabaseAdmin
                .from('students')
                .update({
                    workspace_status: null,
                    workspace_url: null,
                    workspace_last_activity: null
                })
                .eq('id', student.id);

            console.log(`Reset complete for ${email}`);
        } else {
            console.log(`⚠️ ${email} not found. Please create via Admin Dashboard.`);
        }
    }
}

prepareTestAccounts();
