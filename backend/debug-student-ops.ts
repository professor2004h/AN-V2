
import { adminService } from './src/services/adminService';
import { supabaseAdmin } from './src/lib/supabase';

async function testStudentOperations() {
    console.log('Testing Student Operations...');

    try {
        // 1. Test getAllStudents
        console.log('Testing getAllStudents...');
        const result = await adminService.getAllStudents();
        console.log(`Found ${result.total} students`);

        // 2. Test createStudent with duplicate email
        console.log('Testing createStudent with duplicate email...');
        try {
            await adminService.createStudent({
                email: 'alice@apranova.com',
                password: 'Student123!',
                fullName: 'Alice Johnson',
                track: 'data_professional',
                batchId: null, // Just testing auth creation
                trainerId: null
            });
        } catch (error: any) {
            console.log('Expected error for duplicate:', error.message || error);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testStudentOperations();
