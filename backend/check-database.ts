import { supabaseAdmin } from './src/lib/supabase.js';

async function checkDatabase() {
    console.log('Checking database for existing data...\n');

    // Check trainers
    const { data: trainers, error: trainersError } = await supabaseAdmin
        .from('trainers')
        .select('*, profile:profiles!trainers_user_id_fkey(*)');

    console.log('=== TRAINERS ===');
    console.log('Count:', trainers?.length || 0);
    if (trainersError) console.error('Error:', trainersError);
    if (trainers && trainers.length > 0) {
        trainers.forEach(t => {
            console.log(`- ${t.profile?.full_name} (${t.profile?.email})`);
        });
    }
    console.log('');

    // Check students
    const { data: students, error: studentsError } = await supabaseAdmin
        .from('students')
        .select('*, profile:profiles!students_user_id_fkey(*)');

    console.log('=== STUDENTS ===');
    console.log('Count:', students?.length || 0);
    if (studentsError) console.error('Error:', studentsError);
    if (students && students.length > 0) {
        students.forEach(s => {
            console.log(`- ${s.profile?.full_name} (${s.profile?.email})`);
        });
    }
    console.log('');

    // Check batches
    const { data: batches, error: batchesError } = await supabaseAdmin
        .from('batches')
        .select('*');

    console.log('=== BATCHES ===');
    console.log('Count:', batches?.length || 0);
    if (batchesError) console.error('Error:', batchesError);
    if (batches && batches.length > 0) {
        batches.forEach(b => {
            console.log(`- ${b.name} (${b.track})`);
        });
    }
}

checkDatabase();
