async function testTaskAPI() {
    console.log('Testing task creation via API...');

    try {
        // Login as trainer
        const trainerLoginResponse = await fetch('http://localhost:3001/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'trainer@apranova.com',
                password: 'Trainer123!'
            })
        });

        const trainerLoginData = await trainerLoginResponse.json();
        const trainerToken = trainerLoginData.session.access_token;
        console.log('Trainer login:', trainerLoginResponse.status);

        // Login as admin to get student ID
        const adminLoginResponse = await fetch('http://localhost:3001/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@apranova.com',
                password: 'Admin123!'
            })
        });

        const adminLoginData = await adminLoginResponse.json();
        const adminToken = adminLoginData.session.access_token;

        // Get Alice's student ID
        const studentsResponse = await fetch('http://localhost:3001/api/admin/students', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const studentsData = await studentsResponse.json();
        const alice = studentsData.students?.find((s: any) => s.profile?.email === 'alice@apranova.com');

        if (!alice) {
            console.error('Alice not found');
            console.log('Students:', studentsData);
            return;
        }

        console.log('Alice student ID:', alice.id);

        // Try to create task via API (use trainer token)
        const taskResponse = await fetch('http://localhost:3001/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${trainerToken}`
            },
            body: JSON.stringify({
                title: 'API Test Task',
                description: 'Testing task creation via API',
                studentId: alice.id,
                priority: 'high',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })
        });

        console.log('Task creation response:', taskResponse.status);
        const taskData = await taskResponse.text();
        console.log('Response body:', taskData);

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

testTaskAPI();
