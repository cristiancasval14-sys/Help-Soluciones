import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oanveqlukrqpjrahwxjj.supabase.co';
const supabaseKey = 'sb_publishable_5ceYHGqFvodwLADgKI6PGg_7M4TQFyp';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAll() {
    console.log("=== DIAGNOSTICO COMPLETO DE SUPABASE ===\n");

    // Test companies
    console.log("--- Test: Insert Company ---");
    const { data: co, error: coErr } = await supabase
        .from('companies')
        .insert([{ name: 'Empresa Test', nit: '900000001-1', email: 'test@empresa.com', lat: null, lng: null }])
        .select();
    if (coErr) console.error("❌ Company insert error:", coErr.message, "(code:", coErr.code + ")");
    else console.log("✅ Company inserted OK:", co[0]?.name, "ID:", co[0]?.id);

    // Test staff
    console.log("\n--- Test: Insert Staff ---");
    const { data: st, error: stErr } = await supabase
        .from('staff')
        .insert([{ first_name: 'Juan', last_name: 'Pérez', role: 'Técnico', vehicle: 'Ninguno', plate: null, photo: null, vehicle_brand: null, vehicle_model: null, soat_expiry: null, tecno_expiry: null }])
        .select();
    if (stErr) console.error("❌ Staff insert error:", stErr.message, "(code:", stErr.code + ")");
    else console.log("✅ Staff inserted OK:", st[0]?.first_name, "ID:", st[0]?.id);

    // Test inventory  
    console.log("\n--- Test: Insert Inventory ---");
    const { data: inv, error: invErr } = await supabase
        .from('inventory')
        .insert([{ name: 'Laptop Test', type: 'Computador', brand: 'Dell', model: 'Latitude', serial: 'SN123456', status: 'Activo' }])
        .select();
    if (invErr) console.error("❌ Inventory insert error:", invErr.message, "(code:", invErr.code + ")");
    else console.log("✅ Inventory inserted OK:", inv[0]?.name, "ID:", inv[0]?.id);

    // Test ticket
    console.log("\n--- Test: Insert Ticket ---");
    const { data: tk, error: tkErr } = await supabase
        .from('tickets')
        .insert([{ title: 'Ticket Test', description: 'Descripcion', status: 'Nuevo', priority: 'Media', type: 'Remoto', requester_name: 'Test User' }])
        .select();
    if (tkErr) console.error("❌ Ticket insert error:", tkErr.message, "(code:", tkErr.code + ")");
    else console.log("✅ Ticket inserted OK:", tk[0]?.title, "ID:", tk[0]?.id);

    // Test profile
    console.log("\n--- Test: Insert Profile ---");
    const { data: pr, error: prErr } = await supabase
        .from('profiles')
        .insert([{ username: 'testuser_' + Date.now(), password: '123', role: 'Técnico', status: 'Activo' }])
        .select();
    if (prErr) console.error("❌ Profile insert error:", prErr.message, "(code:", prErr.code + ")");
    else console.log("✅ Profile inserted OK:", pr[0]?.username, "ID:", pr[0]?.id);

    console.log("\n=== FIN DIAGNÓSTICO ===");
}

testAll();
