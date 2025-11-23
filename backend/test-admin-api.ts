// Test admin API endpoints
const API_URL = 'http://localhost:3001/api';

async function testAdminEndpoints() {
    console.log('Testing Admin API Endpoints...\n');

    try {
        // Test trainers endpoint
        console.log('1. Testing /admin/trainers...');
        const trainersRes = await fetch(`${API_URL}/admin/trainers`);
        const trainersData = await trainersRes.json();
        console.log('Status:', trainersRes.status);
        console.log('Response:', JSON.stringify(trainersData, null, 2));
        console.log('Trainers count:', trainersData.trainers?.length || 0);
        console.log('Total:', trainersData.total);
        console.log('');

        // Test students endpoint
        console.log('2. Testing /admin/students...');
        const studentsRes = await fetch(`${API_URL}/admin/students`);
        const studentsData = await studentsRes.json();
        console.log('Status:', studentsRes.status);
        console.log('Response:', JSON.stringify(studentsData, null, 2));
        console.log('Students count:', studentsData.students?.length || 0);
        console.log('Total:', studentsData.total);
        console.log('');

        // Test batches endpoint
        console.log('3. Testing /admin/batches...');
        const batchesRes = await fetch(`${API_URL}/admin/batches`);
        const batchesData = await batchesRes.json();
        console.log('Status:', batchesRes.status);
        console.log('Response:', JSON.stringify(batchesData, null, 2));
        console.log('Batches count:', batchesData.batches?.length || 0);
        console.log('Total:', batchesData.total);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAdminEndpoints();
