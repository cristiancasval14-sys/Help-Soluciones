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

async function checkReportError() {
    const { data, error } = await supabase.from('service_reports').select('*').limit(1);
    if (error) {
        console.log("Error querying service_reports:", error.message);
    } else if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        // Try dummy insert
        const test = { report_id: 'TEST-1' };
        const { error: e2 } = await supabase.from('service_reports').insert([test]);
        if (e2) console.log("Error details:", e2.details || e2.message);
    }
}

checkReportError();
