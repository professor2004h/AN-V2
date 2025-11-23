import { workspaceService } from './src/services/workspaceService';
import { supabaseAdmin } from './src/lib/supabase';

async function testWorkspaceProvisioning() {
    console.log('Testing workspace provisioning...');

    try {
        // Get Alice's student ID
        const { data: students } = await supabaseAdmin
            .from('students')
            .select('id, profile:profiles!students_user_id_fkey(email)');

        const alice = students?.find((s: any) => s.profile?.email === 'alice@apranova.com');

        if (!alice) {
            console.error('Alice not found');
            return;
        }

        console.log('Alice student ID:', alice.id);

        // Try to provision workspace
        console.log('Provisioning workspace...');
        const workspace = await workspaceService.provisionWorkspace(alice.id);

        console.log('Workspace provisioned successfully!');
        console.log('Workspace details:', workspace);

    } catch (error: any) {
        console.error('Error provisioning workspace:');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
    }
}

testWorkspaceProvisioning();
