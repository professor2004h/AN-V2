import { supabaseAdmin } from './src/lib/supabase.js';

async function checkAlice() {
    const { data: alice } = await supabaseAdmin
        .from('students')
        .select('workspace_status, workspace_url')
        .eq('user_id', '210bdd1a-8546-40db-9d99-0083c07232a8') // Alice's ID
        .single();

    console.log('Alice Status:', alice);
}

checkAlice();
