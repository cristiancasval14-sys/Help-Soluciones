'use client';

import React, { useState, useEffect } from 'react';
import {
    Ticket as TicketIcon,
    CheckCircle2,
    AlertTriangle,
    Clock,
    TrendingUp,
    Search,
    ChevronRight,
    X,
    User,
    Calendar,
    Briefcase,
    Activity,
    FileText,
    Phone,
    Monitor,
    Image as ImageIcon
} from 'lucide-react';
import { TicketService, ServiceReportService } from '@/lib/services';
import { useRouter } from 'next/navigation';

interface Ticket {
    id: string;
    client: string;
    requester: string;
    type: string;
    priority: string;
    status: string;
    date: string;
    assignedTo?: string;
    techPhone?: string;
    techImage?: string;
    techNotes?: string;
    description?: string;
    imageUrl?: string;
    solution?: string; // Activities from service report
}

export default function Dashboard() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isImageFullscreen, setIsImageFullscreen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchDashboardData = async () => {
            const session = localStorage.getItem('help_session');
            const user = session ? JSON.parse(session) : null;
            setCurrentUser(user);

            try {
                const [data, reports] = await Promise.all([
                    TicketService.getAll(),
                    ServiceReportService.getAll()
                ]);

                const mapped = data.map((t: any) => {
                    // Find matching report for this ticket
                    const report = reports.find((r: any) => r.ticket_id === t.id);
                    
                    return {
                        id: t.id,
                        client: t.company?.name || '---',
                        requester: t.requester_name,
                        type: t.type,
                        priority: t.priority,
                        status: t.status,
                        date: t.date || t.created_at?.split('T')[0],
                        assignedTo: t.staff ? `${t.staff.first_name} ${t.staff.last_name}` : undefined,
                        techPhone: t.staff?.phone || undefined,
                        techImage: t.staff?.photo || undefined,
                        techNotes: t.tech_notes,
                        description: t.description,
                        imageUrl: t.image_url || t.imageUrl || t.evidence_url,
                        solution: report?.activities || undefined // Here we map the solution!
                    };
                });

                let filtered = mapped;
                if (user && user.role !== 'Administrador') {
                    if (user.role === 'Técnico') {
                        filtered = mapped.filter((t: any) => t.assignedTo === user.assignedTo);
                    } else if (user.role === 'Cliente') {
                        filtered = mapped.filter((t: any) => t.client?.trim().toLowerCase() === user.assignedTo?.trim().toLowerCase());
                    }
                }
                setTickets(filtered as Ticket[]);
            } catch (err) {
                console.error("Error loading dashboard data:", err);
            }
        };

        fetchDashboardData();
    }, []);

    const getKPIs = () => {
        const openTickets = tickets.filter(t => !['Resuelto', 'Terminado', 'Cerrado', 'Solucionado', 'Finalizado'].includes(t.status));
        const resolvedTickets = tickets.filter(t => ['Resuelto', 'Terminado', 'Cerrado', 'Solucionado', 'Finalizado'].includes(t.status));
        const highPriority = tickets.filter(t =>
            (t.priority === 'Alta' || t.priority === 'Crítica') &&
            !['Resuelto', 'Terminado', 'Cerrado', 'Solucionado', 'Finalizado'].includes(t.status)
        );

        return [
            { label: 'Tickets Abiertos', value: openTickets.length.toString(), icon: TicketIcon, sub: 'Pendientes de atención', type: 'info' },
            { label: 'Resueltos', value: resolvedTickets.length.toString(), icon: CheckCircle2, sub: 'Total finalizados', type: 'success' },
            { label: 'Riesgo SLA', value: highPriority.length.toString(), icon: AlertTriangle, sub: 'Alta prioridad', type: 'error' },
            { label: 'Tiempos Promedio', value: '45m', icon: Clock, sub: 'Meta: <1h', type: 'warning' },
        ];
    };

    const kpiCards = getKPIs();
    const recentTickets = tickets.filter(t => !['Resuelto', 'Terminado', 'Cerrado', 'Solucionado', 'Finalizado'].includes(t.status)).slice(0, 8);

    const openTicketDetail = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsDetailOpen(true);
    };

    return (
        <div className="dashboard-page fade-in">
            <header className="dashboard-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                        {currentUser?.role === 'Administrador'
                            ? 'Visión Global de Operación'
                            : (currentUser?.role === 'Cliente' ? `Resumen de Empresa: ${currentUser?.assignedTo}` : `Mis Actividades: ${currentUser?.assignedTo || currentUser?.username}`)}
                    </p>
                    <h1 style={{ fontSize: '2rem' }}>Dashboard Principal</h1>
                </div>

                <div className="header-actions glass" style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar ticket o cliente..."
                            style={{ padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', background: 'transparent', outline: 'none' }}
                        />
                    </div>
                </div>
            </header>

            {/* KPI Section */}
            <section className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {kpiCards.map((kpi) => (
                    <div 
                        key={kpi.label} 
                        className="card kpi-card glass" 
                        style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                        onClick={() => router.push(`/tickets?filter=${kpi.label}`)}
                        title={`Ver detalles de ${kpi.label} en Gestión Tickets`}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div className={`icon-box ${kpi.type}`} style={{
                                width: '48px', height: '48px', borderRadius: 'var(--radius-sm)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: `rgba(var(--${kpi.type}-rgb, 99, 102, 241), 0.1)`,
                                color: `var(--${kpi.type})`
                            }}>
                                <kpi.icon size={24} />
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right' }}>{kpi.sub}</p>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{kpi.label}</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 700 }}>{kpi.value}</p>
                    </div>
                ))}
            </section>

            {/* Main Activity Table */}
            <section className="main-table glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={20} className="text-primary" /> Tickets Recientes
                    </h2>
                    <button style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>Gestionar todo</button>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Solicitante</th>
                                <th>Prioridad</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTickets.map(ticket => (
                                <tr key={ticket.id} className="table-row" onClick={() => openTicketDetail(ticket)} style={{ cursor: 'pointer' }}>
                                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{ticket.id}</td>
                                    <td style={{ fontWeight: 600 }}>{ticket.client}</td>
                                    <td>{ticket.requester || 'Usuario'}</td>
                                    <td>
                                        <span className={`badge-priority p-${ticket.priority.toLowerCase().replace('í', 'i')}`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge-status status-${ticket.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button style={{ color: 'var(--text-muted)', transition: '0.2s' }} className="row-action">
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {recentTickets.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        No hay tickets registrados en el sistema.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>


            {/* Ticket Detail Modal (The "Desplegar" functionality) */}
            {isDetailOpen && selectedTicket && (
                <div className="modal-overlay fade-in" onClick={() => setIsDetailOpen(false)}>
                    <div 
                        className="modal-content glass" 
                        onClick={e => e.stopPropagation()} 
                        style={{ 
                            width: '650px', 
                            padding: '0', 
                            maxHeight: '90vh', 
                            overflowY: 'auto'
                        }}
                    >
                        <header style={{
                            padding: '2rem',
                            background: 'linear-gradient(to right, rgba(99, 102, 241, 0.05), transparent)',
                            borderBottom: '1px solid var(--surface-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                                        {selectedTicket.id}
                                    </span>
                                    <span className={`badge-priority p-${selectedTicket.priority.toLowerCase().replace('í', 'i')}`}>
                                        {selectedTicket.priority}
                                    </span>
                                </div>
                                <h2 style={{ fontSize: '1.5rem' }}>Detalle del Servicio</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Información completa registrada en el sistema</p>
                            </div>
                            <button onClick={() => setIsDetailOpen(false)} style={{ color: 'var(--text-muted)', padding: '5px' }}>
                                <X size={24} />
                            </button>
                        </header>

                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="detail-item">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                        <Briefcase size={14} /> CLIENTE / EMPRESA
                                    </label>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedTicket.client}</p>
                                </div>
                                <div className="detail-item">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                        <User size={14} /> SOLICITADO POR
                                    </label>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedTicket.requester}</p>
                                </div>
                                <div className="detail-item">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                        <Calendar size={14} /> FECHA DE REGISTRO
                                    </label>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedTicket.date}</p>
                                </div>
                                <div className="detail-item">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                        <Activity size={14} /> ESTADO ACTUAL
                                    </label>
                                    <span className={`badge-status status-${selectedTicket.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {selectedTicket.status}
                                    </span>
                                </div>
                            </div>

                            {/* Section: Technician Encargado (High Prominence) */}
                            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    <User size={14} /> TÉCNICO ENCARGADO
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--surface)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, overflow: 'hidden', border: '2px solid var(--primary-glow)' }}>
                                        {selectedTicket.techImage ? (
                                            <img src={selectedTicket.techImage} alt="Tech Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            selectedTicket.assignedTo ? selectedTicket.assignedTo.charAt(0) : <User size={28} />
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '4px' }}>{selectedTicket.assignedTo || 'Pendiente de Asignación'}</p>
                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            {selectedTicket.techPhone && (
                                                <p style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                                    <Phone size={14} /> {selectedTicket.techPhone}
                                                </p>
                                            )}
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{selectedTicket.assignedTo ? 'Soporte Especializado' : 'Gestión de Mesa de Ayuda'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Technical Solution from Service Report */}
                            {selectedTicket.solution && (
                                <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.8rem', textTransform: 'uppercase' }}>
                                        <CheckCircle2 size={16} /> Solución Técnica (Reporte Final)
                                    </label>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-line', fontWeight: 500 }}>
                                            {selectedTicket.solution}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Equipment Information Header */}
                            {selectedTicket.techNotes?.includes('💻 Equipo:') && (
                                <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.8rem', textTransform: 'uppercase' }}>
                                        <Monitor size={16} /> Información de Hardware
                                    </label>
                                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                            {selectedTicket.techNotes.split('💻 Equipo:')[1]?.split('📝 Descripción:')[0]?.trim() || 'No especificado'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Problem Description */}
                            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.8rem', textTransform: 'uppercase' }}>
                                    <FileText size={16} /> Descripción del Problema
                                </label>
                                <div style={{ background: 'var(--surface-alt)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-line' }}>
                                        {selectedTicket.description || 
                                         (selectedTicket.techNotes?.includes('📝 Descripción:') ? 
                                          selectedTicket.techNotes.split('📝 Descripción:')[1]?.trim() : 
                                          selectedTicket.techNotes)}
                                    </p>
                                </div>
                            </div>

                            {/* Evidence Image Block */}
                            {selectedTicket.imageUrl && selectedTicket.imageUrl.length > 5 && (
                                <div style={{ border: '1px solid var(--surface-border)', borderRadius: '12px', overflow: 'hidden', marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.5rem', background: 'var(--surface-alt)', borderBottom: '1px solid var(--surface-border)' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ImageIcon size={14} /> EVIDENCIA ADJUNTA
                                        </p>
                                        <button onClick={() => setIsImageFullscreen(true)} className="btn glass" style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            Ampliar Imagen
                                        </button>
                                    </div>
                                    <div style={{ background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                        <img 
                                            src={selectedTicket.imageUrl} 
                                            alt="Evidencia del ticket" 
                                            style={{ maxWidth: '100%', maxHeight: '500px', display: 'block', objectFit: 'contain', cursor: 'zoom-in' }} 
                                            onClick={() => setIsImageFullscreen(true)} 
                                            title="Haga clic para ampliar"
                                            onError={(e) => {
                                                console.error("Image display error");
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <footer style={{ padding: '1.5rem 2rem', background: 'var(--surface)', borderTop: '1px solid var(--surface-border)', textAlign: 'right' }}>
                            <button className="btn glass" onClick={() => setIsDetailOpen(false)}>Cerrar Detalle</button>
                        </footer>
                    </div>
                </div>
            )}

            {isImageFullscreen && selectedTicket?.imageUrl && (
                <div className="modal-overlay" style={{ zIndex: 3000, background: 'rgba(0,0,0,0.85)' }} onClick={() => setIsImageFullscreen(false)}>
                    <button style={{ position: 'absolute', top: '20px', right: '30px', color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%', cursor: 'pointer', border: 'none' }} onClick={() => setIsImageFullscreen(false)}>
                        <X size={28} />
                    </button>
                    <img src={selectedTicket.imageUrl} alt="Evidencia ampliada" style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()} />
                </div>
            )}

            <style jsx>{`
                .dashboard-page { max-width: 1400px; margin: 0 auto; }
                .table-row { transition: 0.2s; }
                .table-row:hover { background: rgba(99, 102, 241, 0.04) !important; scale: 0.998; }
                .row-action:hover { color: var(--primary) !important; transform: translateX(4px); }
                .kpi-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--primary); }
                .icon-box.info { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
                .icon-box.success { color: #10b981; background: rgba(16, 185, 129, 0.1); }
                .icon-box.error { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
                .icon-box.warning { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
                
                .badge-priority { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 0.2rem 0.6rem; border-radius: 4px; }
                .p-baja { color: var(--success); background: rgba(16, 185, 129, 0.1); }
                .p-media { color: var(--info); background: rgba(59, 130, 246, 0.1); }
                .p-alta { color: var(--warning); background: rgba(245, 158, 11, 0.1); }
                .p-critica { color: var(--error); background: rgba(239, 68, 68, 0.1); }

                .badge-status { font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.8rem; border-radius: 99px; display: inline-block; }
                .status-nuevo { background: #e0e7ff; color: #4338ca; }
                .status-asignado { background: #fef3c7; color: #b45309; }
                .status-en-proceso { background: #dcfce7; color: #15803d; }
                .status-pendiente { background: #ffedd5; color: #ea580c; }
                .status-resuelto, .status-terminado, .status-solucionado, .status-finalizado { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; alignItems: center; justifyContent: center; zIndex: 2000; backdropFilter: blur(8px); }
                .modal-content { background: var(--surface); border-radius: var(--radius-lg); box-shadow: 0 40px 100px rgba(0,0,0,0.3); animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @media (max-width: 768px) {
                    .modal-content { width: 95% !important; margin: 10px; }
                }
            `}</style>
        </div>
    );
}
