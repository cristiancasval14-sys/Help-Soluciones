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
    console.log("Starting check KB...");
    const { data, error } = await supabase.from('knowledge_base').select('*').limit(1);
    
    if (error) {
        console.log("Error:", error.message);
        return;
    }
    
    if (data && data.length > 0) {
        console.log("Columns KB:", Object.keys(data[0]));
    } else {
        console.log("Table KB exists but is empty.");
        const { error: e2 } = await supabase.from('knowledge_base').insert([{ dummy_field: 'error' }]);
        if (e2) {
             console.log("Error Detail:", e2.message);
        }
    }
}

check();
