
import { adminService } from './src/services/adminService';
import { config } from './src/config';

async function testBatchCreation() {
    console.log('Testing Batch Creation...');
    console.log('Service Role Key present:', !!config.supabase.serviceRoleKey);
    console.log('Supabase URL:', config.supabase.url);

    try {
        const batch = await adminService.createBatch({
            name: "Debug Batch " + Date.now(),
            track: "full_stack_dev",
            startDate: new Date().toISOString(),
            maxStudents: 25
        });
        console.log('Batch created successfully:', batch);
    } catch (error) {
        console.error('Error creating batch:', error);
    }
}

testBatchCreation();
