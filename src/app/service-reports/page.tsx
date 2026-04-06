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

    const selectedClientObj = clients.find(c => c.name === formData.client || c.id === formData.client);
    const clientSedes = selectedClientObj?.sedes || [];
    const clientEmployees = selectedClientObj?.employees || [];

    const filteredInventory = inventory.filter(inv => {
        if (!formData.user) return false;
        const itemClient = inv.clientName || inv.company?.name;
        const itemEmployee = inv.assignedEmployee || inv.employee?.name;
        if (formData.client && itemClient !== (selectedClientObj?.name || formData.client)) return false;
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
                    <h1 style={{ fontSize: '2rem' }}>Reporte Técnico</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Registro y control de actividades, mantenimientos y cambios físicos.</p>
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

            <form onSubmit={handleSubmit} className="form-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
                <div className="card glass" style={{ gridColumn: 'span 8', padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>
                        <FileText size={20} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.2rem' }}>Información del Servicio</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Técnico Responsable</label>
                            <select name="technician" value={formData.technician} onChange={handleInputChange} className="form-input" required>
                                <option value="">Seleccione al personal...</option>
                                {staff.map(s => <option key={s.id} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Empresa / Cliente</label>
                            <select name="client" value={formData.client} onChange={(e) => { handleInputChange(e); setFormData(prev => ({ ...prev, sede: '', user: '', assetId: '' })); }} className="form-input" required>
                                <option value="">Seleccione cliente...</option>
                                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Sede</label>
                            <select name="sede" value={formData.sede} onChange={handleInputChange} className="form-input" disabled={!formData.client || clientSedes.length === 0}>
                                <option value="">Sede Principal</option>
                                {clientSedes.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Usuario Final</label>
                            <select name="user" value={formData.user} onChange={(e) => {
                                const newUserName = e.target.value;
                                const empAssets = inventory.filter(inv => (inv.clientName === formData.client || inv.company?.name === formData.client) && (inv.assignedEmployee === newUserName || inv.employee?.name === newUserName));
                                setFormData(prev => ({ ...prev, user: newUserName, assetId: empAssets.length === 1 ? empAssets[0].id : '' }));
                            }} className="form-input" disabled={!formData.client || clientEmployees.length === 0}>
                                <option value="">Seleccione usuario...</option>
                                {clientEmployees.map((e: any) => <option key={e.id} value={e.name}>{e.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group"><label>Ticket ID</label><input type="text" name="ticketId" value={formData.ticketId} onChange={handleInputChange} className="form-input" /></div>
                        <div className="form-group"><label>Fecha</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} className="form-input" required /></div>
                        <div className="form-group"><label>Hora</label><input type="time" name="time" value={formData.time} onChange={handleInputChange} className="form-input" required /></div>
                        <div className="form-group">
                            <label>Modalidad</label>
                            <select name="modality" value={formData.modality} onChange={handleInputChange} className="form-input">
                                <option value="Soporte Remoto">Remoto</option>
                                <option value="Visita Técnica Programada">Visita</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontWeight: 600 }}>Descripción del Problema</label>
                        <textarea name="activities" value={formData.activities} onChange={handleInputChange} className="form-input" rows={3}></textarea>
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label style={{ fontWeight: 700, color: 'var(--primary)' }}>Actividad Realizada por el Técnico *</label>
                        <textarea name="activitySummary" value={formData.activitySummary} onChange={handleInputChange} className="form-input" rows={5} required placeholder="Describa su solución técnica aquí..."></textarea>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div className="form-group">
                            <label>Equipo (Inventario)</label>
                            <select name="assetId" value={formData.assetId} onChange={handleInputChange} className="form-input">
                                <option value="">General...</option>
                                {filteredInventory.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.equipment_id} - {inv.brand} {inv.model}</option>)}
                            </select>
                        </div>
                        <label style={{ display: 'flex', gap: '10px' }}>
                            <input type="checkbox" name="maintenancePerformed" checked={formData.maintenancePerformed} onChange={handleInputChange} /> Mantenimiento Realizado
                        </label>
                        <label style={{ display: 'flex', gap: '10px' }}>
                            <input type="checkbox" name="partsChanged" checked={formData.partsChanged} onChange={handleInputChange} /> Cambio de Piezas
                        </label>
                    </div>
                </div>

                <div style={{ gridColumn: 'span 4' }}>
                    <div className="card glass">
                        <h3 style={{ marginBottom: '1.5rem' }}>Resolución</h3>
                        <select name="isResolved" value={formData.isResolved} onChange={handleInputChange} className="form-input" style={{ marginBottom: '1.5rem' }}>
                            <option value="Si">Resuelto</option>
                            <option value="Parcial">Seguimiento</option>
                            <option value="No">No Resuelto</option>
                        </select>
                        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Guardando...' : <><Save size={20} /> Guardar Reporte</>}
                        </button>
                    </div>
                </div>
            </form>

            {/* Detailed Report Modal */}
            {showDetailModal && selectedReport && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                     <div className="modal-card print-container" style={{ width: '850px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: '0', borderRadius: '24px', background: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', position: 'relative' }}>
                        
                        <div className="no-print" style={{ 
                            position: 'absolute', 
                            top: '30px', 
                            right: '30px', 
                            zIndex: 100, 
                            display: 'flex', 
                            gap: '8px' 
                        }}>
                             <button 
                                onClick={() => window.print()} 
                                className="btn btn-primary"
                                style={{ 
                                    borderRadius: '10px', 
                                    padding: '10px 20px',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                             >
                                <Save size={18} /> Imprimir / PDF
                             </button>
                             <button 
                                onClick={() => setShowDetailModal(false)} 
                                style={{ 
                                    background: 'white', 
                                    color: '#64748b', 
                                    border: '1px solid #e2e8f0', 
                                    borderRadius: '10px', 
                                    padding: '8px', 
                                    cursor: 'pointer' 
                                }}
                             >
                                <X size={22} />
                             </button>
                        </div>

                        <div id="printable-report" style={{ padding: '4rem 5rem' }}>
                            <header style={{ marginBottom: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <img src="/logo.png" alt="Help Soluciones" style={{ height: '72px', width: 'auto', objectFit: 'contain' }} />
                                </div>
                                <div style={{ borderTop: '2px solid #334155', paddingTop: '1.5rem', width: '100%' }}>
                                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>REPORTE TÉCNICO</h1>
                                    <p style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 700, marginTop: '8px', marginBottom: '4px' }}>Reporte N°: {selectedReport.report_id}</p>
                                    <p style={{ fontSize: '1rem', color: '#64748b', margin: 0, fontWeight: 600 }}>Ticket Relacionado: {selectedReport.ticket_id || 'Servicio Programado / Directo'}</p>
                                </div>
                            </header>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', marginBottom: '4rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2.5rem' }}>
                                <div style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '1.2rem' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>FECHA</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedReport.date}</p>
                                </div>
                                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.2rem' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>TÉCNICO</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedReport.technician_name}</p>
                                </div>
                                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.2rem' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>CLIENTE</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedReport.company?.name || selectedReport.company_name || 'Particular'}</p>
                                </div>
                                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.2rem' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>ESTADO</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedReport.is_resolved === 'Si' ? 'RESUELTO' : 'PENDIENTE'}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1rem', color: '#3b82f6', marginBottom: '1.5rem' }}>Detalles del Servicio</h3>
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', background: '#f8fafc' }}>
                                        <p style={{ marginBottom: '1rem' }}><strong>Usuario:</strong> {selectedReport.employee?.name || selectedReport.employee_name || 'N/A'}</p>
                                        <p style={{ marginBottom: '1rem' }}><strong>Equipo:</strong> {selectedReport.inventory?.equipment_id || 'Soporte General'}</p>
                                        <p><strong>Mantenimiento:</strong> {selectedReport.maintenance_performed ? 'Realizado' : 'No realizado'}</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', color: '#3b82f6', marginBottom: '1.5rem' }}>Actividades</h3>
                                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', minHeight: '300px' }}>
                                        <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Descripción del problema</p>
                                        <div style={{ marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>{selectedReport.activities.split('--- ACTIVIDAD REALIZADA ---')[0]}</div>
                                        
                                        <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#3b82f6', textTransform: 'uppercase' }}>Solución Técnica</p>
                                        <div style={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>{selectedReport.activities.split('--- ACTIVIDAD REALIZADA ---')[1] || '---'}</div>
                                    </div>
                                </div>
                            </div>

                            <footer style={{ marginTop: '5rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Help Soluciones Informáticas S.A.S</p>
                                <div style={{ width: '200px', borderTop: '1px solid #ccc', textAlign: 'center', paddingTop: '10px' }}>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>Firma / CC</p>
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
                   .no-print { display: none !important; }
                   html, body { background: white !important; }
                   .modal-overlay { background: white !important; position: absolute !important; }
                   .modal-card { width: 100% !important; max-width: 100% !important; box-shadow: none !important; margin: 0 !important; overflow: visible !important; }
                }
            `}</style>
        </div>
    );
}
