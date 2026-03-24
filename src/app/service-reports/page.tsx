'use client';

import React, { useState, useEffect } from 'react';
import {
    Save,
    Calendar,
    Clock,
    User,
    FileText,
    Wrench,
    HardDrive,
    Layers,
    MonitorCheck,
    AlertCircle,
    CheckCircle2,
    Settings,
    MapPin,
    Cpu,
    Laptop
} from 'lucide-react';
import { StaffService, CompanyService, InventoryService, ServiceReportService } from '@/lib/services';

export default function ServiceReports() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modality: 'Soporte Remoto',
        technician: '',
        client: '',
        sede: '',
        user: '',
        assetId: '',
        ticketId: '',
        activities: '',
        maintenancePerformed: false,
        partsChanged: false,
        partsDetails: '',
        capacityUpgraded: false,
        upgradeDetails: '',
        isResolved: 'Si'
    });

    const [staff, setStaff] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
             try {
                 const [staffList, clientList, invList] = await Promise.all([
                     StaffService.getAll(),
                     CompanyService.getAll(),
                     InventoryService.getAll()
                 ]);
                 setStaff(staffList as any[]);
                 setClients(clientList as any[]);
                 setInventory(invList as any[]);
             } catch (err) {
                 console.error("Error loading service report data:", err);
             }
        };
        fetchData();
    }, []);

    const selectedClientObj = clients.find(c => c.name === formData.client || c.id === formData.client);
    const clientSedes = selectedClientObj?.sedes || [];
    const clientEmployees = selectedClientObj?.employees || [];

    // Filter inventory based on selected client and strictly selected user
    const filteredInventory = inventory.filter(inv => {
        // Si no hay usuario seleccionado, no mostrar ningún equipo
        if (!formData.user) return false;

        const itemClient = inv.clientName || inv.company?.name;
        const itemEmployee = inv.assignedEmployee || inv.employee?.name;

        // Validar que pertenezca al cliente correcto
        if (formData.client && itemClient !== (selectedClientObj?.name || formData.client)) return false;
        
        // Mostrar estrictamente el equipo que está asignado a la persona seleccionada
        if (itemEmployee !== formData.user) return false;

        return true;
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as any;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const selectedStaff = staff.find(s => `${s.first_name} ${s.last_name}` === formData.technician);
            const selectedComp = clients.find(c => c.name === formData.client);
            const selectedSede = (selectedComp?.sedes || []).find((s: any) => s.name === formData.sede);
            const selectedEmp = (selectedComp?.employees || []).find((em: any) => em.name === formData.user);

            const payload = {
                report_id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
                date: formData.date,
                time: formData.time,
                modality: formData.modality,
                technician_name: formData.technician,
                technician_id: selectedStaff?.id,
                company_id: selectedComp?.id,
                sede_id: selectedSede?.id,
                employee_id: selectedEmp?.id,
                inventory_id: formData.assetId || null,
                activities: formData.activities,
                maintenance_performed: formData.maintenancePerformed,
                parts_changed: formData.partsChanged,
                parts_details: formData.partsDetails,
                capacity_upgraded: formData.capacityUpgraded,
                upgrade_details: formData.upgradeDetails,
                is_resolved: formData.isResolved
            };

            await ServiceReportService.create(payload);

            // Update inventory if upgrades or parts changes were made
            if (formData.assetId && (formData.partsChanged || formData.capacityUpgraded)) {
                const currentAsset = inventory.find(inv => inv.id === formData.assetId);
                const changes = [];
                if (formData.capacityUpgraded) changes.push(`Upgrade [${formData.date}]: ${formData.upgradeDetails}`);
                if (formData.partsChanged) changes.push(`Cambio Pieza [${formData.date}]: ${formData.partsDetails}`);

                const updatedObservations = (currentAsset?.observations ? currentAsset.observations + ' | ' : '') + changes.join(' | ');
                await InventoryService.update(formData.assetId, { observations: updatedObservations });
            }

            setLoading(false);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setFormData({
                    ...formData,
                    activities: '',
                    maintenancePerformed: false,
                    partsChanged: false,
                    partsDetails: '',
                    capacityUpgraded: false,
                    upgradeDetails: '',
                    isResolved: 'Si'
                });
            }, 2000);
        } catch (err) {
            console.error("Error creating service report:", err);
            alert("Error al guardar en Supabase");
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="success-screen fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <div style={{ background: 'var(--success)', color: 'white', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)' }}>
                    <CheckCircle2 size={40} />
                </div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Reporte Generado</h1>
                <p style={{ color: 'var(--text-muted)' }}>El reporte de servicio técnico ha sido registrado exitosamente.</p>
                <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => setSuccess(false)}>
                    Registrar Nuevo Reporte
                </button>
            </div>
        );
    }

    return (
        <div className="service-reports-page fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Reporte Técnico</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Registro y control de actividades, mantenimientos y cambios físicos.</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="form-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>

                {/* Left Column - Form */}
                <div className="card glass" style={{ gridColumn: 'span 8', padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>
                        <FileText size={20} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.2rem' }}>Información del Servicio</h2>
                    </div>

                    {/* Fila 1 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Técnico Responsable</label>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <select name="technician" value={formData.technician} onChange={handleInputChange} className="form-input" required style={{ paddingLeft: '2.5rem' }}>
                                    <option value="">Seleccione al personal...</option>
                                    {staff.map(s => (
                                        <option key={s.id} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Empresa / Cliente</label>
                            <select name="client" value={formData.client} onChange={(e) => {
                                handleInputChange(e);
                                setFormData(prev => ({ ...prev, sede: '', user: '', assetId: '' }));
                            }} className="form-input" required>
                                <option value="">Seleccione cliente...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Fila 1b: Sede y Usuario (Opcionales dependiendo del cliente) */}
                    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Sede (Opcional)</label>
                            <select name="sede" value={formData.sede} onChange={handleInputChange} className="form-input" disabled={!formData.client || clientSedes.length === 0}>
                                <option value="">Sede Principal</option>
                                {clientSedes.map((s: any) => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Usuario Final (Opcional)</label>
                            <select name="user" value={formData.user} onChange={(e) => {
                                const newUserName = e.target.value;
                                
                                // Filtrar para ver si este usuario tiene 1 solo equipo y autoseleccionarlo
                                let newAssetId = '';
                                const empAssets = inventory.filter(inv => {
                                    const itemClient = inv.clientName || inv.company?.name;
                                    const itemEmployee = inv.assignedEmployee || inv.employee?.name;
                                    if (formData.client && itemClient !== (selectedClientObj?.name || formData.client)) return false;
                                    return itemEmployee === newUserName;
                                });

                                if (newUserName && empAssets.length === 1) {
                                    newAssetId = empAssets[0].id;
                                }

                                setFormData(prev => ({ 
                                    ...prev, 
                                    user: newUserName,
                                    assetId: newAssetId 
                                }));
                            }} className="form-input" disabled={!formData.client || clientEmployees.length === 0}>
                                <option value="">Seleccione usuario...</option>
                                {clientEmployees.map((e: any) => (
                                    <option key={e.id} value={e.name}>{e.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Fila 2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Fecha</label>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="form-input" required style={{ paddingLeft: '2.5rem' }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Hora</label>
                            <div style={{ position: 'relative' }}>
                                <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="form-input" required style={{ paddingLeft: '2.5rem' }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Modalidad</label>
                            <select name="modality" value={formData.modality} onChange={handleInputChange} className="form-input" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                <option value="Soporte Remoto">🎧 Soporte Remoto</option>
                                <option value="Visita Técnica Programada">📅 Visita Técnica Programada</option>
                                <option value="Presencial Emergencia">🚨 Presencial (Emergencia)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Actividades Realizadas</label>
                        <textarea
                            name="activities"
                            value={formData.activities}
                            onChange={handleInputChange}
                            className="form-input"
                            rows={4}
                            placeholder="Describa a detalle todas las actividades, configuraciones o reparaciones ejecutadas durante el servicio..."
                            required
                            style={{ resize: 'none' }}
                        ></textarea>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>
                        <Settings size={20} color="var(--secondary)" />
                        <h2 style={{ fontSize: '1.2rem' }}>Hardware y Estado de la Escala</h2>
                    </div>

                    {/* Switches and conditional toggles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>

                        {/* Equipment Dropdown */}
                        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}><Laptop size={16} /> Equipo Intervenido (Inventario)</label>
                            <select name="assetId" value={formData.assetId} onChange={handleInputChange} className="form-input">
                                <option value="">Seleccione o busque un equipo de inventario...</option>
                                {filteredInventory.map((inv: any) => (
                                    <option key={inv.id} value={inv.id}>{inv.equipment_id} - {inv.brand} {inv.model} {inv.clientName ? `(Cliente: ${inv.clientName})` : ''}</option>
                                ))}
                            </select>
                        </div>

                        {/* Maintenance */}
                        <label className="toggle-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'rgba(0,0,0,0.02)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                            <input type="checkbox" name="maintenancePerformed" checked={formData.maintenancePerformed} onChange={handleInputChange} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><Wrench size={18} color="var(--text-muted)" /> Se realizó mantenimiento preventivo/correctivo al equipo</div>
                        </label>

                        {/* Parts Changed */}
                        <div style={{ background: formData.partsChanged ? 'rgba(245, 158, 11, 0.05)' : 'rgba(0,0,0,0.02)', padding: '10px 15px', borderRadius: '8px', border: formData.partsChanged ? '1px solid var(--warning)' : '1px solid var(--surface-border)', transition: 'all 0.3s' }}>
                            <label className="toggle-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input type="checkbox" name="partsChanged" checked={formData.partsChanged} onChange={handleInputChange} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><Cpu size={18} color="var(--text-muted)" /> Se cambió o reemplazó alguna pieza dañada</div>
                            </label>
                            {formData.partsChanged && (
                                <div className="fade-in" style={{ marginTop: '1rem', paddingLeft: '30px' }}>
                                    <input type="text" name="partsDetails" value={formData.partsDetails} onChange={handleInputChange} className="form-input" placeholder="Especifique qué piezas fueron reemplazadas (Ej. Teclado, Batería, Fuente de poder...)" required />
                                </div>
                            )}
                        </div>

                        {/* Upgrades */}
                        <div style={{ background: formData.capacityUpgraded ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0,0,0,0.02)', padding: '10px 15px', borderRadius: '8px', border: formData.capacityUpgraded ? '1px solid var(--success)' : '1px solid var(--surface-border)', transition: 'all 0.3s' }}>
                            <label className="toggle-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input type="checkbox" name="capacityUpgraded" checked={formData.capacityUpgraded} onChange={handleInputChange} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><Layers size={18} color="var(--text-muted)" /> Se aumentó capacidad o hizo Upgrade (RAM / Disco Duro)</div>
                            </label>
                            {formData.capacityUpgraded && (
                                <div className="fade-in" style={{ marginTop: '1rem', paddingLeft: '30px' }}>
                                    <input type="text" name="upgradeDetails" value={formData.upgradeDetails} onChange={handleInputChange} className="form-input" placeholder="Especifique el Upgrade (Ej. De 8GB a 16GB RAM, o SSD 1TB nuevo)" required />
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right Column - Status */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card glass">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                            <MonitorCheck size={20} color="var(--success)" />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Resolución y Estado</h3>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Por favor indique si la falla reportada o la solicitud del cliente quedó solucionada al 100% o requiere seguimiento adicional.
                        </p>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.875rem', fontWeight: 600 }}>¿Solucionó la falla reportada?</label>
                            <select
                                name="isResolved"
                                value={formData.isResolved}
                                onChange={handleInputChange}
                                className="form-input"
                                style={{
                                    border: '2px solid',
                                    borderColor: formData.isResolved === 'Si' ? 'var(--success)' : formData.isResolved === 'Parcial' ? 'var(--warning)' : 'var(--error)',
                                    fontWeight: 700,
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="Si">✅ Sí, Solucionado (Cerrar caso)</option>
                                <option value="Parcial">⚠️ Solución Parcial (En monitoreo)</option>
                                <option value="No">❌ No Solucionado (Escalar o Reprogramar)</option>
                            </select>
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }} disabled={loading}>
                            {loading ? 'Procesando...' : (
                                <>
                                    <Save size={20} /> Guardar Reporte
                                </>
                            )}
                        </button>
                    </div>

                    <div className="card glass fade-in" style={{ background: 'rgba(37,99,235,0.03)', border: '1px solid var(--primary-glow)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--primary)' }}>
                            <AlertCircle size={18} />
                            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Sincronización</h3>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Al guardar este informe, quedará enlazado en el <strong>historial del equipo</strong> y se notificará automáticamente para los KPIs del dashboard y módulo de reportes globales.
                        </p>
                    </div>
                </div>
            </form>

            <style jsx>{`
                .form-input { width: 100%; padding: 0.8rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); font-family: inherit; font-size: 0.95rem; outline: none; }
                .form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
                .fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
