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

async function checkTickets() {
    const { data, error } = await supabase.from('tickets').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Ticket entry:");
        console.log(JSON.stringify(data, null, 2));
    }
}

checkTickets();
