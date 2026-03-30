'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Ticket as TicketIcon,
    Clock,
    AlertTriangle,
    CheckCircle,
    ChevronRight,
    Trash2,
    Calendar,
    User,
    Activity,
    Settings,
    Save,
    X,
    MessageSquare,
    ClipboardCheck,
    PlayCircle,
    FileText
} from 'lucide-react';
import Link from 'next/link';

import { TicketService, StaffService, ServiceReportService } from '@/lib/services';
import { Ticket as DBTicket, Priority, TicketStatus, Company, Staff } from '@/lib/supabase';

// Local UI Interface (extends DB interface)
interface Ticket extends DBTicket {
    // These come from the joins in backend
    company?: Company;
    staff?: Staff;
}

export default function TicketsList() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [serviceReports, setServiceReports] = useState<any[]>([]);

    // Status management state
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [techNotes, setTechNotes] = useState('');
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            const session = localStorage.getItem('help_session');
            const user = session ? JSON.parse(session) : null;
            setCurrentUser(user);

            try {
                const [ticketsData, staffData] = await Promise.all([
                    TicketService.getAll(),
                    isAdminRole(user) ? StaffService.getAll() : Promise.resolve([])
                ]);
                
                // Fetch reports separately to not break the page if it fails
                try {
                    const reportsData = await ServiceReportService.getAll();
                    setServiceReports(reportsData as any[]);
                } catch (reportErr) {
                    console.error("Warning: Could not load service reports:", reportErr);
                    setServiceReports([]);
                }
                
                let filtered = ticketsData;
                if (user && user.role !== 'Administrador') {
                    if (user.role === 'Técnico') {
                        filtered = ticketsData.filter((t: any) => (t.staff?.first_name + ' ' + t.staff?.last_name) === user.assignedTo);
                    } else if (user.role === 'Cliente') {
                        filtered = ticketsData.filter((t: any) => t.company?.name?.trim().toLowerCase() === user.assignedTo?.trim().toLowerCase());
                    }
                }
                setTickets(filtered as Ticket[]);
                setStaffList(staffData);

                // Auto-apply filter if coming from dashboard URL query
                const params = new URLSearchParams(window.location.search);
                const queryFilter = params.get('filter');
                if (queryFilter) {
                    setActiveFilter(queryFilter);
                }
            } catch (err) {
                console.error("Error connecting to Supabase:", err);
            }
        };

        const isAdminRole = (user: any) => user?.role === 'Administrador';
        fetchInitialData();
    }, []);


    const handleUpdateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket) return;

        try {
            await TicketService.updateStatus(selectedTicket.id, newStatus, techNotes);
            
            const updatedTickets = tickets.map(t => 
                t.id === selectedTicket.id 
                    ? { ...t, status: newStatus as any, tech_notes: techNotes } 
                    : t
            );

            setTickets(updatedTickets);
            setIsStatusModalOpen(false);
            setSelectedTicket(null);
        } catch (err: any) {
            alert("Error de Supabase: " + (err.message || "Fallo al actualizar estado"));
        }
    };

    const handleAssignStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket || !selectedStaffId) return;

        try {
            const selectedStaff = staffList.find(s => s.id === selectedStaffId);
            await TicketService.update(selectedTicket.id, { 
                assigned_staff_id: selectedStaffId,
                status: 'Asignado'
            });
            
            const updatedTickets = tickets.map(t => 
                t.id === selectedTicket.id 
                    ? { ...t, status: 'Asignado' as any, assigned_staff_id: selectedStaffId, staff: selectedStaff } 
                    : t
            );

            setTickets(updatedTickets);
            setIsAssignModalOpen(false);
            setSelectedTicket(null);
            setSelectedStaffId('');
        } catch (err: any) {
            alert("Error de Supabase: " + (err.message || "Fallo al asignar técnico"));
        }
    };

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase().replace(/\s+/g, '-');
        return <span className={`badge badge-${s}`}>{status}</span>;
    };

    const getPriorityBadge = (priority: string) => {
        const p = priority.toLowerCase();
        return <span className={`priority-tag p-${p}`}>{priority}</span>;
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Está seguro de eliminar este ticket?')) {
            try {
                await TicketService.delete(id);
                setTickets(tickets.filter(t => t.id !== id));
            } catch (err) {
                alert("Error al eliminar de Supabase");
            }
        }
    };

    const isAdmin = currentUser?.role === 'Administrador';
    const isClient = currentUser?.role === 'Cliente';
    const isTech = currentUser?.role === 'Técnico';

    const stats = [
        { id: 'Total', label: 'Total Tickets', value: tickets.length.toString(), color: 'var(--primary)', icon: TicketIcon, visible: true },
        { id: 'Urgentes', label: 'Urgentes', value: tickets.filter(t => t.priority === 'Crítica' || t.priority === 'Alta').length.toString(), color: 'var(--error)', icon: AlertTriangle, visible: true },
        { id: 'En Proceso', label: 'En Proceso', value: tickets.filter(t => ['En Proceso', 'Asignado', 'Pendiente'].includes(t.status)).length.toString(), color: 'var(--warning)', icon: Clock, visible: true },
        { id: 'Resueltos', label: 'Resueltos', value: tickets.filter(st => ['Resuelto', 'Terminado', 'Cerrado', 'Solucionado', 'Finalizado'].includes(st.status)).length.toString(), color: 'var(--success)', icon: CheckCircle, visible: isAdmin },
    ].filter(s => s.visible);

    const displayedTickets = tickets.filter(t => {
        if (!activeFilter || activeFilter === 'Total') return true;
        if (activeFilter === 'Urgentes') return t.priority === 'Crítica' || t.priority === 'Alta';
        if (activeFilter === 'En Proceso') return ['En Proceso', 'Asignado', 'Pendiente'].includes(t.status);
        if (activeFilter === 'Resueltos') return ['Resuelto', 'Terminado', 'Cerrado', 'Solucionado', 'Finalizado'].includes(t.status);
        return true;
    });

    return (
        <div className="tickets-page fade-in">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>{isClient ? 'Mis Solicitudes' : 'Gestor de Tickets'}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {isClient ? 'Crea y haz seguimiento a tus requerimientos' : 'Control y seguimiento de mesa de ayuda'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/tickets/new" className="btn btn-primary">
                        <Plus size={20} /> Crear Ticket
                    </Link>
                </div>
            </header>

            {!isClient && (
                <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: '1.5rem', marginBottom: '2.5rem' }}>
                    {stats.map(stat => (
                        <div 
                            key={stat.id} 
                            className={`card glass stat-card ${activeFilter === stat.id ? 'active-filter' : ''}`} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '1rem', 
                                padding: '1.2rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: activeFilter === stat.id ? `2px solid ${stat.color}` : '1px solid transparent',
                                transform: activeFilter === stat.id ? 'translateY(-3px)' : 'none',
                                boxShadow: activeFilter === stat.id ? `0 10px 25px ${stat.color}20` : 'none'
                            }}
                            onClick={() => setActiveFilter(activeFilter === stat.id ? null : stat.id)}
                            title={`Filtrar por ${stat.label}`}
                        >
                            <div style={{ background: `${stat.color}15`, color: stat.color, padding: '0.8rem', borderRadius: '12px' }}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="toolbar glass" style={{ padding: '1.2rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Buscar por ID, cliente o descripción..." className="search-input" />
                </div>
                <button className="btn glass"><Filter size={18} /> Filtros</button>
            </div>

            <div className="table-container glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Ticket</th>
                            <th>Información del Cliente</th>
                            <th>Prioridad</th>
                            <th>Estado Actual</th>
                            <th>Técnico</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedTickets.map(ticket => (
                            <tr key={ticket.id} className="ticket-row">
                                <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{ticket.id}</td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{ticket.company?.name || '---'}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ticket.requester_name}</span>
                                    </div>
                                </td>
                                <td>{getPriorityBadge(ticket.priority)}</td>
                                <td>{getStatusBadge(ticket.status)}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: ticket.staff ? 'var(--info)' : 'var(--text-muted)' }}>
                                        <User size={14} /> {ticket.staff ? `${ticket.staff.first_name} ${ticket.staff.last_name}` : 'Sin asignar'}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <Calendar size={14} /> {ticket.date}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                                        {/* Dynamic Report Action: View or Create */}
                                        {(() => {
                                            const existingReport = serviceReports.find(r => r.ticket_id === ticket.id);
                                            if (existingReport) {
                                                return (
                                                    <Link 
                                                        href={`/service-reports?view=${existingReport.id}`}
                                                        className="row-btn view-report-btn" 
                                                        title="Ver Reporte Técnico"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 800 }}
                                                    >
                                                        <FileText size={18} /> <span>VER</span>
                                                    </Link>
                                                );
                                            } else if (isTech && (ticket.staff?.first_name + ' ' + ticket.staff?.last_name).toLowerCase() === currentUser?.assignedTo?.toLowerCase()) {
                                                return (
                                                    <Link 
                                                        href={`/service-reports?ticketId=${ticket.id}&companyId=${ticket.company_id}&clientId=${ticket.company?.name}&requester=${ticket.requester_name}&techName=${ticket.staff?.first_name} ${ticket.staff?.last_name}`}
                                                        className="row-btn report-btn" 
                                                        title="Crear Reporte Técnico"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800 }}
                                                    >
                                                        <Plus size={18} /> <span>PDF</span>
                                                    </Link>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {isAdmin && (
                                            <button 
                                                className="row-btn assign-btn" 
                                                title="Asignar Técnico"
                                                onClick={() => {
                                                    setSelectedTicket(ticket);
                                                    setSelectedStaffId(ticket.assigned_staff_id || '');
                                                    setIsAssignModalOpen(true);
                                                }}
                                            >
                                                <User size={18} />
                                            </button>
                                        )}

                                        {isTech && (ticket.staff?.first_name + ' ' + ticket.staff?.last_name).toLowerCase() === currentUser?.assignedTo?.toLowerCase() && (
                                            <button 
                                                className="row-btn status-update-btn" 
                                                title="Actualizar Estado"
                                                onClick={() => {
                                                    setSelectedTicket(ticket);
                                                    setNewStatus(ticket.status);
                                                    setTechNotes(ticket.tech_notes || '');
                                                    setIsStatusModalOpen(true);
                                                }}
                                            >
                                                <ClipboardCheck size={20} />
                                            </button>
                                        )}

                                        <button className="row-btn" title="Detalles" style={{ opacity: 0.5 }}><ChevronRight size={20} /></button>
                                        
                                        {isAdmin && (
                                            <button className="row-btn delete-btn" onClick={() => handleDelete(ticket.id)} title="Eliminar">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Technician Status Update Modal */}
            {isStatusModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ width: '450px' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem' }}>Actualizar Ticket {selectedTicket?.id}</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reportar avance del soporte técnico</p>
                            </div>
                            <button onClick={() => setIsStatusModalOpen(false)}><X size={24} /></button>
                        </header>
                        <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem', display: 'block' }}>Estado del Soporte</label>
                                <input type="hidden" required value={newStatus} />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    <button 
                                        type="button"
                                        className={`status-btn ${newStatus === 'Pendiente' ? 'active' : ''}`}
                                        onClick={() => setNewStatus('Pendiente')}
                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '1rem', borderRadius: '12px', border: newStatus === 'Pendiente' ? '2px solid var(--warning)' : '1px solid var(--surface-border)', background: newStatus === 'Pendiente' ? 'rgba(245, 158, 11, 0.05)' : 'var(--surface)', color: newStatus === 'Pendiente' ? 'var(--warning)' : 'var(--text-muted)' }}
                                    >
                                        <Clock size={24} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Pendiente</span>
                                    </button>
                                    <button 
                                        type="button"
                                        className={`status-btn ${newStatus === 'En Proceso' ? 'active' : ''}`}
                                        onClick={() => setNewStatus('En Proceso')}
                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '1rem', borderRadius: '12px', border: newStatus === 'En Proceso' ? '2px solid var(--info)' : '1px solid var(--surface-border)', background: newStatus === 'En Proceso' ? 'rgba(59, 130, 246, 0.05)' : 'var(--surface)', color: newStatus === 'En Proceso' ? 'var(--info)' : 'var(--text-muted)' }}
                                    >
                                        <PlayCircle size={24} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>En Proceso</span>
                                    </button>
                                    <button 
                                        type="button"
                                        className={`status-btn ${newStatus === 'Finalizado' ? 'active' : ''}`}
                                        onClick={() => setNewStatus('Finalizado')}
                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '1rem', borderRadius: '12px', border: newStatus === 'Finalizado' ? '2px solid var(--success)' : '1px solid var(--surface-border)', background: newStatus === 'Finalizado' ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface)', color: newStatus === 'Finalizado' ? 'var(--success)' : 'var(--text-muted)' }}
                                    >
                                        <CheckCircle size={24} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Finalizado</span>
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem', display: 'block' }}>Notas de Resolución</label>
                                <textarea 
                                    className="form-input" 
                                    rows={4} 
                                    placeholder="Detalle los trabajos realizados o el motivo de la espera..."
                                    value={techNotes}
                                    onChange={e => setTechNotes(e.target.value)}
                                    style={{ resize: 'none' }}
                                ></textarea>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
                                <Save size={20} /> Guardar Avance
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Technician Assignment Modal */}
            {isAssignModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ width: '450px' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem' }}>Asignar Técnico</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ticket ID: {selectedTicket?.id}</p>
                            </div>
                            <button onClick={() => setIsAssignModalOpen(false)}><X size={24} /></button>
                        </header>
                        <form onSubmit={handleAssignStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem', display: 'block' }}>Seleccionar Personal Técnico</label>
                                <select 
                                    className="form-input" 
                                    value={selectedStaffId} 
                                    onChange={e => setSelectedStaffId(e.target.value)}
                                    required
                                    style={{ border: '2px solid var(--primary)', fontSize: '1rem' }}
                                >
                                    <option value="">Seleccione un ingeniero o técnico...</option>
                                    {staffList.map(s => (
                                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="card" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', border: '1px dashed var(--primary)' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Al asignar, el ticket cambiará automáticamente a estado <strong>Asignado</strong> y el técnico recibirá la notificación en su panel.
                                </p>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
                                <CheckCircle size={20} /> Confirmar Asignación
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .search-input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.5rem; border-radius: var(--radius-sm); border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); outline: none; }
                .ticket-row:hover { background: rgba(99, 102, 241, 0.02); }
                .row-btn { color: var(--text-muted); padding: 4px; transition: 0.2s; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .row-btn:hover { color: var(--primary); transform: translateX(3px); }
                .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                .assign-btn { color: var(--primary); background: rgba(99, 102, 241, 0.05); border-radius: 6px; padding: 6px; }
                .assign-btn:hover { background: rgba(99, 102, 241, 0.15); transform: scale(1.1) !important; }
                .status-btn { cursor: pointer; transition: all 0.2s ease; }
                .status-btn:hover:not(.active) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .status-update-btn { color: var(--secondary); background: rgba(13, 148, 136, 0.05); border-radius: 6px; padding: 6px; }
                .status-update-btn:hover { background: rgba(13, 148, 136, 0.15); border-color: var(--secondary); transform: scale(1.1) !important; }
                .report-btn { color: var(--primary); background: rgba(99, 102, 241, 0.05); border-radius: 6px; padding: 6px; }
                .report-btn:hover { background: rgba(99, 102, 241, 0.15); transform: scale(1.1) !important; }
                .view-report-btn { background: rgba(16, 185, 129, 0.05); border-radius: 6px; padding: 6px; }
                .view-report-btn:hover { background: rgba(16, 185, 129, 0.15); transform: scale(1.1) !important; }
                .delete-btn:hover { color: var(--error) !important; background: rgba(239, 68, 68, 0.1); border-radius: 4px; transform: none; }
                .priority-tag { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 0.2rem 0.6rem; border-radius: 4px; border: 1px solid transparent; }
                .p-baja { color: var(--success); background: rgba(16, 185, 129, 0.1); }
                .p-media { color: var(--info); background: rgba(59, 130, 246, 0.1); }
                .p-alta { color: var(--warning); background: rgba(245, 158, 11, 0.1); }
                .p-crítica { color: var(--error); background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); }
                .badge { font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.8rem; border-radius: 99px; }
                .badge-nuevo { background: #e0e7ff; color: #4338ca; }
                .badge-asignado { background: #fef3c7; color: #b45309; }
                .badge-en-proceso { background: #dcfce7; color: #15803d; }
                .badge-pendiente { background: #ffedd5; color: #ea580c; }
                .badge-resuelto, .badge-terminado, .badge-solucionado, .badge-finalizado { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
                .badge-cerrado { background: #f1f5f9; color: #64748b; }
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
                .modal-content { background: var(--surface); padding: 2.5rem; border-radius: var(--radius-lg); box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
                .form-input { width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); font-family: inherit; }
            `}</style>
        </div>
    );
}
