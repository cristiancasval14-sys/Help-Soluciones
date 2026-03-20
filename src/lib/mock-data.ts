
export const MOCK_USERS = [
    { 
        id: '1', 
        username: 'admin', 
        password: '123', 
        role: 'Administrador', 
        assignedTo: 'Admin Central', 
        type: 'Personal', 
        status: 'Activo', 
        allowedModules: ['Dashboard', 'Tickets', 'Clientes', 'Inventario', 'Staff', 'Usuarios', 'Reportes'] 
    },
    { 
        id: 'tech-1', 
        username: 'tech01', 
        password: '123', 
        role: 'Técnico', 
        assignedTo: 'Diana Martinez', 
        type: 'Personal', 
        status: 'Activo', 
        allowedModules: ['Dashboard', 'Tickets', 'Inventario'] 
    },
    { 
        id: 'tech-2', 
        username: 'tech02', 
        password: '123', 
        role: 'Técnico', 
        assignedTo: 'Ricardo Sanchez', 
        type: 'Personal', 
        status: 'Activo', 
        allowedModules: ['Dashboard', 'Tickets', 'Inventario'] 
    },
    { 
        id: 'client-1', 
        username: 'coca', 
        password: '123', 
        role: 'Cliente', 
        assignedTo: 'Coca-Cola Latin', 
        type: 'Empresa', 
        status: 'Activo', 
        allowedModules: ['Dashboard', 'Tickets', 'Clientes'] 
    }
];

export const MOCK_COMPANIES = [
    {
        id: 'co-1',
        name: 'Coca-Cola Latin',
        nit: '890.123.456-7',
        lat: '6.2442',
        lng: '-75.5812',
        email: 'soporte@cocacola.co',
        employees: [
            { id: 'emp-1', name: 'Carlos Gomez', email: 'carlos.gomez@cocacola.co', phone: '3001234567' },
            { id: 'emp-2', name: 'Elena Ruiz', email: 'elena.ruiz@cocacola.co', phone: '3007654321' }
        ],
        sedes: [
            { id: 'sede-1', name: 'Planta Principal - Medellín', lat: '6.2442', lng: '-75.5812' },
            { id: 'sede-2', name: 'Centro Logístico - Itagüí', lat: '6.1842', lng: '-75.5912' }
        ]
    },
    {
        id: 'co-2',
        name: 'Bancolombia',
        nit: '860.003.020-1',
        lat: '6.2308',
        lng: '-75.5670',
        email: 'infraestructura@bancolombia.com.co',
        employees: [
            { id: 'emp-3', name: 'Isabella Rios', email: 'isabella.rios@bancolombia.com', phone: '3104445566' }
        ],
        sedes: [
            { id: 'sede-3', name: 'Edificio Inteligente', lat: '6.2308', lng: '-75.5670' }
        ]
    },
    {
        id: 'co-3',
        name: 'Nutresa',
        nit: '890.900.035-2',
        lat: '6.2518',
        lng: '-75.5636',
        email: 'ti@nutresa.com',
        employees: [
            { id: 'emp-4', name: 'Maria Angel', email: 'm.angel@nutresa.com', phone: '3208889900' }
        ],
        sedes: [
            { id: 'sede-4', name: 'Oficina Central', lat: '6.2518', lng: '-75.5636' }
        ]
    }
];

export const MOCK_TICKETS = [
    { id: 'TICK-1001', client: 'Coca-Cola Latin', requester: 'Carlos Gomez', type: 'Incidente', priority: 'Alta', status: 'En Proceso', date: '2026-03-10', assignedTo: 'Diana Martinez', techNotes: 'Revisión periódica de red.' },
    { id: 'TICK-1002', client: 'Bancolombia', requester: 'Isabella Rios', type: 'Solicitud', priority: 'Crítica', status: 'Nuevo', date: '2026-03-12' },
    { id: 'TICK-1003', client: 'Davivienda', requester: 'Jorge Perez', type: 'Incidente', priority: 'Media', status: 'Asignado', date: '2026-03-05', assignedTo: 'Ricardo Sanchez' },
    { id: 'TICK-1004', client: 'Nutresa', requester: 'Maria Angel', type: 'Soporte', priority: 'Baja', status: 'Resuelto', date: '2026-03-04' },
    { id: 'TICK-1005', client: 'Sura', requester: 'Andres Castro', type: 'Mantenimiento', priority: 'Media', status: 'Terminado', date: '2026-03-01', assignedTo: 'Diana Martinez' }
];


export const MOCK_STAFF = [
    { id: '1', firstName: 'Diana', lastName: 'Martinez', role: 'Ingeniero', photo: '', vehicle: 'Carro', plate: 'ABC-123', vehicleBrand: 'Chevrolet', vehicleModel: 'Spark', soatExpiry: '2026-08-15', tecnoExpiry: '2026-11-20' },
    { id: '2', firstName: 'Ricardo', lastName: 'Sanchez', role: 'Técnico', photo: '', vehicle: 'Moto', plate: 'XYZ-987', vehicleBrand: 'Honda', vehicleModel: 'CBR 250', soatExpiry: '2026-04-01', tecnoExpiry: '2026-03-25' },
];

export const MOCK_INVENTORY = [
    {
        uuid: 'inv-1',
        id: 'EQU-001',
        clientName: 'Coca-Cola Latin',
        assignedEmployee: 'Carlos Gomez',
        locationType: 'Cliente',
        brand: 'Dell',
        model: 'OptiPlex 7000',
        serial: 'S-DELL-882',
        storage: '512GB SSD',
        ram: '16GB DDR4',
        processor: 'Intel Core i7-12700',
        status: 'Activo',
        licenses: [
            { id: 'l1', name: 'Microsoft Office 365', licenseKey: 'XXXXX-XXXXX-XXXXX', type: 'Suscripción', expiryDate: '2026-12-31', seats: 1 }
        ],
        programs: [
            { id: 'p1', name: 'Google Chrome', version: '120.0', publisher: 'Google LLC' },
            { id: 'p2', name: 'Microsoft Teams', version: '24.1', publisher: 'Microsoft' }
        ]
    },
    {
        uuid: 'inv-2',
        id: 'EQU-002',
        clientName: 'Bancolombia',
        assignedEmployee: 'Isabella Rios',
        locationType: 'Cliente',
        brand: 'HP',
        model: 'ProDesk 600',
        serial: 'S-HP-3321',
        storage: '256GB SSD',
        ram: '8GB DDR4',
        processor: 'Intel Core i5-11500',
        status: 'Activo',
        licenses: [],
        programs: []
    }
];

export const MOCK_KNOWLEDGE = [
    { id: 'KB-001', title: 'Configuración VPN Corporativa', category: 'Networking', author: 'Diana Martinez', date: '2026-01-15' },
    { id: 'KB-002', title: 'Solución error impresión térmica', category: 'Hardware', author: 'Ricardo Sanchez', date: '2026-02-10' }
];
