import { workspaceService } from './src/services/workspaceService.js';
import { supabaseAdmin } from './src/lib/supabase.js';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testPersistence() {
    console.log('Testing Persistence for Alice...');
    const aliceId = '210bdd1a-8546-40db-9d99-0083c07232a8';
    const containerName = `codeserver-${aliceId.substring(0, 8)}`;

    // 1. Stop and Remove Container
    console.log('Stopping container...');
    await execAsync(`docker rm -f ${containerName} || true`);

    // 2. Verify Container Gone
    try {
        await execAsync(`docker inspect ${containerName}`);
        console.error('❌ Container still exists!');
    } catch (e) {
        console.log('✅ Container removed.');
    }

    // 3. Verify Data Directory Exists
    const dataPath = path.join(process.cwd(), 'workspace-data', aliceId);
    if (fs.existsSync(dataPath)) {
        console.log('✅ Data directory exists:', dataPath);
        // Check if file exists inside (if we can read it)
        // Note: The file created by Code-Server might be owned by root or 1000:1000.
        // We might not be able to read it easily from Windows host if permissions are weird,
        // but we can check if the folder is not empty.
        const files = fs.readdirSync(dataPath);
        console.log('Files in data dir:', files);
        // We expect 'alice_secret.txt' if it was saved in the root of the mount?
        // The mount is /home/coder/project.
        // So files created in "project" folder should be here.
        // In the browser test, I created it in the root of the explorer, which is usually /home/coder/project.
    } else {
        console.error('❌ Data directory missing!');
    }

    // 4. Re-provision
    console.log('Re-provisioning Alice...');
    // Reset status first so provision works
    await supabaseAdmin
        .from('students')
        .update({ workspace_status: null, workspace_url: null })
        .eq('id', aliceId);

    await workspaceService.provisionWorkspace(aliceId);
    console.log('✅ Re-provisioned.');
}

testPersistence();
