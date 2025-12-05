
import { adminService } from './src/services/adminService';
import { supabaseAdmin } from './src/lib/supabase';

async function createAdminAndTrainer() {
    console.log('Creating Admin and Trainer accounts...');

    try {
        // 1. Create Trainer
        console.log('Checking/Creating Trainer...');
        try {
            const trainer = await adminService.createTrainer({
                email: 'trainer@apranova.com',
                password: 'Trainer123!',
                fullName: 'John Trainer',
                specialization: 'Full Stack Development'
            });
            console.log('Trainer created/found:', trainer);
        } catch (e: any) {
            console.log('Trainer creation info:', e.message);
        }

        // 2. Create Admin
        console.log('Checking/Creating Admin...');
        try {
            // Check if admin exists first
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
            const adminUser = users.find(u => u.email === 'admin@apranova.com');

            if (adminUser) {
                console.log('Admin user already exists:', adminUser.id);
                // Ensure profile has admin role
                const { error } = await supabaseAdmin
                    .from('profiles')
                    .update({ role: 'admin' })
                    .eq('id', adminUser.id);
                if (error) console.error('Error updating admin role:', error);
                else console.log('Admin role verified.');
            } else {
                const { user, profile } = await adminService.createUserWithRole({
                    email: 'admin@apranova.com',
                    password: 'Admin123!',
                    fullName: 'System Admin',
                    role: 'admin'
                });
                console.log('Admin created:', user.email);
            }
        } catch (e: any) {
            console.error('Error creating admin:', e.message);
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    }
}

createAdminAndTrainer();
