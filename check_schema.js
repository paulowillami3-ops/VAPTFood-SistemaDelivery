
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: groups, error } = await supabase.from('product_addon_groups').select('*').limit(1);
    if (groups && groups.length > 0) {
        console.log('Product Addon Groups Keys:', Object.keys(groups[0]));
    } else {
        console.log('No groups found, cannot infer keys.');
    }

    const { data: addons, error: addonError } = await supabase.from('product_addons').select('*').limit(1);
    if (addons && addons.length > 0) {
        console.log('Product Addons Keys:', Object.keys(addons[0]));
    } else {
        console.log('No addons found.');
    }
}

checkSchema();
