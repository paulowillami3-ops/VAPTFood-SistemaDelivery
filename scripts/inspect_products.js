
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Fetching one product to inspect schema...');
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Product Keys:', Object.keys(data[0]));
        } else {
            console.log('No products found to inspect. Trying to insert to see error details...');
        }
    }
}

run();
