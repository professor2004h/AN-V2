import { workspaceService } from './src/services/workspaceService.js';

async function provisionAlice() {
    console.log('Provisioning Alice...');

    const aliceId = '210bdd1a-8546-40db-9d99-0083c07232a8';

    try {
        const result = await workspaceService.provisionWorkspace(aliceId);
        console.log('Provision result:', result);
    } catch (error) {
        console.error('Provision failed:', error);
    }
}

provisionAlice();
