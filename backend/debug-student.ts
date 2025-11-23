
import { adminService } from './src/services/adminService';
import { supabaseAdmin } from './src/lib/supabase';

async function testStudentCreation() {
    console.log('Testing Student Creation...');

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
            email: `debug.student.${Date.now()}@test.com`,
            password: 'Student123!',
            fullName: 'Debug Student',
            track: 'full_stack_dev' as const,
            batchId,
            trainerId
        };

        console.log('Creating student:', studentData.email);
        const student = await adminService.createStudent(studentData);
        console.log('Student created successfully:', student);

    } catch (error) {
        console.error('Error creating student:', error);
    }
}

testStudentCreation();
