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
            setIsAdmin(user?.role === 'Administrador');

            try {
                const [staffList, clientList, invList, reportsList] = await Promise.all([
                    StaffService.getAll(),
                    CompanyService.getAll(),
                    InventoryService.getAll(),
                    ServiceReportService.getAll()
                ]);

                // Enrichment logic (same as service-reports page)
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
                                            <span style={{ fontWeight: 600 }}>{report.company?.name || '---'}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{report.employee?.name || 'N/A'}</span>
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

            {/* Detailed Report Modal (Same logic reused for consistency) */}
            {showDetailModal && selectedReport && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                     <div className="modal-card print-container" style={{ width: '850px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: '0', borderRadius: '24px', background: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', position: 'relative' }}>
                        <div className="no-print" style={{ position: 'sticky', top: '0', right: '0', zIndex: 100, display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '20px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f1f5f9', borderRadius: '24px 24px 0 0' }}>
                             <button className="btn btn-primary" onClick={() => window.print()} style={{ borderRadius: '10px' }}><Save size={18} /> Imprimir / PDF</button>
                             <button className="btn-icon" onClick={() => setShowDetailModal(false)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div id="printable-report" style={{ padding: '4rem 5rem' }}>
                            <header style={{ marginBottom: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <img src="/logo.png" alt="Help Soluciones" style={{ height: '72px', width: 'auto', objectFit: 'contain' }} />
                                </div>
                                <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '1.5rem', width: '100%' }}>
                                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e3a5f', margin: 0, letterSpacing: '-0.02em' }}>REPORTE TÉCNICO</h1>
                                    <p style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 700, marginTop: '8px' }}>Certificado N°: <span style={{ color: 'var(--primary)' }}>{selectedReport.report_id}</span></p>
                                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '4px 0 0 0', fontWeight: 600 }}>Ticket Relacionado: {selectedReport.ticket_id || 'Servicio Programado / Directo'}</p>
                                </div>
                            </header>

                            {/* Info Row */}
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

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '3.5rem' }}>
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

                                {/* Summary Column */}
                                <div>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                                        <Clock size={18} /> Resumen del Servicio
                                    </h3>
                                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '2.5rem', minHeight: '400px', fontSize: '1rem', color: '#334155', lineHeight: 2 }}>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Descripción del Problema</p>
                                            <div style={{ whiteSpace: 'pre-wrap', color: '#64748b', fontSize: '0.95rem' }}>
                                                {selectedReport.activities.split('--- ACTIVIDAD REALIZADA ---')[0]?.trim() || 'No especificada'}
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '1.5rem' }}>
                                            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Actividad Realizada</p>
                                            <div style={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                                                {selectedReport.activities.includes('--- ACTIVIDAD REALIZADA ---') 
                                                    ? selectedReport.activities.split('--- ACTIVIDAD REALIZADA ---')[1]?.trim()
                                                    : 'Vea el detalle arriba'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

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
                .badge-res { font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 99px; }
                .badge-success { background: #dcfce7; color: #15803d; }
                .badge-warning { background: #fef3c7; color: #b45309; }
                .badge-error { background: #fee2e2; color: #b91c1c; }
                .btn-icon { background: none; border: none; cursor: pointer; color: var(--text-muted); transition: 0.2s; padding: 10px; border-radius: 12px; }
                .btn-icon:hover { color: var(--primary); background: rgba(99,102,241,0.08); transform: scale(1.1); }
                .btn-icon-danger:hover { color: #ef4444 !important; background: rgba(239,68,68,0.08) !important; }
                .report-row:hover { background: rgba(99, 102, 241, 0.03); }
                
                @media print {
                   #printable-report { display: block !important; }
                   .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
}
