async function testCreateStudent() {
    console.log('Testing student creation via API...');

    // First login as admin
    const loginResponse = await fetch('http://localhost:3001/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@apranova.com',
            password: 'Admin123!'
        })
    });

    const loginData = await loginResponse.json();
    console.log('Admin login:', loginResponse.status);

    if (!loginResponse.ok) {
        console.error('Login failed:', loginData);
        return;
    }

    const token = loginData.session.access_token;

    // Get batches and trainer
    const batchesResponse = await fetch('http://localhost:3001/api/admin/batches', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const batchesData = await batchesResponse.json();
    const batchId = batchesData.batches?.[0]?.id;

    const trainersResponse = await fetch('http://localhost:3001/api/admin/trainers', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const trainersData = await trainersResponse.json();
    const trainerId = trainersData.trainers?.[0]?.id;

    console.log('Using batch:', batchId);
    console.log('Using trainer:', trainerId);

    // Try to create student
    const studentResponse = await fetch('http://localhost:3001/api/admin/students', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            email: 'alice@apranova.com',
            password: 'Student123!',
            fullName: 'Alice Johnson',
            track: 'data_professional',
            batchId: batchId,
            trainerId: trainerId
        })
    });

    console.log('Student creation response:', studentResponse.status);
    const studentData = await studentResponse.text();
    console.log('Response body:', studentData);
}

testCreateStudent();
