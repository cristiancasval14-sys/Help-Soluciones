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

async function checkInventory() {
    console.log("Saving 'Juan' into assigned_employee_id");
    const { data, error } = await supabase.from('inventory').update({ assigned_employee_id: 'Juan' }).eq('id', '78b9457a-384e-4acb-af6a-8d779f278178');
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Success");
    }
}

checkInventory();
