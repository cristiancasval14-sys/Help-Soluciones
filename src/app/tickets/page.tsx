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
    ClipboardCheck
} from 'lucide-react';
import Link from 'next/link';

import { TicketService } from '@/lib/services';
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

    // Status management state
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [techNotes, setTechNotes] = useState('');

    useEffect(() => {
        const fetchTickets = async () => {
            const session = localStorage.getItem('help_session');
            const user = session ? JSON.parse(session) : null;
            setCurrentUser(user);

            try {
                const data = await TicketService.getAll();
                let filtered = data;
                
                if (user && user.role !== 'Administrador') {
                    if (user.role === 'Técnico') {
                        filtered = data.filter((t: any) => (t.staff?.first_name + ' ' + t.staff?.last_name) === user.assignedTo);
                    } else if (user.role === 'Cliente') {
                        filtered = data.filter((t: any) => t.company?.name === user.assignedTo);
                    }
                }
                setTickets(filtered as Ticket[]);
            } catch (err) {
                console.error("Error connecting to Supabase:", err);
            }
        };

        fetchTickets();
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
        } catch (err) {
            alert("Error al actualizar en Supabase");
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
        { label: 'Total Tickets', value: tickets.length.toString(), color: 'var(--primary)', icon: TicketIcon },
        { label: 'Urgentes', value: tickets.filter(t => t.priority === 'Crítica' || t.priority === 'Alta').length.toString(), color: 'var(--error)', icon: AlertTriangle },
        { label: 'En Proceso', value: tickets.filter(t => ['En Proceso', 'Asignado', 'Pendiente'].includes(t.status)).length.toString(), color: 'var(--warning)', icon: Clock },
        { label: 'Resueltos', value: tickets.filter(st => ['Resuelto', 'Terminado', 'Cerrado', 'Solucionado', 'Finalizado'].includes(st.status)).length.toString(), color: 'var(--success)', icon: CheckCircle },
    ];

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
                <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    {stats.map(stat => (
                        <div key={stat.label} className="card glass stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem' }}>
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
                        {tickets.map(ticket => (
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
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        {isTech && (ticket.staff?.first_name + ' ' + ticket.staff?.last_name === currentUser?.assignedTo) && (
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
                                                <ClipboardCheck size={18} />
                                            </button>
                                        )}
                                        <button className="row-btn" title="Detalles"><ChevronRight size={20} /></button>
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
                                <select 
                                    className="form-input" 
                                    value={newStatus} 
                                    onChange={e => setNewStatus(e.target.value)}
                                    required
                                    style={{ border: '2px solid var(--primary)' }}
                                >
                                    <option value="Pendiente">Pendiente por hacer</option>
                                    <option value="En Proceso">En proceso</option>
                                    <option value="Finalizado">Finalizado</option>
                                </select>
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

            <style jsx>{`
                .search-input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.5rem; border-radius: var(--radius-sm); border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); outline: none; }
                .ticket-row:hover { background: rgba(99, 102, 241, 0.02); }
                .row-btn { color: var(--text-muted); padding: 4px; transition: 0.2s; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .row-btn:hover { color: var(--primary); transform: translateX(3px); }
                .status-update-btn { color: var(--secondary); background: rgba(13, 148, 136, 0.05); border-radius: 6px; padding: 6px; }
                .status-update-btn:hover { background: rgba(13, 148, 136, 0.15); border-color: var(--secondary); transform: scale(1.1) !important; }
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
