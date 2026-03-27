import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Starting check...");
    const { data, error } = await supabase.from('service_reports').select('*').limit(1);
    
    if (error) {
        console.log("Error:", error.message);
        return;
    }
    
    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("Table exists but is empty.");
        // Try to insert a row with an invalid field to see existing columns in error
        const { error: e2 } = await supabase.from('service_reports').insert([{ dummy_field: 'error' }]);
        if (e2) {
             console.log("Error Detail (contains columns):", e2.message);
        }
    }
}

check();
