
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    console.log('Checking addon_groups schema...');

    // Try to select establishment_id from addon_groups
    const { data, error } = await supabase
        .from('addon_groups')
        .select('establishment_id')
        .limit(1);

    if (error) {
        console.error('Error selecting establishment_id:', error.message);
    } else {
        console.log('Successfully selected establishment_id. Column exists.');
    }
}

checkSchema();
