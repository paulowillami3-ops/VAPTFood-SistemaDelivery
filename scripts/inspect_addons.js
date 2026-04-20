
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Inspecting addon_groups schema...');

    // Check addon_groups columns
    const { data: groups, error: groupsError } = await supabase.from('addon_groups').select('*').limit(1);
    if (groupsError) {
        console.error('Error fetching addon_groups:', groupsError);
    } else if (groups && groups.length > 0) {
        console.log('addon_groups Keys:', Object.keys(groups[0]));
    } else {
        console.log('addon_groups table is empty or accessible.');
    }

    // Check for a join table? product_addons?
    // Let's list tables if we could, but we can't easily.
    // Let's try to select from 'product_addons' or 'product_addon_groups'

    console.log('Checking for product_addons table...');
    const { data: joinData, error: joinError } = await supabase.from('product_addons').select('*').limit(1);
    if (!joinError) {
        console.log('Found product_addons table!');
        if (joinData.length > 0) console.log('product_addons Keys:', Object.keys(joinData[0]));
    } else {
        console.log('product_addons error:', joinError.code); // 404 or 42P01
    }

}

run();
