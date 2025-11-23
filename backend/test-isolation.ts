import { supabaseAdmin } from './src/lib/supabase.js';
import { workspaceService } from './src/services/workspaceService.js';

async function testIsolation() {
    console.log('Testing Workspace Isolation...\n');

    // 1. Get Alice and Bob
    const { data: students } = await supabaseAdmin
        .from('students')
        .select('id, user_id, profiles!students_user_id_fkey(email)');

    const alice = students?.find((s: any) => s.profiles?.email === 'alice@apranova.com');
    const bob = students?.find((s: any) => s.profiles?.email === 'bob@apranova.com');

    if (!alice || !bob) {
        console.error('Alice or Bob not found. Please ensure they exist.');
        return;
    }

    console.log('Alice ID:', alice.id);
    console.log('Bob ID:', bob.id);

    // 2. Reset Workspaces
    console.log('\nResetting workspaces...');
    try { await workspaceService.deleteWorkspace(alice.id); } catch (e) { console.log('Alice workspace cleanup skipped'); }
    try { await workspaceService.deleteWorkspace(bob.id); } catch (e) { console.log('Bob workspace cleanup skipped'); }

    // 3. Provision Alice
    console.log('\nProvisioning Alice...');
    const aliceWs = await workspaceService.provisionWorkspace(alice.id);
    console.log('Alice Workspace:', aliceWs);

    // 4. Provision Bob
    console.log('\nProvisioning Bob...');
    const bobWs = await workspaceService.provisionWorkspace(bob.id);
    console.log('Bob Workspace:', bobWs);

    // 5. Verify Isolation
    console.log('\nVerifying Isolation...');
    if (aliceWs.url !== bobWs.url) {
        console.log('✅ URLs are different');
    } else {
        console.error('❌ URLs are same!');
    }

    // Check container names if available (might be in different property depending on return type)
    const aliceContainer = (aliceWs as any).containerName;
    const bobContainer = (bobWs as any).containerName;

    if (aliceContainer && bobContainer) {
        if (aliceContainer !== bobContainer) {
            console.log('✅ Container names are different');
        } else {
            console.error('❌ Container names are same!');
        }
    } else {
        console.log('⚠️ Container names not returned in response, skipping check.');
    }

    console.log('\nTest Complete!');
}

testIsolation();
