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
    Laptop,
    Database,
    Trash2,
    X
} from 'lucide-react';
import { StaffService, CompanyService, InventoryService, ServiceReportService } from '@/lib/services';
import { useSearchParams } from 'next/navigation';

export default function ServiceReports() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [reports, setReports] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const searchParams = useSearchParams();

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
        activitySummary: '',
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

    const [ticketContext, setTicketContext] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
             const session = localStorage.getItem('help_session');
             const user = session ? JSON.parse(session) : null;
             setIsAdmin(user?.role === 'Administrador');

             try {
                 const [staffList, clientList, invList, reportsList] = await Promise.all([
                     StaffService.getAll(),
                     CompanyService.getAll(),
                     InventoryService.getAll(),
                     ServiceReportService.getAll()
                 ]);
                 setStaff(staffList as any[]);
                 setClients(clientList as any[]);
                 setInventory(invList as any[]);

                 // Enrich reports with joined data from already-loaded arrays
                 const enriched = (reportsList as any[]).map(r => {
                     const company = (clientList as any[]).find(c => c.id === r.company_id);
                     const invItem = (invList as any[]).find(i => i.id === r.inventory_id);
                     let employee: any = null;
                     let sede: any = null;
                     if (company) {
                         employee = (company.employees || []).find((e: any) => e.id === r.employee_id);
                         sede = (company.sedes || []).find((s: any) => s.id === r.sede_id);
                     }
                     return {
                         ...r,
                         company: company
                             ? { id: company.id, name: company.name }
                             : (r.company_name ? { name: r.company_name } : null),
                         employee: employee
                             ? { id: employee.id, name: employee.name }
                             : (r.employee_name ? { name: r.employee_name } : null),
                         sede: sede
                             ? { id: sede.id, name: sede.name }
                             : (r.sede_name ? { name: r.sede_name } : null),
                         inventory: invItem ? {
                             id: invItem.id,
                             equipment_id: invItem.equipment_id,
                             brand: invItem.brand,
                             model: invItem.model,
                         } : null,
                         technician_photo: (staffList as any[]).find(s => s.id === r.technician_id || `${s.first_name} ${s.last_name}` === r.technician_name)?.photo
                     };
                 });
                 setReports(enriched);

                 // Pre-fill from URL params
                 const tId = searchParams.get('ticketId');
                 const cName = searchParams.get('clientId');
                 const uName = searchParams.get('requester');
                 const techName = searchParams.get('techName');
                 const description = searchParams.get('description');
                 const priority = searchParams.get('priority');
                 const category = searchParams.get('category');
                 const techNotes = searchParams.get('techNotes');
                 
                 if (tId || cName || uName || techName) {
                    // Extract equipment ID from tech notes if present
                    let extractedAssetId = '';
                    if (techNotes && techNotes.includes('💻 Equipo:')) {
                       const equipmentIdStr = techNotes.split('💻 Equipo:')[1]?.split('\n')[0]?.trim();
                       if (equipmentIdStr) {
                          const foundAsset = invList.find((i: any) => i.equipment_id === equipmentIdStr);
                          if (foundAsset) extractedAssetId = foundAsset.id;
                       }
                    }

                    // Build activities text from ticket info
                    let activitiesText = '';
                    if (description) {
                        activitiesText = `Descripción del ticket: ${description}`;
                    }
                    if (techNotes) {
                        activitiesText += activitiesText ? `\n\nNotas del técnico: ${techNotes}` : `Notas del técnico: ${techNotes}`;
                    }

                    setFormData(prev => ({
                        ...prev,
                        ticketId: tId || '',
                        client: cName || '',
                        user: uName || '',
                        technician: techName || '',
                        activities: activitiesText,
                        activitySummary: '',
                        assetId: extractedAssetId || prev.assetId // Auto-select the equipment!
                    }));

                    // Store ticket context for the info banner
                    if (tId) {
                        setTicketContext({
                            id: tId,
                            client: cName,
                            requester: uName,
                            technician: techName,
                            description,
                            priority,
                            category,
                            techNotes,
                        });
                    }
                 }

                 // View specific report from URL
                 const viewId = searchParams.get('view');
                 if (viewId && reportsList.length > 0) {
                     const reportToView = (reportsList as any[]).find(r => r.id === viewId);
                     if (reportToView) {
                         setSelectedReport(reportToView);
                         setShowDetailModal(true);
                     }
                 }
             } catch (err) {
                 console.error("Error loading service report data:", err);
             }
        };
        fetchData();
    }, [searchParams]);

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

    const handleDeleteReport = async (id: string, reportId: string) => {
        if (!confirm(`¿Estas seguro de eliminar el reporte ${reportId}? Esta accion no se puede deshacer.`)) return;
        try {
            await ServiceReportService.delete(id);
            setReports(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error('Error eliminando reporte:', err);
            alert('Error al eliminar el reporte. Intente nuevamente.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const selectedStaff = staff.find(s => `${s.first_name} ${s.last_name}` === formData.technician);
            const selectedComp = clients.find(c => c.name === formData.client);
            const selectedSede = (selectedComp?.sedes || []).find((s: any) => s.name === formData.sede);
            const selectedEmp = (selectedComp?.employees || []).find((em: any) => em.name === formData.user);

            // Combine ticket context + technician's own activity summary
            const fullActivities = [
                formData.activities,
                formData.activitySummary ? `\n\n--- ACTIVIDAD REALIZADA ---\n${formData.activitySummary}` : ''
            ].filter(Boolean).join('');

            const payload = {
                report_id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
                date: formData.date,
                time: formData.time,
                modality: formData.modality,
                technician_name: formData.technician,
                technician_id: selectedStaff?.id,
                company_id: selectedComp?.id,
                company_name: selectedComp?.name || formData.client || null,
                sede_id: selectedSede?.id,
                sede_name: selectedSede?.name || formData.sede || null,
                employee_id: selectedEmp?.id,
                employee_name: selectedEmp?.name || formData.user || null,
                inventory_id: formData.assetId || null,
                ticket_id: formData.ticketId || null,
                activities: fullActivities,
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

            {/* Ticket context banner */}
            {ticketContext && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(16,185,129,0.08) 100%)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700 }}>
                        <FileText size={18} />
                        <span>Ticket #{ticketContext.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div style={{ height: '20px', width: '1px', background: 'var(--surface-border)' }} />
                    {ticketContext.client && (
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            🏢 <strong>{ticketContext.client}</strong>
                        </span>
                    )}
                    {ticketContext.requester && (
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            👤 <strong>{ticketContext.requester}</strong>
                        </span>
                    )}
                    {ticketContext.priority && (
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 10px',
                            borderRadius: '99px',
                            background: ticketContext.priority === 'Crítica' ? 'rgba(239,68,68,0.12)' : ticketContext.priority === 'Alta' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)',
                            color: ticketContext.priority === 'Crítica' ? '#ef4444' : ticketContext.priority === 'Alta' ? '#f59e0b' : 'var(--primary)',
                        }}>
                            {ticketContext.priority}
                        </span>
                    )}
                    {ticketContext.category && (
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>📂 {ticketContext.category}</span>
                    )}
                    {ticketContext.description && (
                        <p style={{ width: '100%', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, paddingTop: '0.5rem', borderTop: '1px solid rgba(59,130,246,0.15)' }}>
                            <strong>Descripción:</strong> {ticketContext.description}
                        </p>
                    )}
                </div>
            )}

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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Ticket Relacionado</label>
                            <div style={{ position: 'relative' }}>
                                <FileText size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" name="ticketId" value={formData.ticketId} onChange={handleInputChange} className="form-input" placeholder="Opcional..." style={{ paddingLeft: '2.5rem', fontWeight: 700, color: 'var(--primary)' }} />
                            </div>
                        </div>
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
                            <select name="modality" value={formData.modality} onChange={handleInputChange} className="form-input" style={{ fontWeight: 600, color: 'var(--primary)', padding: '0.8rem 0.5rem' }}>
                                <option value="Soporte Remoto">🎧 Remoto</option>
                                <option value="Visita Técnica Programada">📅 Visita</option>
                                <option value="Presencial Emergencia">🚨 Emergencia</option>
                            </select>
                        </div>
                    </div>

                    {/* Ticket Context (read-only if came from ticket) */}
                    {ticketContext && formData.activities ? (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                <FileText size={15} /> Descripción del Ticket (referencia)
                            </label>
                            <div style={{
                                background: 'rgba(59,130,246,0.04)',
                                border: '1px solid rgba(59,130,246,0.2)',
                                borderRadius: '10px',
                                padding: '1rem 1.2rem',
                                fontSize: '0.9rem',
                                color: 'var(--text-muted)',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                minHeight: '70px'
                            }}>
                                {formData.activities}
                            </div>
                        </div>
                    ) : (
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Contexto / Descripción del Problema</label>
                            <textarea
                                name="activities"
                                value={formData.activities}
                                onChange={handleInputChange}
                                className="form-input"
                                rows={3}
                                placeholder="Descripción del problema o motivo del servicio..."
                                style={{ resize: 'none' }}
                            ></textarea>
                        </div>
                    )}

                    {/* Activity Performed - main field */}
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>
                            <Wrench size={15} /> Actividad Realizada por el Técnico <span style={{ color: 'var(--error)', marginLeft: '2px' }}>*</span>
                        </label>
                        <textarea
                            name="activitySummary"
                            value={formData.activitySummary}
                            onChange={handleInputChange}
                            className="form-input"
                            rows={5}
                            placeholder="Describa en detalle lo que realizó: configuraciones, diagnósticos, reparaciones, instalaciones de software, ajustes de red, etc..."
                            required
                            style={{ resize: 'vertical', borderColor: formData.activitySummary ? 'var(--primary)' : undefined, boxShadow: formData.activitySummary ? '0 0 0 3px var(--primary-glow)' : undefined }}
                        ></textarea>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {formData.activitySummary.length} caracteres · Use este campo para documentar todo lo ejecutado durante la visita o soporte.
                        </p>
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

                {/* Right Column - Status + Equipment Info */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Equipment Info Card */}
                    {(() => {
                        const selectedAsset = inventory.find(inv => inv.id === formData.assetId);
                        return (
                            <div className="card glass" style={{
                                border: selectedAsset ? '1px solid rgba(99,102,241,0.3)' : '1px dashed var(--surface-border)',
                                background: selectedAsset ? 'rgba(99,102,241,0.03)' : undefined,
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: selectedAsset ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Laptop size={17} color={selectedAsset ? 'var(--primary)' : 'var(--text-muted)'} />
                                    </div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: selectedAsset ? 'var(--primary)' : 'var(--text-muted)' }}>Equipo del Ticket</h3>
                                </div>

                                {!selectedAsset ? (
                                    <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
                                        <Laptop size={36} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            Seleccione un usuario y luego un equipo del inventario para ver su información.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="fade-in">
                                        {/* Badge */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '3px 10px', borderRadius: '6px' }}>
                                                {selectedAsset.equipment_id}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px',
                                                background: selectedAsset.status === 'Activo' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                                color: selectedAsset.status === 'Activo' ? '#10b981' : '#f59e0b' }}>
                                                ● {selectedAsset.status}
                                            </span>
                                        </div>

                                        {/* Model */}
                                        <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
                                            {selectedAsset.brand} {selectedAsset.model}
                                        </p>
                                        {selectedAsset.clientName && (
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                                🏢 {selectedAsset.clientName}
                                            </p>
                                        )}

                                        {/* Specs grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            {[
                                                { icon: <Cpu size={13}/>, label: 'CPU', val: selectedAsset.processor || selectedAsset.cpu },
                                                { icon: <Layers size={13}/>, label: 'RAM', val: selectedAsset.ram },
                                                { icon: <HardDrive size={13}/>, label: 'Disco', val: selectedAsset.storage },
                                                { icon: <MonitorCheck size={13}/>, label: 'Serial', val: selectedAsset.serial },
                                            ].map(spec => (
                                                <div key={spec.label} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '8px', padding: '0.5rem 0.7rem', border: '1px solid var(--surface-border)' }}>
                                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase' }}>
                                                        {spec.icon} {spec.label}
                                                    </p>
                                                    <p style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={spec.val || 'N/A'}>
                                                        {spec.val || 'N/A'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Licenses warning */}
                                        {selectedAsset.licenses?.length > 0 && (
                                            <div style={{ marginTop: '0.8rem', padding: '0.5rem 0.8rem', borderRadius: '8px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                                                🔑 {selectedAsset.licenses.length} licencia{selectedAsset.licenses.length !== 1 ? 's' : ''} registrada{selectedAsset.licenses.length !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Resolution Card */}
                    <div className="card glass">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                            <MonitorCheck size={20} color="var(--success)" />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Resolución y Estado</h3>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Indique si la falla quedó solucionada al 100% o requiere seguimiento.
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

                    <div className="card glass" style={{ background: 'rgba(37,99,235,0.03)', border: '1px solid var(--primary-glow)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--primary)' }}>
                            <AlertCircle size={18} />
                            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Sincronización</h3>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Al guardar este informe, quedará enlazado en el <strong>historial del equipo</strong> en el inventario.
                        </p>
                    </div>
                </div>
            </form>

            {!searchParams.get('ticketId') && isAdmin && (
                <div className="reports-summary fade-in" style={{ marginTop: '4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
                        <Database size={24} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.5rem' }}>Resumen de Reportes Técnicos (Administrador)</h2>
                    </div>

                    <div className="table-container glass" style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem' }}>ID Reporte</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem' }}>Ticket</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem' }}>Fecha</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem' }}>Cliente</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem' }}>Técnico</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem' }}>Estado</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay reportes registrados aún.</td>
                                    </tr>
                                ) : (
                                    reports.map(report => (
                                        <tr key={report.id} style={{ borderBottom: '1px solid var(--surface-border)', transition: '0.2s' }} className="report-row">
                                            <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{report.report_id}</td>
                                            <td style={{ padding: '1rem', fontWeight: 600 }}>{report.ticket_id || '---'}</td>
                                            <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{report.date}</td>
                                            <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{report.company?.name || '---'}</td>
                                            <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{report.technician_name}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className={`badge-res badge-${report.is_resolved === 'Si' ? 'success' : report.is_resolved === 'Parcial' ? 'warning' : 'error'}`}>
                                                    {report.is_resolved === 'Si' ? 'Resuelto' : report.is_resolved === 'Parcial' ? 'Seguimiento' : 'No Resuelto'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                    <button 
                                                        className="btn-icon" 
                                                        title="Ver detalles"
                                                        onClick={() => {
                                                            setSelectedReport(report);
                                                            setShowDetailModal(true);
                                                        }}
                                                    >
                                                        <MonitorCheck size={18} />
                                                    </button>
                                                    <button 
                                                        className="btn-icon btn-icon-danger" 
                                                        title="Eliminar reporte"
                                                        onClick={() => handleDeleteReport(report.id, report.report_id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detailed Report Modal */}
            {showDetailModal && selectedReport && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="modal-card print-container" style={{ width: '850px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: '0', borderRadius: '24px', background: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', position: 'relative' }}>
                        <div className="no-print" style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 20, display: 'flex', gap: '8px' }}>
                             <button className="btn btn-primary" onClick={() => window.print()} style={{ borderRadius: '10px' }}><Save size={18} /> Imprimir</button>
                             <button className="icon-btn" onClick={() => setShowDetailModal(false)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div id="printable-report" style={{ padding: '3.5rem' }}>
                            {/* Header: Report & Ticket IDs */}
                            <header style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#94a3b8', margin: 0 }}>Reporte: {selectedReport.report_id}</h1>
                                    <p style={{ fontSize: '1rem', color: '#cbd5e1', margin: '4px 0 0 0', fontWeight: 600 }}>Ticket: {selectedReport.ticket_id || 'Servicio Directo'}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <img src="/logo.png" alt="Help Soluciones" style={{ height: '50px', opacity: 0.8 }} />
                                </div>
                            </header>

                            {/* Summary Stats Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', marginBottom: '4rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2.5rem' }}>
                                <div style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '1.2rem' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '0.05em' }}>FECHA DEL SERVICIO</p>
                                    <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>{selectedReport.date}</p>
                                </div>
                                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                        {selectedReport.technician_photo ? (
                                            <img src={selectedReport.technician_photo} alt="Tech" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                                <User size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '0.05em' }}>TÉCNICO</p>
                                        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{selectedReport.technician_name}</p>
                                    </div>
                                </div>
                                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.2rem' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '0.05em' }}>CLIENTE</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{selectedReport.company?.name || selectedReport.company_name || 'Particular'}</p>
                                </div>
                                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.2rem' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '0.05em' }}>ESTADO</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{selectedReport.is_resolved === 'Si' ? '✅ RESUELTO' : '⚠️ SEGUIMIENTO'}</p>
                                </div>
                            </div>

                            {/* Dual Column Layout */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '3.5rem' }}>
                                {/* Left Column: User & Hardware */}
                                <div>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                                        <User size={18} /> Detalles del Usuario
                                    </h3>
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', marginBottom: '3rem', background: '#f8fafc' }}>
                                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>Usuario Final: </span>
                                            <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>{selectedReport.employee?.name || selectedReport.employee_name || 'N/A'}</span>
                                        </div>
                                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>Sede: </span>
                                            <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>{selectedReport.sede?.name || selectedReport.sede_name || 'Principal'}</span>
                                        </div>
                                        <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>Modalidad: </span>
                                            <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>{selectedReport.modality}</span>
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                                        <Laptop size={18} /> Información de Hardware
                                    </h3>
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: '#f8fafc' }}>
                                        <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                                            <p style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Equipo Asignado</span>
                                                <span style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 700 }}>
                                                    {selectedReport.inventory
                                                        ? `${selectedReport.inventory.equipment_id} — ${selectedReport.inventory.brand} ${selectedReport.inventory.model}`
                                                        : selectedReport.inventory_id || 'General / Soporte Periférico'
                                                    }
                                                </span>
                                            </p>
                                        </div>
                                        <div style={{ padding: '1.25rem' }}>
                                            <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>Mantenimiento: </span>
                                                <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700 }}>{selectedReport.maintenance_performed ? '✓ REALIZADO' : 'NO APLICA'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Activities */}
                                <div>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                                        <Clock size={18} /> Actividades Realizadas
                                    </h3>
                                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '2.5rem', minHeight: '350px', fontSize: '1rem', color: '#334155', lineHeight: 2 }}>
                                        <div style={{ whiteSpace: 'pre-wrap' }}>
                                            {selectedReport.activities.split('\n').map((line: string, i: number) => {
                                                let processed = line;
                                                const lower = line.toLowerCase();
                                                if (lower.includes('contacto')) processed = '📞 ' + line;
                                                else if (lower.includes('ubicación') || lower.includes('sede')) processed = '📍 ' + line;
                                                else if (lower.includes('equipo')) processed = '💻 ' + line;
                                                else if (lower.includes('acción') || lower.includes('realizó')) processed = '⚡ ' + line;
                                                else if (line.trim()) processed = '• ' + line;
                                                
                                                return <div key={i} style={{ marginBottom: '0.75rem' }}>{processed}</div>;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Signature Spacer */}
                            <footer style={{ marginTop: '6rem', paddingTop: '2.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                    <p style={{ margin: 0 }}>© 2026 Help Soluciones Informáticas S.A.S</p>
                                    <p style={{ margin: 0 }}>Sistema de Gestión de Soporte Técnico</p>
                                </div>
                                <div style={{ width: '250px', borderTop: '1px solid #cbd5e1', textAlign: 'center', paddingTop: '12px' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', margin: 0 }}>Firma Responsable / Técnico</p>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>CC: ________________________</p>
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #printable-report, #printable-report * { visibility: visible !important; }
                    #printable-report { 
                        position: fixed !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 100% !important; 
                        height: 100% !important; 
                        padding: 1.5cm !important;
                        margin: 0 !important;
                        background: white !important;
                    }
                    .modal-overlay { background: white !important; position: static !important; }
                    .modal-card { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
                    .no-print { display: none !important; }
                }
                .form-input { width: 100%; padding: 0.8rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); font-family: inherit; font-size: 0.95rem; outline: none; }
                .form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
                .fade-in { animation: fadeIn 0.3s ease-out; }
                .report-row:hover { background: rgba(99, 102, 241, 0.03); }
                .badge-res { font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 99px; }
                .badge-success { background: #dcfce7; color: #15803d; }
                .badge-warning { background: #fef3c7; color: #b45309; }
                .badge-error { background: #fee2e2; color: #b91c1c; }
                .btn-icon { background: none; border: none; cursor: pointer; color: var(--text-muted); transition: 0.2s; padding: 6px; border-radius: 8px; }
                .btn-icon:hover { color: var(--primary); transform: scale(1.1); background: rgba(99,102,241,0.08); }
                .btn-icon-danger:hover { color: #ef4444 !important; background: rgba(239,68,68,0.08) !important; transform: scale(1.1); }
                .detail-stat { display: flex; flex-direction: column; gap: 4px; border-left: 3px solid var(--primary-glow); padding-left: 12px; }
                .stat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 700; }
                .stat-value { font-size: 1rem; fontWeight: 800; color: var(--text-main); }
                .section-title { font-size: 1rem; font-weight: 800; display: flex; alignItems: center; gap: 8px; margin-bottom: 1.25rem; color: var(--primary); border-bottom: 2px solid var(--primary-glow); padding-bottom: 8px; }
                .info-box { background: white; border-radius: 12px; border: 1px solid var(--surface-border); overflow: hidden; }
                .info-row { padding: 0.75rem 1rem; border-bottom: 1px solid var(--surface-border); font-size: 0.9rem; }
                .info-row:last-child { border-bottom: none; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
