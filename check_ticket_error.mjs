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

async function checkTicketError() {
    const testTicket = {
      id: 'TIC-9999',
      company_id: '60677248-342c-487a-8a1e-809b37fa8bc6',
      requester_name: 'Marcela Alba',
      priority: 'Media',
      status: 'Nuevo',
      date: new Date().toISOString().split('T')[0]
    };
    const { data, error } = await supabase.from('tickets').insert([testTicket]);
    if (error) {
        console.error("SUPABASE ERROR ON INSERT:", error);
    } else {
        console.log("Insert success with TIC-9999 ID!");
    }
}

checkTicketError();
