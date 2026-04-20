
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Testing/Debugging Cashier Fetch...');
    console.log('URL:', `${supabaseUrl}/rest/v1/cashier_sessions?select=*&establishment_id=eq.2&order=created_at.desc&limit=1`);

    try {
        const { data, error } = await supabase
            .from('cashier_sessions')
            .select('*')
            .eq('establishment_id', 2)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Supabase Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('Success!', data);
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

run();
