import { supabaseAdmin } from './src/lib/supabase';

async function createTasks() {
    console.log('Creating tasks for Alice and Bob...');

    try {
        // Get Alice and Bob by joining with profiles
        const { data: students } = await supabaseAdmin
            .from('students')
            .select('id, user_id, profile:profiles!students_user_id_fkey(email)');

        const alice = students?.find((s: any) => s.profile?.email === 'alice@apranova.com');
        const bob = students?.find((s: any) => s.profile?.email === 'bob@apranova.com');

        // Get trainer
        const { data: trainer } = await supabaseAdmin
            .from('trainers')
            .select('id, user_id')
            .limit(1)
            .single();

        if (!alice || !bob || !trainer) {
            console.error('Missing students or trainer');
            console.log('Alice:', alice);
            console.log('Bob:', bob);
            console.log('Trainer:', trainer);
            return;
        }

        console.log('Alice student ID:', alice.id);
        console.log('Bob student ID:', bob.id);
        console.log('Trainer user ID:', trainer.user_id);

        // Create tasks - trainer_id in tasks table references profiles.id (user_id)
        const tasks = [
            {
                title: 'Complete Python Basics Module',
                description: 'Learn Python fundamentals including variables, data types, loops, and functions',
                student_id: alice.id,
                trainer_id: trainer.user_id,  // Use user_id, not trainer record id
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                priority: 'high',
                status: 'pending'
            },
            {
                title: 'Setup Development Environment',
                description: 'Install VS Code, Python, and required libraries',
                student_id: alice.id,
                trainer_id: trainer.user_id,  // Use user_id, not trainer record id
                due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                priority: 'medium',
                status: 'pending'
            },
            {
                title: 'Read Course Documentation',
                description: 'Review the course syllabus and learning objectives',
                student_id: bob.id,
                trainer_id: trainer.user_id,  // Use user_id, not trainer record id
                due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                priority: 'low',
                status: 'pending'
            }
        ];

        const { data: createdTasks, error } = await supabaseAdmin
            .from('tasks')
            .insert(tasks)
            .select();

        if (error) {
            console.error('Error creating tasks:', error);
        } else {
            console.log(`Created ${createdTasks.length} tasks successfully!`);
            createdTasks.forEach((task: any) => {
                console.log(`- ${task.title} (${task.priority})`);
            });
        }

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

createTasks();
