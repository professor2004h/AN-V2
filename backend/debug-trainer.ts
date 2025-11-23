
import { adminService } from './src/services/adminService';
import { supabaseAdmin } from './src/lib/supabase';

async function testTrainerCreation() {
    console.log('Testing Trainer Creation...');

    try {
        // 1. Check if trainer exists in Auth
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        const trainerUser = users.find(u => u.email === 'trainer@apranova.com');

        if (trainerUser) {
            console.log('Trainer Auth User exists:', trainerUser.id);

            // 2. Check if trainer profile exists
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('id', trainerUser.id)
                .single();
            console.log('Trainer Profile:', profile);

            // 3. Check if trainer record exists
            const { data: trainer } = await supabaseAdmin
                .from('trainers')
                .select('*')
                .eq('user_id', trainerUser.id)
                .single();
            console.log('Trainer Record:', trainer);

            if (!trainer) {
                console.log('Creating trainer record manually...');
                const { data: newTrainer, error: createError } = await supabaseAdmin
                    .from('trainers')
                    .insert({
                        user_id: trainerUser.id,
                        specialization: 'Full Stack Development'
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating trainer record:', createError);
                } else {
                    console.log('Trainer record created:', newTrainer);
                }
            }
        } else {
            console.log('Trainer Auth User does NOT exist. Creating...');
            const trainer = await adminService.createTrainer({
                email: 'trainer@apranova.com',
                password: 'Trainer123!',
                fullName: 'John Trainer',
                specialization: 'Full Stack Development'
            });
            console.log('Trainer created via service:', trainer);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testTrainerCreation();
