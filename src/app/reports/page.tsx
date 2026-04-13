'use client';

import React, { useState, useEffect } from 'react';
import {
    Database,
    MonitorCheck,
    Trash2,
    Search,
    Calendar,
    User,
    Building2,
    FileText,
    Wrench,
    X,
    Save,
    Laptop,
    Clock
} from 'lucide-react';
import { StaffService, CompanyService, InventoryService, ServiceReportService } from '@/lib/services';
import { useSearchParams } from 'next/navigation';

export default function ReportsHistory() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchData = async () => {
            const session = localStorage.getItem('help_session');
            const user = session ? JSON.parse(session) : null;
            const userRole = user?.role;
            const assignedId = user?.assignedTo;

            setIsAdmin(userRole === 'Administrador');

            try {
                const [staffList, clientList, invList, reportsList] = await Promise.all([
                    StaffService.getAll(),
                    CompanyService.getAll(),
                    InventoryService.getAll(),
                    ServiceReportService.getAll()
                ]);

                // Robust multi-tenancy filtering
                let toEnrich = reportsList as any[];
                if (userRole === 'Administrador') {
                    // Admins see everything
                } else if (userRole === 'Técnico') {
                    // Technicians see only their reports by ID or Name
                    const techFullName = user?.assignedTo || '';
                    toEnrich = toEnrich.filter(r =>
                        (r.technician_id && r.technician_id === assignedId) ||
                        (r.technician_name === techFullName)
                    );
                } else if (userRole === 'Cliente' || userRole === 'Empresa') {
                    // Clients see only their company's reports
                    const clientName = user?.assignedTo || '';
                    toEnrich = toEnrich.filter(r =>
                        (r.company_id && r.company_id === assignedId) ||
                        (r.company_name === clientName)
                    );
                } else if (userRole === 'Empleado') {
                    const empName = user?.assignedTo || '';
                    toEnrich = toEnrich.filter(r =>
                        (r.employee_id && r.employee_id === assignedId) ||
                        (r.employee_name === empName)
                    );
                } else {
                    // Unknown roles see nothing for security
                    toEnrich = [];
                }

                // Enrichment logic
                const enriched = toEnrich.map(r => {
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

                setReports(enriched.reverse()); // Latest first
                setLoading(false);

                // Check for view param in URL
                const viewId = searchParams.get('view');
                if (viewId) {
                    const reportToView = enriched.find(r => r.id === viewId);
                    if (reportToView) {
                        setSelectedReport(reportToView);
                        setShowDetailModal(true);
                    }
                }
            } catch (err) {
                console.error("Error loading reports data:", err);
                setLoading(false);
            }
        };
        fetchData();
    }, [searchParams]);

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

    const filteredReports = reports.filter(r =>
        r.report_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.technician_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.employee?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="reports-history-page fade-in">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Historial de Informes</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Módulo de consulta, seguimiento e impresión de reportes técnicos realizados.</p>
                </div>
            </header>

            <div className="toolbar glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por ID, técnico, cliente o usuario..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.9rem 1rem 0.9rem 2.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface)', fontSize: '1rem' }}
                    />
                </div>
                <button className="btn glass" style={{ height: '50px' }}><Calendar size={18} /> Filtrar Fecha</button>
            </div>

            <div className="table-container glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                            <th style={{ textAlign: 'left', padding: '1.2rem', fontSize: '0.85rem' }}>ID Reporte</th>
                            <th style={{ textAlign: 'left', padding: '1.2rem', fontSize: '0.85rem' }}>Fecha / Hora</th>
                            <th style={{ textAlign: 'left', padding: '1.2rem', fontSize: '0.85rem' }}>Cliente</th>
                            <th style={{ textAlign: 'left', padding: '1.2rem', fontSize: '0.85rem' }}>Técnico</th>
                            <th style={{ textAlign: 'left', padding: '1.2rem', fontSize: '0.85rem' }}>Equipo</th>
                            <th style={{ textAlign: 'left', padding: '1.2rem', fontSize: '0.85rem' }}>Resolución</th>
                            <th style={{ textAlign: 'center', padding: '1.2rem', fontSize: '0.85rem' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center' }}>Cargando historial...</td></tr>
                        ) : filteredReports.length === 0 ? (
                            <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron reportes.</td></tr>
                        ) : (
                            filteredReports.map(report => (
                                <tr key={report.id} style={{ borderBottom: '1px solid var(--surface-border)', transition: '0.2s' }} className="report-row">
                                    <td style={{ padding: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{report.report_id}</td>
                                    <td style={{ padding: '1.2rem', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600 }}>{report.date}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{report.time}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.2rem', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600 }}>{report.company?.name || report.company_name || 'Particular'}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{report.employee?.name || report.employee_name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.2rem', fontSize: '0.9rem', fontWeight: 600 }}>{report.technician_name}</td>
                                    <td style={{ padding: '1.2rem', fontSize: '0.85rem' }}>{report.inventory?.equipment_id || 'Soporte General'}</td>
                                    <td style={{ padding: '1.2rem' }}>
                                        <span className={`badge-res badge-${report.is_resolved === 'Si' ? 'success' : report.is_resolved === 'Parcial' ? 'warning' : 'error'}`}>
                                            {report.is_resolved === 'Si' ? 'Resuelto' : report.is_resolved === 'Parcial' ? 'Seguimiento' : 'No Resuelto'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.2rem' }}>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <button
                                                className="btn-icon"
                                                title="Ver y Descargar PDF"
                                                onClick={() => {
                                                    setSelectedReport(report);
                                                    setShowDetailModal(true);
                                                }}
                                            >
                                                <MonitorCheck size={20} />
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    className="btn-icon btn-icon-danger"
                                                    title="Eliminar del historial"
                                                    onClick={() => handleDeleteReport(report.id, report.report_id)}
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detailed Report Modal */}
            {showDetailModal && selectedReport && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 10000, backdropFilter: 'blur(8px)', overflowY: 'auto', padding: '30px 20px' }}>
                    <div className="modal-card print-container" style={{ width: '720px', maxWidth: '100%', padding: '0', borderRadius: '20px', background: 'white', position: 'relative', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', marginBottom: '30px' }}>

                        {/* Top Toolbar */}
                        <div className="no-print" style={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            padding: '1rem 2.5rem', 
                            background: '#fff',
                            borderBottom: '1px solid #e2e8f0',
                            position: 'relative',
                            zIndex: 1000,
                            gap: '12px'
                        }}>
                            <button
                                onClick={() => window.print()}
                                className="btn btn-primary"
                                style={{
                                    borderRadius: '10px',
                                    padding: '8px 20px',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
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
                                    color: '#ef4444',
                                    border: '1px solid #fee2e2',
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700
                                }}
                            >
                                <X size={18} /> Cerrar
                            </button>
                        </div>

                        <div id="printable-report" style={{ padding: '3rem 3.5rem' }}>
                            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #334155', paddingBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <img src="/logo.png" alt="Help Soluciones" style={{ height: '65px', width: 'auto', objectFit: 'contain' }} />
                                    <div style={{ textAlign: 'left' }}>
                                        <h2 style={{ color: '#2563eb', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Help Soluciones</h2>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, fontWeight: 600 }}>Mesa de Ayuda Pro</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>REPORTE TÉCNICO</h1>
                                    <p style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 700, margin: 0 }}>N°: {selectedReport.report_id}</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontWeight: 600 }}>{selectedReport.ticket_id || 'Servicio Directo'}</p>
                                </div>
                            </header>

                            {/* Row: Main Info Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
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
                                            <User size={20} color="#94a3b8" />
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
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                            <User size={18} /> Datos del Servicio
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '1rem', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Usuario Final</p>
                                                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{selectedReport.employee?.name || selectedReport.employee_name || 'N/A'}</p>
                                            </div>
                                            <div style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '1rem', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Sede</p>
                                                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{selectedReport.sede?.name || selectedReport.sede_name || 'Principal'}</p>
                                            </div>
                                            <div style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '1rem', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Modalidad</p>
                                                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{selectedReport.modality}</p>
                                            </div>
                                            <div style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '1rem', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>N° Ticket</p>
                                                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{selectedReport.ticket_id || 'Servicio Programado'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                            <Laptop size={18} /> Información de Hardware
                                        </h3>
                                        <div style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Equipo / Dispositivo</p>
                                                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                                                    {selectedReport.inventory
                                                        ? `${selectedReport.inventory.equipment_id} — ${selectedReport.inventory.brand} ${selectedReport.inventory.model}`
                                                        : selectedReport.inventory_id || 'Soporte de Infraestructura / General'
                                                    }
                                                </p>
                                            </div>
                                            <div style={{ height: '1px', background: '#f1f5f9' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>Mantenimiento técnico:</span>
                                                <span style={{ fontSize: '0.9rem', color: selectedReport.maintenance_performed ? '#10b981' : '#f59e0b', fontWeight: 800 }}>
                                                    {selectedReport.maintenance_performed ? '✓ REALIZADO' : 'NO APLICABA'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Activities Area */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                        <Clock size={18} /> Resumen de Actividades
                                    </h3>
                                    <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Descripción del Requerimiento</p>
                                            <div style={{ whiteSpace: 'pre-wrap', color: '#475569', fontSize: '1rem', lineHeight: '1.6', fontStyle: 'italic' }}>
                                                "{selectedReport.activities.split('--- ACTIVIDAD REALIZADA ---')[0]?.trim() || 'No especificada'}"
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '2px dashed #f1f5f9', paddingTop: '1.5rem' }}>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Procedimiento y Solución Aplicada</p>
                                            <div style={{ whiteSpace: 'pre-wrap', fontWeight: 500, color: '#1e293b', fontSize: '1rem', lineHeight: '1.7' }}>
                                                {selectedReport.activities.includes('--- ACTIVIDAD REALIZADA ---')
                                                    ? selectedReport.activities.split('--- ACTIVIDAD REALIZADA ---')[1]?.trim()
                                                    : 'Vea el detalle del reporte técnico anterior.'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <footer style={{ marginTop: '5rem', paddingTop: '2.5rem', borderTop: '2px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontWeight: 700 }}>© 2026 Help Soluciones Informáticas S.A.S</p>
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .badge-res { font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 99px; }
                .badge-success { background: #dcfce7; color: #15803d; }
                .badge-warning { background: #fef3c7; color: #b45309; }
                .badge-error { background: #fee2e2; color: #b91c1c; }
                .btn-icon { background: none; border: none; cursor: pointer; color: var(--text-muted); transition: 0.2s; padding: 10px; border-radius: 12px; }
                .btn-icon:hover { color: var(--primary); background: rgba(99,102,241,0.08); transform: scale(1.1); }
                .btn-icon-danger:hover { color: #ef4444 !important; background: rgba(239,68,68,0.08) !important; }
                .report-row:hover { background: rgba(99, 102, 241, 0.03); }
                
                @media print {
                   @page { margin: 0; size: auto; }
                   body { background: white !important; margin: 0 !important; padding: 0 !important; }
                   .no-print, .sidebar, nav, header, .toolbar, .btn, .header-actions { display: none !important; }
                   .modal-overlay { 
                       position: absolute !important; 
                       top: 0 !important; 
                       left: 0 !important; 
                       width: 100% !important; 
                       height: auto !important;
                       background: white !important;
                       padding: 0 !important;
                       margin: 0 !important;
                       display: block !important;
                       backdrop-filter: none !important;
                       z-index: 9999 !important;
                   }
                   .modal-card { 
                       width: 100% !important; 
                       max-width: 100% !important; 
                       height: auto !important;
                       max-height: none !important;
                       border-radius: 0 !important;
                       box-shadow: none !important;
                       margin: 0 !important;
                       padding: 0 !important;
                       overflow: visible !important;
                       background: white !important;
                   }
                   #printable-report { 
                       display: block !important; 
                       padding: 1.5cm 2cm !important;
                       width: 100% !important;
                       -webkit-print-color-adjust: exact !important;
                       print-color-adjust: exact !important;
                   }
                   /* Ensure background colors print */
                   * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
}
