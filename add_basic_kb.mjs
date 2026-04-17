import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
let supabaseUrl = '';
let supabaseKey = '';
envFile.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

const newArticles = [
    {
        kb_id: 'KB-201', title: 'Restablecer Contraseña de Windows', category: 'seguridad',
        tags: ['windows', 'contraseña', 'acceso'], author_name: 'Soporte Nivel 1', views: 0, helpful: 0, not_helpful: 0, pinned: true,
        content: '# ¿Olvidaste tu contraseña de Windows?\n\nSi su equipo está conectado al dominio corporativo:\n1. Asegúrese de estar conectado a la red de la oficina (cable o Wi-Fi).\n2. En la pantalla de bloqueo, haga clic en "Restablecer contraseña".\n3. Siga las instrucciones del portal cautivo usando su celular para recibir el código SMS.\n\nSi trabaja desde casa:\nDebe llamar a la mesa de ayuda para generar un token temporal de inicio de sesión sin red interna.'
    },
    {
        kb_id: 'KB-202', title: 'Limpiar Caché del Navegador (Chrome/Edge)', category: 'software',
        tags: ['navegador', 'cache', 'lento', 'internet'], author_name: 'Soporte Nivel 1', views: 0, helpful: 0, not_helpful: 0, pinned: true,
        content: '# Solucionar páginas lentas o que no actualizan\n\n1. Abra Chrome o Edge.\n2. Presione al mismo tiempo las teclas **Ctrl + Shift + Suprimir**.\n3. Se abrirá la ventana de "Borrar datos de navegación".\n4. En "Intervalo de tiempo", seleccione **Desde siempre** (o "All time").\n5. Marque únicamente la casilla de **"Archivos e imágenes almacenados en caché"**.\n6. Haga clic en **Borrar datos** y reinicie su navegador.'
    },
    {
        kb_id: 'KB-203', title: 'Monitores o Pantallas no dan Video', category: 'hardware',
        tags: ['pantalla', 'monitor', 'video', 'hardware'], author_name: 'Soporte Nivel 1', views: 0, helpful: 0, not_helpful: 0, pinned: false,
        content: '# Qué hacer si el monitor secundario o principal no da imagen\n\n1. **Revisar Energía:** Atrás del monitor hay un cable negro grueso. Asegúrese de que esté bien empujado, al igual que en la toma de pared.\n2. **Revisar Señal (HDMI/DisplayPort):** Asegúrese de que el cable de video esté bien conectado tanto al monitor como a la torre/docking station.\n3. **Detectar Pantalla:** En Windows, presione **Tecla Windows + P** e intente seleccionar la opción **"Ampliar"** o "Duplicar".\n4. Si el monitor dice "No Signal" cambie de entrada (Input/Source) usando los botones físicos del monitor.'
    },
    {
        kb_id: 'KB-204', title: 'Equipos lentos o sobrecargados (Tips rápidos)', category: 'general',
        tags: ['lento', 'rendimiento', 'pc'], author_name: 'Soporte Nivel 1', views: 0, helpful: 0, not_helpful: 0, pinned: false,
        content: '# ¿El computador está muy lento?\n\n1. **Reiniciar, no apagar:** Hay una diferencia. Usar la opción "Reiniciar" de Windows limpia la memoria RAM por completo.\n2. Cierre pestañas innecesarias de Chrome (cada pestaña consume mucha memoria).\n3. Verifique que no haya actualizaciones de Windows pendientes (escriba "Windows Update" en el botón de inicio).\n4. Desconecte dispositivos USB innecesarios.'
    },
    {
        kb_id: 'KB-205', title: 'Voz cortada en Teams o Zoom', category: 'redes',
        tags: ['teams', 'zoom', 'audio', 'internet'], author_name: 'Soporte Nivel 2', views: 0, helpful: 0, not_helpful: 0, pinned: true,
        content: '# Problemas de audio o intermitencia en llamadas\n\nSi le dicen que se escucha cortado o robótico:\n1. **Acérquese al router Wi-Fi** o, preferiblemente, conecte un cable de red directo a su portátil.\n2. **Apague su cámara web:** Esto reduce drásticamente el consumo de red y da prioridad al audio.\n3. **Cierre descargas:** Asegúrese de no estar enviando/recibiendo archivos grandes en ese momento o teniendo múltiples instancias de OneDrive sincronizando.\n4. **Revise su auricular (Diadema):** Asegúrese de que el conector USB/Plug esté bien insertado y que en la configuración de la app de llamadas esté seleccionado el auricular correcto.'
    },
    {
        kb_id: 'KB-206', title: 'VPN - No puedo conectar a recursos de red local', category: 'redes',
        tags: ['vpn', 'red', 'homeoffice', 'conexion'], author_name: 'Soporte Nivel 2', views: 0, helpful: 0, not_helpful: 0, pinned: false,
        content: '# Solución de problemas básicos de VPN para trabajo remoto\n\n1. **Verificar conexión a Internet:** Intente abrir una página web pública. Si no abre, el problema es su WiFi, no la VPN.\n2. **Reiniciar cliente VPN:** Haga clic derecho en el ícono del cliente VPN en la barra de tareas (cerca a la hora) y seleccione Cerrar/Quit. Vuelva a abrirlo.\n3. **Verificar usuario o contraseña:** Asegúrese de que su clave de acceso no haya expirado.\n4. **Error de servidor no encontrado:** Si la VPN conecta pero no puede acceder a las carpetas, abra el explorador de archivos y pegue la IP directa en lugar del nombre del servidor (ej: //192.168.1.10) y consulte con IT.'
    }
];

async function insertAll() {
    for (const art of newArticles) {
        // Check if exists to avoid duplicates
        const { data: existing } = await supabase.from('knowledge_base').select('id').eq('title', art.title);
        if (existing && existing.length > 0) {
            console.log("Already exists:", art.title);
            continue;
        }

        const { error } = await supabase.from('knowledge_base').insert([art]);
        if (error) console.error("Error inserting", art.title, error.message);
        else console.log("Success:", art.title);
    }
}
insertAll();
