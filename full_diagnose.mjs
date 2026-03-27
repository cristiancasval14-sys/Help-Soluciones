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

async function diagnoseSchema() {
    const tables = ['tickets', 'inventory', 'companies', 'staff', 'company_employees', 'company_sedes', 'profiles'];
    console.log("--- SCHEMA DIAGNOSTIC ---");
    
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table [${table}]: ERROR - ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`Table [${table}]: Columns - ${Object.keys(data[0]).join(', ')}`);
        } else {
            // If empty, try to insert a dummy and rollback or just check if it at least exists
            console.log(`Table [${table}]: exists (but empty)`);
        }
    }
}

diagnoseSchema();
