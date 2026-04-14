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
    X,
    Building2,
    Users
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

                 // Enrich reports
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
                         company: company ? { id: company.id, name: company.name } : (r.company_name ? { name: r.company_name } : null),
                         employee: employee ? { id: employee.id, name: employee.name } : (r.employee_name ? { name: r.employee_name } : null),
                         sede: sede ? { id: sede.id, name: sede.name } : (r.sede_name ? { name: r.sede_name } : null),
                         inventory: invItem ? { id: invItem.id, equipment_id: invItem.equipment_id, brand: invItem.brand, model: invItem.model } : null,
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
                    let extractedAssetId = '';
                    if (techNotes && techNotes.includes('💻 Equipo:')) {
                       const equipmentIdStr = techNotes.split('💻 Equipo:')[1]?.split('\n')[0]?.trim();
                       if (equipmentIdStr) {
                          const foundAsset = invList.find((i: any) => i.equipment_id === equipmentIdStr);
                          if (foundAsset) extractedAssetId = foundAsset.id;
                       }
                    }

                    let activitiesText = '';
                    if (description) activitiesText = `Descripción del ticket: ${description}`;
                    if (techNotes) activitiesText += activitiesText ? `\n\nNotas del técnico: ${techNotes}` : `Notas del técnico: ${techNotes}`;

                    setFormData(prev => ({
                        ...prev,
                        ticketId: tId || '',
                        client: cName || '',
                        user: uName || '',
                        technician: techName || '',
                        activities: activitiesText,
                        assetId: extractedAssetId || prev.assetId
                    }));

                    if (tId) {
                        setTicketContext({ id: tId, client: cName, requester: uName, technician: techName, description, priority, category, techNotes });
                    }
                 }

                 const viewId = searchParams.get('view');
                 if (viewId && enriched.length > 0) {
                     const reportToView = enriched.find(r => r.id === viewId);
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

    const selectedClientObj = clients.find(c => (c.name?.trim().toLowerCase() === formData.client?.trim().toLowerCase()) || c.id === formData.client);
    const clientSedes = selectedClientObj?.sedes || [];
    const clientEmployees = selectedClientObj?.employees || [];

    const filteredInventory = inventory.filter(inv => {
        if (!formData.user) return false;
        
        const clientName = (selectedClientObj?.name || formData.client || '').trim().toLowerCase();
        const userName = (formData.user || '').trim().toLowerCase();
        
        const itemClient = (inv.clientName || inv.company?.name || '').trim().toLowerCase();
        const itemEmployee = (inv.assignedEmployee || inv.employee?.name || '').trim().toLowerCase();
        
        if (clientName && itemClient !== clientName) return false;
        if (userName && itemEmployee !== userName) return false;
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

            const fullActivities = [
                formData.activities,
                formData.activitySummary ? `\n\n--- ACTIVIDAD REALIZADA ---\n${formData.activitySummary}` : ''
            ].filter(Boolean).join('');

            const nextVal = await ServiceReportService.getNextId(selectedComp?.id || '');
            const reportId = nextVal.toString().padStart(2, '0');

            const payload = {
                report_id: reportId,
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
                setFormData({ ...formData, activities: '', activitySummary: '', maintenancePerformed: false, partsChanged: false, partsDetails: '', capacityUpgraded: false, upgradeDetails: '', isResolved: 'Si' });
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
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Reporte Técnico</h1>
                </div>
            </header>

            {ticketContext && (
                <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(16,185,129,0.08) 100%)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700 }}>
                        <FileText size={18} />
                        <span>Ticket #{ticketContext.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div style={{ height: '20px', width: '1px', background: 'var(--surface-border)' }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>🏢 <strong>{ticketContext.client}</strong></span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>👤 <strong>{ticketContext.requester}</strong></span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="form-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', alignItems: 'start' }}>
                <div className="card glass shadow-lg" style={{ gridColumn: 'span 8', padding: '2.5rem', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1.25rem' }}>
                        <div style={{ background: 'var(--primary-glow)', padding: '10px', borderRadius: '12px' }}>
                            <FileText size={24} color="var(--primary)" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Información del Servicio</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Complete todos los detalles técnicos del servicio</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>
                                <User size={18} color="var(--primary)" /> Técnico Responsable
                            </label>
                            <select name="technician" value={formData.technician} onChange={handleInputChange} className="form-input" required style={{ borderRadius: '12px', padding: '12px' }}>
                                <option value="">Seleccione al personal...</option>
                                {staff.map(s => <option key={s.id} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>
                                <Building2 size={18} color="var(--primary)" /> Empresa / Cliente
                            </label>
                            <select name="client" value={formData.client} onChange={(e) => { handleInputChange(e); setFormData(prev => ({ ...prev, sede: '', user: '', assetId: '' })); }} className="form-input" required style={{ borderRadius: '12px', padding: '12px' }}>
                                <option value="">Seleccione cliente...</option>
                                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>
                                <MapPin size={18} color="var(--primary)" /> Sede
                            </label>
                            <select name="sede" value={formData.sede} onChange={handleInputChange} className="form-input" disabled={!formData.client || clientSedes.length === 0} style={{ borderRadius: '12px', padding: '12px' }}>
                                <option value="">Sede Principal</option>
                                {clientSedes.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>
                                <Users size={18} color="var(--primary)" /> Usuario Final
                            </label>
                            <select name="user" value={formData.user} onChange={(e) => {
                                const newUserName = e.target.value;
                                const empAssets = inventory.filter(inv => (inv.clientName === formData.client || inv.company?.name === formData.client) && (inv.assignedEmployee === newUserName || inv.employee?.name === newUserName));
                                setFormData(prev => ({ ...prev, user: newUserName, assetId: empAssets.length === 1 ? empAssets[0].id : '' }));
                            }} className="form-input" disabled={!formData.client || clientEmployees.length === 0} style={{ borderRadius: '12px', padding: '12px' }}>
                                <option value="">Seleccione usuario...</option>
                                {clientEmployees.map((e: any) => <option key={e.id} value={e.name}>{e.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr', gap: '1.25rem', marginBottom: '2.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}><FileText size={14} /> Ticket ID</label>
                            <input type="text" name="ticketId" value={formData.ticketId} onChange={handleInputChange} className="form-input" placeholder="Opcional" style={{ borderRadius: '8px' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}><Calendar size={14} /> Fecha</label>
                            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="form-input" required style={{ borderRadius: '8px' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}><Clock size={14} /> Hora</label>
                            <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="form-input" required style={{ borderRadius: '8px' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}><MonitorCheck size={14} /> Modalidad</label>
                            <select name="modality" value={formData.modality} onChange={handleInputChange} className="form-input" style={{ borderRadius: '8px' }}>
                                <option value="Soporte Remoto">Remoto</option>
                                <option value="Visita Técnica Programada">Presencial</option>
                                <option value="Soporte Directo">Directo</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                        <label style={{ display: 'block', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', borderLeft: '4px solid #cbd5e1', paddingLeft: '1rem', fontSize: '1rem' }}>
                             Descripción del Problema
                        </label>
                        <textarea name="activities" value={formData.activities} onChange={handleInputChange} className="form-input" rows={3} style={{ borderRadius: '16px', padding: '1.25rem', width: '100%' }} placeholder="Escriba aquí los detalles del requerimiento solicitado..."></textarea>
                    </div>

                    <div className="form-group" style={{ marginBottom: '3rem' }}>
                        <label style={{ display: 'block', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem', borderLeft: '4px solid var(--primary)', paddingLeft: '1rem', fontSize: '1rem' }}>
                             Actividad Realizada por el Técnico *
                        </label>
                        <textarea name="activitySummary" value={formData.activitySummary} onChange={handleInputChange} className="form-input" rows={6} required placeholder="Describa a detalle la solución técnica aplicada o los procedimientos realizados..." style={{ borderRadius: '16px', padding: '1.5rem', width: '100%', border: '1px solid var(--primary-glow)', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.05)' }}></textarea>
                    </div>

                    <div style={{ background: '#f1f5f9', padding: '2rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>
                                <Laptop size={18} color="var(--primary)" /> Equipo (Inventario)
                            </label>
                            <select name="assetId" value={formData.assetId} onChange={handleInputChange} className="form-input" style={{ borderRadius: '12px' }}>
                                <option value="">Soporte General / Sin equipo específico</option>
                                {filteredInventory.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.equipment_id} - {inv.brand} {inv.model}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', fontWeight: 600 }}>
                                    <input type="checkbox" name="maintenancePerformed" checked={formData.maintenancePerformed} onChange={handleInputChange} style={{ width: '20px', height: '20px' }} /> 
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Wrench size={18} color="#10b981" /> Mantenimiento</span>
                                </label>
                                {formData.maintenancePerformed && (
                                    <select style={{ width: '100%', marginTop: '12px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                                        <option>Preventivo</option>
                                        <option>Correctivo</option>
                                        <option>Limpieza Física</option>
                                        <option>Optimización Software</option>
                                    </select>
                                )}
                            </div>
                            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', fontWeight: 600 }}>
                                    <input type="checkbox" name="partsChanged" checked={formData.partsChanged} onChange={handleInputChange} style={{ width: '20px', height: '20px' }} /> 
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Cpu size={18} color="#f59e0b" /> Cambio de Piezas</span>
                                </label>
                                {formData.partsChanged && (
                                    <input 
                                        type="text" 
                                        placeholder="¿Qué piezas se reemplazaron?" 
                                        className="form-input" 
                                        style={{ marginTop: '12px', width: '100%', padding: '8px', fontSize: '0.85rem', borderRadius: '8px' }}
                                        name="partsDetails"
                                        value={formData.partsDetails}
                                        onChange={handleInputChange}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ gridColumn: 'span 4', position: 'sticky', top: '2rem' }}>
                    <div className="card glass shadow-xl" style={{ border: 'none', background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)', padding: '2rem', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                            <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', padding: '8px', borderRadius: '10px', color: 'white' }}>
                                <MonitorCheck size={20} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Resolución</h3>
                        </div>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Estado Final
                            </label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    name="isResolved" 
                                    value={formData.isResolved} 
                                    onChange={handleInputChange} 
                                    className="form-input" 
                                    style={{ 
                                        borderRadius: '14px', 
                                        padding: '12px 16px', 
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        background: formData.isResolved === 'Si' ? '#ecfdf5' : formData.isResolved === 'No' ? '#fef2f2' : '#fff7ed',
                                        color: formData.isResolved === 'Si' ? '#059669' : formData.isResolved === 'No' ? '#dc2626' : '#d97706',
                                        border: '2px solid currentColor'
                                    }}
                                >
                                    <option value="Si">✓ RESUELTO</option>
                                    <option value="Parcial">⚠ SEGUIMIENTO</option>
                                    <option value="No">✗ NO RESUELTO</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            className="btn-primary" 
                            style={{ 
                                width: '100%', 
                                padding: '1.25rem', 
                                borderRadius: '16px', 
                                fontSize: '1.1rem', 
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)',
                                transition: 'all 0.3s'
                            }} 
                            disabled={loading}
                        >
                            {loading ? (
                                'Guardando...' 
                            ) : (
                                <>
                                    <Save size={24} /> 
                                    Guardar Reporte
                                </>
                            )}
                        </button>
                        
                        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', fontWeight: 500 }}>
                            Al guardar, el reporte quedará disponible para consulta e impresión inmediata.
                        </p>
                    </div>
                </div>
            </form>

            {/* Detailed Report Modal */}
            {showDetailModal && selectedReport && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', zIndex: 10000, backdropFilter: 'blur(8px)', overflowY: 'auto', padding: '30px 20px 30px 60px' }}>
                     <div className="modal-card print-container" style={{ width: '720px', maxWidth: '100%', padding: '0', borderRadius: '20px', background: 'white', position: 'relative', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', marginBottom: '30px' }}>
                        
                        {/* Aesthetic Premium Toolbar */}
                        <div className="no-print" style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem 3rem', 
                            background: '#fff',
                            borderBottom: '1px solid #e2e8f0',
                            position: 'relative',
                            zIndex: 1000
                        }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                                 <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>
                                     VISTA PREVIA DEL DOCUMENTO
                                 </span>
                             </div>
                             <div style={{ display: 'flex', gap: '16px' }}>
                                 <button 
                                    onClick={() => window.print()} 
                                    className="btn-aesthetic-blue"
                                    style={{ 
                                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '10px', 
                                        padding: '10px 24px', 
                                        fontWeight: 700, 
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                                        transition: 'all 0.2s'
                                    }}
                                 >
                                    <Save size={18} /> Imprimir Reporte / PDF
                                 </button>
                                 <button 
                                    onClick={() => setShowDetailModal(false)} 
                                    style={{ 
                                        background: 'white', 
                                        color: '#64748b', 
                                        border: '1px solid #e2e8f0', 
                                        borderRadius: '10px', 
                                        padding: '10px 20px', 
                                        fontWeight: 700, 
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                 >
                                    <X size={18} /> Cerrar
                                 </button>
                             </div>
                        </div>

                        <div id="printable-report" style={{ padding: '2rem 2.5rem' }}>
                            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: 'none', paddingBottom: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                    <img src="/logo.png" alt="Help Soluciones" style={{ height: '50px', width: 'auto', objectFit: 'contain' }} />
                                    <div style={{ textAlign: 'left' }}>
                                        <h2 style={{ color: '#2563eb', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Help Soluciones</h2>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, fontWeight: 600 }}>Mesa de Ayuda Pro</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>REPORTE TÉCNICO</h1>
                                    <p style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 700, margin: 0 }}>N°: {selectedReport.report_id}</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontWeight: 600 }}>{selectedReport.ticket_id || 'Servicio Directo'}</p>
                                </div>
                            </header>

                            {/* Row: Main Info Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Fecha del Servicio</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{selectedReport.date}</p>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{selectedReport.time}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid #cbd5e1', paddingLeft: '1.5rem' }}>
                                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {selectedReport.technician_photo ? (
                                            <img src={selectedReport.technician_photo} alt="Tech" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ color: '#94a3b8' }}><User size={20} /></div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Técnico Responsable</p>
                                        <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0, lineHeight: 1.1 }}>{selectedReport.technician_name}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '1px solid #cbd5e1', paddingLeft: '1.5rem' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Cliente / Empresa</p>
                                    <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{selectedReport.company?.name || selectedReport.company_name || 'Particular'}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '1px solid #cbd5e1', paddingLeft: '1.5rem' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Estado Final</p>
                                    <span style={{ 
                                        fontSize: '0.8rem', 
                                        fontWeight: 800, 
                                        padding: '4px 10px', 
                                        borderRadius: '8px', 
                                        textAlign: 'center',
                                        background: selectedReport.is_resolved === 'Si' ? '#dcfce7' : '#fef3c7',
                                        color: selectedReport.is_resolved === 'Si' ? '#15803d' : '#92400e',
                                        display: 'inline-block',
                                        width: 'fit-content'
                                    }}>
                                        {selectedReport.is_resolved === 'Si' ? 'RESUELTO' : 'SEGUIMIENTO'}
                                    </span>
                                </div>
                            </div>

                            {/* Row: Technical Details Matrix */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                             Datos del Servicio
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Usuario Final</p>
                                                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{selectedReport.employee?.name || selectedReport.employee_name || 'N/A'}</p>
                                            </div>
                                            <div style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Sede</p>
                                                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{selectedReport.sede?.name || selectedReport.sede_name || 'Principal'}</p>
                                            </div>
                                            <div style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Modalidad</p>
                                                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{selectedReport.modality}</p>
                                            </div>
                                            <div style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>N° Ticket</p>
                                                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{selectedReport.ticket_id || 'Programado'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                             Información de Hardware
                                        </h3>
                                        <div style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Equipo / Dispositivo</p>
                                                <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                                                    {selectedReport.inventory
                                                        ? `${selectedReport.inventory.equipment_id} — ${selectedReport.inventory.brand} ${selectedReport.inventory.model}`
                                                        : selectedReport.inventory_id || 'General'
                                                    }
                                                </p>
                                            </div>
                                            <div style={{ height: '1px', background: '#f1f5f9' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Mantenimiento:</span>
                                                <span style={{ fontSize: '0.85rem', color: selectedReport.maintenance_performed ? '#10b981' : '#f59e0b', fontWeight: 800 }}>
                                                    {selectedReport.maintenance_performed ? 'REALIZADO' : 'NO APLICA'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Activities Area */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                        Resumen de Actividades
                                    </h3>
                                    <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Requerimiento</p>
                                            <div style={{ whiteSpace: 'pre-wrap', color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic' }}>
                                                "{selectedReport.activities.split('--- ACTIVIDAD REALIZADA ---')[0]?.trim() || 'No especificada'}"
                                            </div>
                                        </div>
                                        <div style={{ borderTop: '2px dashed #f1f5f9', paddingTop: '1.25rem' }}>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Solución Aplicada</p>
                                            <div style={{ whiteSpace: 'pre-wrap', fontWeight: 500, color: '#1e293b', fontSize: '0.95rem', lineHeight: '1.7' }}>
                                                {selectedReport.activities.includes('--- ACTIVIDAD REALIZADA ---') 
                                                    ? selectedReport.activities.split('--- ACTIVIDAD REALIZADA ---')[1]?.trim()
                                                    : '...'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <footer style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontWeight: 700 }}>© 2026 Help Soluciones Informáticas S.A.S</p>
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .btn-icon { background: none; border: none; cursor: pointer; color: var(--text-muted); transition: 0.2s; padding: 6px; border-radius: 8px; }
                .btn-icon:hover { color: var(--primary); transform: scale(1.1); background: rgba(99,102,241,0.08); }
                .report-row:hover { background: rgba(99, 102, 241, 0.03); }
                @media print {
                   @page { 
                       margin: 0 !important; /* Bordes blancos CERO para expandir al máximo ancho */
                       size: auto; 
                   }
                   
                   html, body, main, div, p, span {
                       /* Integridad total: nada se oculta o recorta */
                       overflow: visible !important;
                       height: auto !important;
                       max-height: none !important;
                   }
                   
                   html, body {
                       margin: 0 !important;
                       padding: 0 !important;
                       background: white !important;
                       width: 100% !important;
                       max-width: none !important;
                   }

                   /* Ocultar Interfaz por completo */
                   .no-print, .sidebar, nav, .toolbar, .btn, .header-actions, .btn-icon, .btn-icon-danger, 
                   .service-reports-page > header, .form-container {
                       display: none !important;
                   }

                   /* Limpieza Modal: sin fondos oscuros o sobreposiciones */
                   .modal-overlay {
                       position: static !important;
                       width: 100% !important;
                       background: white !important;
                       display: block !important;
                       padding: 0 !important;
                       margin: 0 !important;
                       z-index: 1 !important;
                       backdrop-filter: none !important;
                   }

                   .modal-card {
                       position: static !important;
                       width: 100% !important;
                       max-width: none !important;
                       margin: 0 !important;
                       border: none !important;
                       box-shadow: none !important;
                       border-radius: 0 !important;
                       padding: 0 !important;
                       background: white !important;
                       /* ESCALADO VISUAL: Del 0.82 original, subimos a 0.94 para que el contenido abarque toda la estructura de la hoja vertical y horizontalmente */
                       zoom: 0.94 !important; 
                   }

                   #printable-report {
                       /* En lugar de márgenes de hoja, usamos un padding interno calculadamente preciso para alejarlo del borde físico del papel pero usar el 100% */
                       padding: 1.2cm 1.5cm !important; 
                       width: 100% !important;
                       max-width: none !important;
                       display: block !important;
                       box-sizing: border-box !important;
                       background: white !important;
                   }

                   /* ENCABEZADO: Empieza en el tope de la página orgánicamente */
                   #printable-report header {
                       display: flex !important;
                       justify-content: space-between !important;
                       align-items: flex-start !important; 
                       position: relative !important; 
                       top: auto !important;
                       left: auto !important;
                       right: auto !important;
                       padding: 0 0 10px 0 !important;
                       margin: 0 0 15px 0 !important;
                       border-bottom: none !important;
                       background: white !important;
                       width: 100% !important;
                       box-sizing: border-box !important;
                   }

                   /* Reorganización estricta: Logo y texto alineados a la izq y uno sobre otro */
                   #printable-report header > div:first-child {
                       display: flex !important;
                       flex-direction: column !important;
                       align-items: flex-start !important;
                       gap: 2px !important; /* Mínimo espacio entre logo y empresa */
                   }

                   #printable-report header img {
                       display: block !important;
                       height: 48px !important; /* Escalado visual del logo acorde al nuevo tamaño global */
                       object-fit: contain !important;
                   }
                   
                   #printable-report header > div:first-child > div {
                       text-align: left !important;
                   }

                   /* Reorganización: Título a la derecha */
                   #printable-report header > div:last-child {
                       display: flex !important;
                       flex-direction: column !important;
                       justify-content: flex-start !important;
                       align-items: flex-end !important;
                       text-align: right !important;
                   }

                   /* Compactación de Fuentes del encabezado */
                   #printable-report header h1 {
                       font-size: 1.6rem !important; /* Título imponente */
                       font-weight: 900 !important;
                       color: #0f172a !important;
                       margin: 0 0 2px 0 !important;
                       line-height: 1 !important;
                   }
                   
                   #printable-report header h2 {
                       font-size: 1.3rem !important;
                       font-weight: 800 !important;
                       color: #2563eb !important;
                       margin: 0 !important;
                   }
                   
                   #printable-report header p {
                       font-size: 0.85rem !important;
                       color: #64748b !important;
                       margin: 0 !important;
                       font-weight: 600 !important;
                   }

                   /* COMPACTACIÓN ESTRATÉGICA DE SECCIONES (Grid y Cajas) */
                   #printable-report > div {
                       margin-bottom: 15px !important; /* Recuperamos un ligero respiro entre bloques sin pasarnos */
                       gap: 15px !important; /* Separación vertical en grids */
                       padding: 15px !important; /* Preservación de caja de diseño amplia que respira */
                       width: 100% !important;
                       box-sizing: border-box !important;
                   }

                   /* Aplicar a todas las capas grid hijas si las hay */
                   #printable-report div {
                       gap: 15px !important;
                       box-sizing: border-box !important;
                   }

                   /* Compactar títulos de sección (Datos Servicio, HW, Resumen) */
                   #printable-report h3 {
                       margin-bottom: 10px !important;
                       padding-bottom: 5px !important;
                       font-size: 1rem !important; /* Refuerza la legibilidad visual */
                   }

                   #printable-report p {
                       margin-bottom: 2px !important;
                   }

                   /* INTEGRIDAD TOTAL: Asegurar que los bloques extensos no se cortan ni ocultan */
                   #printable-report [style*="italic"], 
                   #printable-report [style*="pre-wrap"] {
                       font-size: 0.95rem !important; /* Mayor legibilidad para actividades sin sobrellenar una página sola */
                       line-height: 1.45 !important;
                       white-space: pre-wrap !important;
                       word-break: break-word !important;
                       overflow: visible !important;
                       max-height: none !important;
                   }

                   /* Footer ultra compacto para no gastar hoja al final */
                   #printable-report footer {
                       margin-top: 15px !important;
                       padding-top: 10px !important;
                       width: 100% !important;
                   }

                   /* Exact color extraction */
                   * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
}
