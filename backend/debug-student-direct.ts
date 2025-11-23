import { adminService } from './src/services/adminService';
import { supabaseAdmin } from './src/lib/supabase';

async function testCreateStudentDirect() {
    console.log('Testing student creation directly...');

    try {
        // Get a batch and trainer
        const { data: batches } = await supabaseAdmin.from('batches').select().limit(1);
        const { data: trainers } = await supabaseAdmin.from('trainers').select().limit(1);

        if (!batches?.length || !trainers?.length) {
            console.error('No batches or trainers found');
            return;
        }

        const batchId = batches[0].id;
        const trainerId = trainers[0].id;

        console.log('Using Batch:', batchId);
        console.log('Using Trainer:', trainerId);

        // Create student
        const studentData = {
            email: 'alice@apranova.com',
            password: 'Student123!',
            fullName: 'Alice Johnson',
            track: 'data_professional' as const,
            batchId,
            trainerId
        };

        console.log('Creating student:', studentData.email);
        const student = await adminService.createStudent(studentData);
        console.log('Student created successfully!');
        console.log('Student ID:', student.id);
        console.log('User ID:', student.user_id);

    } catch (error: any) {
        console.error('Error creating student:');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
        console.error('Full error:', JSON.stringify(error, null, 2));
    }
}

testCreateStudentDirect();
