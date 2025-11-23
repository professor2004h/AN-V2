import { supabaseAdmin } from './src/lib/supabase';

async function testTaskCreation() {
    console.log('Testing task creation via API...');

    try {
        // Get Alice
        const { data: students } = await supabaseAdmin
            .from('students')
            .select('id, user_id, profile:profiles!students_user_id_fkey(email)');

        const alice = students?.find((s: any) => s.profile?.email === 'alice@apranova.com');

        // Get trainer
        const { data: trainer } = await supabaseAdmin
            .from('trainers')
            .select('id, user_id')
            .limit(1)
            .single();

        if (!alice || !trainer) {
            console.error('Missing alice or trainer');
            return;
        }

        console.log('Alice student ID:', alice.id);
        console.log('Alice user ID:', alice.user_id);
        console.log('Trainer user ID:', trainer.user_id);

        // Try to create task directly in DB
        const taskData = {
            title: 'Test API Task',
            description: 'Testing task creation',
            student_id: alice.id,
            trainer_id: trainer.user_id,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'high',
            status: 'pending'
        };

        console.log('Task data:', taskData);

        const { data: task, error } = await supabaseAdmin
            .from('tasks')
            .insert(taskData)
            .select()
            .single();

        if (error) {
            console.error('Error creating task:', error);
        } else {
            console.log('Task created successfully!');
            console.log('Task:', task);
        }

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

testTaskCreation();
