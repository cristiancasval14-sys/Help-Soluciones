'use client';

import React, { useState, useEffect } from 'react';
import {
    Save,
    ArrowLeft,
    FileText,
    User,
    Zap,
    Laptop,
    HardDrive,
    MapPin,
    Calendar,
    CheckCircle2,
    Monitor,
    Shield,
    Phone,
    Cpu,
    Layers,
    Key,
    AppWindow,
    Box,
    Navigation,
    MapPinned,
    Users,
    ChevronDown,
    Lock,
    Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CompanyService, InventoryService, TicketService } from '@/lib/services';
import { Priority, TicketStatus } from '@/lib/supabase';

export default function NewTicket() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [modality, setModality] = useState('Remoto');
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedSede, setSelectedSede] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const router = useRouter();

    const [formData, setFormData] = useState({
        requester: '',
        contact: '',
        serviceType: 'Incidente',
        description: '',
        anydesk: '',
        priority: 'Medium',
        imageUrl: ''
    });

    useEffect(() => {
        // Load session
        const session = localStorage.getItem('help_session');
        const user = session ? JSON.parse(session) : null;
        setCurrentUser(user);

        const fetchData = async () => {
            try {
                const [clientList, invList] = await Promise.all([
                    CompanyService.getAll(),
                    InventoryService.getAll()
                ]);
                
                setClients(clientList as any[]);
                setInventory(invList as any[]);

                // Auto-select client if user is 'Cliente'
                if (user && user.role === 'Cliente') {
                    const myCompany = clientList.find((c: any) => 
                        c.name?.trim().toLowerCase() === user.assignedTo?.trim().toLowerCase()
                    );
                    if (myCompany) {
                        setSelectedClient(myCompany.id);
                    }
                }
            } catch (err) {
                console.error("Error loading initial data:", err);
            }
        };

        fetchData();
    }, []);

    const isClientRole = currentUser?.role === 'Cliente';
    const assignedCompany = isClientRole ? currentUser?.assignedTo : null;

    const selectedCompanyObj = clients.find(c => c.id === selectedClient);
    const selectedClientName = selectedCompanyObj?.name || assignedCompany || '';
    const clientSedes = selectedCompanyObj?.sedes || [];
    
    // 1. Obtener empleados creados en el módulo de Clientes
    let clientEmployees = selectedCompanyObj?.employees ? [...selectedCompanyObj.employees] : [];


    
    const filteredInventory = inventory.filter(item => {
        // 1. Si NO se ha seleccionado un usuario, NO mostrar NINGÚN equipo
        if (!formData.requester) return false;

        const itemClient = item.company?.name || item.clientName;
        const itemEmployee = item.employee?.name || item.assignedEmployee;
        
        // 2. Comprobar que pertenece al cliente
        if (selectedClient && itemClient !== selectedClientName) return false;
        
        // 3. Comprobar estrictamente que está asignado a la persona seleccionada
        if (itemEmployee !== formData.requester) return false;
        
        return true;
    });

    const getLocationCoords = () => {
        if (selectedSede && clientSedes.length > 0) {
            const sede = clientSedes.find((s: any) => s.id === selectedSede);
            if (sede) return { lat: sede.lat, lng: sede.lng, name: sede.name };
        }
        return { lat: selectedCompanyObj?.lat || 'N/A', lng: selectedCompanyObj?.lng || 'N/A', name: 'Sede Principal' };
    };

    const handleAssetChange = (assetId: string) => {
        const asset = inventory.find(a => a.id === assetId || a.uuid === assetId);
        setSelectedAsset(asset || null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Consume memory lightly

                    setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Generar ID consecutivo por empresa
            const allTickets = await TicketService.getAll();
            const companyTickets = allTickets.filter((t: any) => t.company_id === selectedClient);
            const clientPrefix = selectedCompanyObj?.name?.substring(0, 3).toUpperCase() || 'EMP';
            const prefix = `TIC-${clientPrefix}`;
            
            let maxNum = 0;
            companyTickets.forEach((t: any) => {
                const eqId = t.id || '';
                if (eqId.toUpperCase().startsWith(prefix.toUpperCase() + '-')) {
                    const parts = eqId.split('-');
                    const numStr = parts[parts.length - 1];
                    // Ignorar tickets viejos con ID aleatorio de 5 dígitos (ej. TIC-82194)
                    if (numStr && numStr.length <= 4) {
                        const num = parseInt(numStr, 10);
                        if (!isNaN(num) && num > maxNum) {
                            maxNum = num;
                        }
                    }
                }
            });
            
            const nextNum = (maxNum + 1).toString().padStart(2, '0');
            const newTicketId = `${prefix}-${nextNum}`;

            const locationCoords = getLocationCoords();
            const newTicket = {
                id: newTicketId,
                company_id: selectedClient,
                requester_name: formData.requester,
                type: formData.serviceType,
                priority: (formData.priority === 'Low' ? 'Baja' : formData.priority === 'Medium' ? 'Media' : formData.priority === 'High' ? 'Alta' : 'Crítica') as Priority,
                status: 'Nuevo' as TicketStatus,
                date: new Date().toISOString().split('T')[0],
                // Como Supabase aún no tiene columnas para estos campos en la tabla tickets, los guardamos en tech_notes para no perderlos
                tech_notes: `📞 Contacto: ${formData.contact}\n📍 Modalidad: ${modality}${modality === 'Remoto' ? ' (AnyDesk: ' + formData.anydesk + ')' : ''}\n💻 Equipo: ${selectedAsset?.equipment_id || 'N/A'}\n📝 Descripción:\n${formData.description}`,
                image_url: formData.imageUrl || null
            };

            await TicketService.create(newTicket as any);
            
            setLoading(false);
            setSuccess(true);
            setTimeout(() => router.push('/tickets'), 1500);
        } catch (err: any) {
            console.error("Error creating ticket:", err);
            alert("Error de Supabase: " + (err.message || "Error desconocido al guardar"));
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="success-screen fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <div style={{ background: 'var(--success)', color: 'white', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)' }}>
                    <CheckCircle2 size={40} />
                </div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Ticket Registrado</h1>
                <p style={{ color: 'var(--text-muted)' }}>El incidente ha sido guardado exitosamente.</p>
                <p style={{ marginTop: '2rem', fontSize: '0.9rem' }}>Redirigiendo al listado...</p>
            </div>
        );
    }

    return (
        <div className="new-ticket-page fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/tickets" className="btn glass" style={{ padding: '0.6rem' }}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>Nuevo Ticket de Soporte</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {isClientRole ? `Solicitud para ${currentUser?.assignedTo}` : 'Registro de incidente enlazado a inventario'}
                    </p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="form-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
                <div className="card glass" style={{ gridColumn: 'span 8', padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>
                        <FileText size={20} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.1rem' }}>Detalles de la Solicitud</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Cliente</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    className="form-input"
                                    value={selectedClient}
                                    onChange={(e) => { setSelectedClient(e.target.value); setSelectedAsset(null); setSelectedSede(''); setFormData(prev => ({ ...prev, requester: '', contact: '' })); }}
                                    required
                                    disabled={isClientRole}
                                    style={isClientRole ? { background: 'var(--surface-alt)', cursor: 'not-allowed', paddingLeft: '2.5rem' } : {}}
                                >
                                    <option value="">Seleccione Cliente...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                {isClientRole && <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />}
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Sede</label>
                            {selectedClient && clientSedes.length > 0 ? (
                                <select
                                    className="form-input"
                                    value={selectedSede}
                                    onChange={(e) => setSelectedSede(e.target.value)}
                                >
                                    <option value="">Sede Principal</option>
                                    {clientSedes.map((s: any) => (
                                        <option key={s.id} value={s.id}>
                                            📍 {s.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <select className="form-input" disabled>
                                    <option>{selectedClient ? 'Sede Principal' : 'Seleccione un cliente'}</option>
                                </select>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Usuario Solicitante</label>
                            {selectedClient && clientEmployees.length > 0 ? (
                                <select
                                    className="form-input"
                                    value={formData.requester}
                                    onChange={(e) => {
                                        const empName = e.target.value;
                                        const emp = clientEmployees.find((em: any) => em.name === empName);
                                        setFormData(prev => ({
                                            ...prev,
                                            requester: empName,
                                            contact: emp?.phone || prev.contact
                                        }));

                                        // Auto-seleccionar el equipo si el empleado tiene uno asignado
                                        const empAssets = inventory.filter(item => (item.employee?.name || item.assignedEmployee) === empName);
                                        if (empAssets.length === 1) {
                                            setSelectedAsset(empAssets[0]);
                                        } else {
                                            setSelectedAsset(null); // Limpiar si tiene varios o ninguno
                                        }
                                    }}
                                    required
                                >
                                    <option value="">Seleccione usuario...</option>
                                    {clientEmployees.map((emp: any) => (
                                        <option key={emp.id} value={emp.name}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        name="requester"
                                        value={formData.requester}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Nombre del solicitante"
                                        autoComplete="off"
                                        required
                                        style={{ paddingLeft: '2.5rem' }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Teléfono de Contacto</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="tel"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Ej: 300 123 4567"
                                    required
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Tipo de Servicio</label>
                            <select name="serviceType" value={formData.serviceType} onChange={handleInputChange} className="form-input">
                                <option value="Incidente">Incidente (Falla)</option>
                                <option value="Solicitud">Solicitud (Requerimiento)</option>
                                <option value="Mantenimiento">Mantenimiento</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Modalidad</label>
                            <select className="form-input" value={modality} onChange={(e) => setModality(e.target.value)}>
                                <option value="Remoto">Remoto</option>
                                <option value="Presencial">Presencial</option>
                                <option value="Cotización">Cotización de Insumos / Servicios</option>
                            </select>
                        </div>
                    </div>

                    {modality === 'Remoto' && (
                        <div className="form-group fade-in" style={{ marginBottom: '1.5rem', background: 'var(--primary-glow)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>
                                <Monitor size={18} /> ID de AnyDesk
                            </label>
                            <input type="text" name="anydesk" value={formData.anydesk} onChange={handleInputChange} className="form-input" placeholder="Ej: 123 456 789" required={modality === 'Remoto'} />
                        </div>
                    )}

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Descripción del Problema</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} className="form-input" rows={4} placeholder="Describa el problema detalladamente..." required style={{ resize: 'none' }}></textarea>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                            <ImageIcon size={18} color="var(--primary)" /> Adjuntar Imagen (Opcional)
                        </label>
                        <div style={{ border: '1px dashed var(--surface-border)', padding: '1rem', borderRadius: '8px', textAlign: 'center', background: 'var(--surface-alt)' }}>
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'block', width: '100%', fontSize: '0.85rem' }} />
                            {formData.imageUrl && (
                                <img src={formData.imageUrl} alt="Vista previa" style={{ marginTop: '1rem', maxHeight: '150px', borderRadius: '8px', border: '1px solid var(--surface-border)' }} />
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card glass">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                            <Zap size={20} color="var(--warning)" />
                            <h3 style={{ fontSize: '1rem' }}>Prioridad</h3>
                        </div>
                        <select name="priority" value={formData.priority} onChange={handleInputChange} className="form-input" style={{ border: '2px solid var(--primary)', fontWeight: 700 }}>
                            <option value="Low">Baja (Low)</option>
                            <option value="Medium">Media (Medium)</option>
                            <option value="High">Alta (High)</option>
                            <option value="Critical">Crítica (Critical)</option>
                        </select>
                    </div>

                    <div className="card glass">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                            <Laptop size={20} color="var(--info)" />
                            <h3 style={{ fontSize: '1rem' }}>Equipo Asociado</h3>
                        </div>
                        <select className="form-input" value={selectedAsset?.id || ''} onChange={(e) => handleAssetChange(e.target.value)}>
                            <option value="">Seleccionar equipo...</option>
                            {filteredInventory.map(item => (
                                <option key={item.id} value={item.id}>{item.equipment_id} - {item.brand} {item.model}</option>
                            ))}
                        </select>

                        {selectedAsset && (
                            <div className="asset-details fade-in" style={{ marginTop: '1rem', fontSize: '0.8rem', padding: '1rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '8px', border: '1px solid var(--primary-glow)' }}>
                                <p style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>Especificaciones:</p>
                                <p><strong>CPU:</strong> {selectedAsset.processor}</p>
                                <p><strong>RAM:</strong> {selectedAsset.ram}</p>
                                <p><strong>Disco:</strong> {selectedAsset.storage}</p>
                                <p><strong>Serial:</strong> {selectedAsset.serial}</p>
                            </div>
                        )}
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }} disabled={loading}>
                        {loading ? 'Procesando...' : <><Save size={20} /> Guardar Ticket</>}
                    </button>
                </div>
            </form>

            <style jsx>{`
                .form-input { width: 100%; padding: 0.8rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); font-family: inherit; font-size: 0.95rem; outline: none; }
                .fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .var(--surface-alt) { background: rgba(0,0,0,0.02); }
            `}</style>
        </div>
    );
}
