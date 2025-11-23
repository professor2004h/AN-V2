async function debugBobTasks() {
    console.log('Debugging Bob tasks...');

    try {
        // Login as Bob
        const loginResponse = await fetch('http://localhost:3001/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'bob@apranova.com',
                password: 'Student123!'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.session.access_token;
        console.log('Bob login:', loginResponse.status);

        // Get Bob's student ID
        const meResponse = await fetch('http://localhost:3001/api/students/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const meData = await meResponse.json();
        console.log('Bob student ID:', meData.id);

        // Get tasks
        const tasksResponse = await fetch('http://localhost:3001/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasks = await tasksResponse.json();

        console.log(`Bob sees ${tasks.length} tasks:`);
        tasks.forEach((t: any) => {
            console.log(`- Task: ${t.title}, StudentID: ${t.student_id}`);
            if (t.student_id !== meData.id) {
                console.error('  !!! VIOLATION: Task belongs to someone else !!!');
            }
        });

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

debugBobTasks();
