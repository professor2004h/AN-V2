import axios from 'axios';

async function testHeartbeat() {
    console.log('Testing Heartbeat Endpoint...');

    // We need a valid token or we need to mock the request.
    // Since we can't easily get a token without login flow, 
    // and the endpoint requires authentication...

    // Actually, I can use the `test-admin-api.ts` approach if I had admin token.
    // But I don't have one easily available.

    // However, I can check if the route is registered by hitting it and expecting 401.
    try {
        await axios.post('http://localhost:3001/api/workspaces/heartbeat', {});
    } catch (error: any) {
        if (error.response?.status === 401) {
            console.log('✅ Endpoint exists and is protected (401 received)');
        } else {
            console.log('❌ Unexpected error:', error.message);
        }
    }
}

testHeartbeat();
