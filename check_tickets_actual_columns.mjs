import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.trim().match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, '$1');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listColumns() {
    try {
        const { data, error } = await supabase.from('tickets').select('*').limit(1);
        if (error) {
            console.error("Query Error:", error);
            return;
        }
        if (data && data.length > 0) {
            console.log("Ticket Columns:", Object.keys(data[0]));
        } else {
            console.log("No tickets found to check columns.");
        }
    } catch (err) {
        console.error("Execution Error:", err);
    }
}

listColumns();
