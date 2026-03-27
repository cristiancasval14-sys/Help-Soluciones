'use client';

import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    UserPlus,
    Clock,
    Activity,
    Search,
    ArrowRight,
    User,
    ClipboardList,
    AlertCircle,
    CheckCircle,
    PlayCircle,
    Trash2
} from 'lucide-react';
import { TicketService, StaffService } from '@/lib/services';
import Link from 'next/link';

interface Ticket {
    id: string;
    client: string;
    requester: string;
    type: string;
    priority: string;
    status: string;
    date: string;
    assignedTo?: string;
    progressNotes?: string;
}

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
}

export default function AdministrativeManagement() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const fetchSession = () => {
            const session = localStorage.getItem('help_session');
            if (session) setCurrentUser(JSON.parse(session));
        };
        fetchSession();

        const fetchData = async () => {
            try {
                const [ticketData, staffData] = await Promise.all([
                    TicketService.getAll(),
                    StaffService.getAll()
                ]);

                setTickets(ticketData.map((t: any) => ({
                    id: t.id,
                    client: t.company?.name || '---',
                    requester: t.requester_name,
                    type: t.type,
                    priority: t.priority,
                    status: t.status,
                    date: t.date || t.created_at?.split('T')[0],
                    assignedTo: t.staff ? `${t.staff.first_name} ${t.staff.last_name}` : undefined,
                    progressNotes: t.tech_notes
                })));

                setStaff(staffData.map((s: any) => ({
                    id: s.id,
                    firstName: s.first_name,
                    lastName: s.last_name,
                    role: s.role
                })));
            } catch (err) {
                console.error("Error loading management data:", err);
            }
        };

        fetchData();
    }, []);

    const updateTicket = async (id: string, updates: any) => {
        try {
            await TicketService.update(id, updates);
            // Refresh
            const ticketData = await TicketService.getAll();
            setTickets(ticketData.map((t: any) => ({
                id: t.id,
                client: t.company?.name || '---',
                requester: t.requester_name,
                type: t.type,
                priority: t.priority,
                status: t.status,
                date: t.date || t.created_at?.split('T')[0],
                assignedTo: t.staff ? `${t.staff.first_name} ${t.staff.last_name}` : undefined,
                progressNotes: t.tech_notes
            })));
            setSelectedTicket(null);
        } catch (err: any) {
            alert("Error de Supabase: " + (err.message || "Fallo al actualizar estado o asignar técnico"));
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el ticket ${id}?`)) {
            try {
                await TicketService.delete(id);
                setTickets(tickets.filter(t => t.id !== id));
            } catch (err) {
                alert("Error al eliminar de Supabase. Es probable que no tengas el borrado en cascada (ON DELETE CASCADE) activo para reportes de servicio atados a este ticket.");
            }
        }
    };

    const handleAssign = async (staffId: string) => {
        if (!selectedTicket) return;
        try {
            await updateTicket(selectedTicket.id, {
                assigned_staff_id: staffId,
                status: 'Asignado'
            });
            setIsAssignModalOpen(false);
        } catch (err) {
            // Error already handled
        }
    };

    const handleStatusUpdate = async (newStatus: string, notes: string) => {
        if (!selectedTicket) return;
        try {
            await updateTicket(selectedTicket.id, {
                status: newStatus,
                tech_notes: notes
            });
            setIsStatusModalOpen(false);
        } catch (err) {
            // Error already handled
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Nuevo': return <AlertCircle size={18} color="var(--primary)" />;
            case 'Asignado': return <User size={18} color="var(--info)" />;
            case 'En Proceso': return <Activity size={18} color="var(--warning)" />;
            case 'Resuelto':
            case 'Terminado': return <CheckCircle size={18} color="var(--success)" />;
            default: return <Clock size={18} />;
        }
    };

    return (
        <div className="manage-tickets-page fade-in">
            <header style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <Link href="/dashboard" className="btn glass" style={{ padding: '0.6rem' }}>
                    <LayoutDashboard size={20} />
                </Link>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestión Tickets</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Panel administrativo para despacho y seguimiento técnico</p>
                </div>
            </header>

            <div className="management-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div className="table-container glass" style={{ padding: '1rem', borderRadius: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)' }}>
                                <th style={{ padding: '1.2rem' }}>Ticket / Cliente</th>
                                <th>Prioridad</th>
                                <th>Estado Actual</th>
                                <th>Técnico Asignado</th>
                                <th style={{ textAlign: 'right', paddingRight: '1.2rem' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map(ticket => (
                                <tr key={ticket.id} className="row-hover" style={{ borderBottom: '1px solid var(--surface-border)' }}>
                                    <td style={{ padding: '1.2rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{ticket.id}</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{ticket.client}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`p-tag p-${ticket.priority.toLowerCase().replace('í', 'i')}`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {getStatusIcon(ticket.status)}
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ticket.status}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {ticket.assignedTo ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--info)', fontWeight: 600 }}>
                                                <User size={16} /> {ticket.assignedTo}
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem italic' }}>Sin asignar</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '1.2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            {currentUser?.role === 'Administrador' && (
                                                <button
                                                    className="action-btn delete"
                                                    title="Eliminar Ticket"
                                                    onClick={() => handleDelete(ticket.id)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                            <button
                                                className="action-btn assign"
                                                title="Asignar Técnico"
                                                onClick={() => { setSelectedTicket(ticket); setIsAssignModalOpen(true); }}
                                            >
                                                <UserPlus size={18} />
                                            </button>
                                            <button
                                                className="action-btn update"
                                                title="Actualizar Progreso"
                                                onClick={() => { setSelectedTicket(ticket); setIsStatusModalOpen(true); }}
                                                disabled={!ticket.assignedTo}
                                            >
                                                <Activity size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assignment Modal */}
            {isAssignModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass fade-in">
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <UserPlus color="var(--primary)" /> Asignar Técnico
                        </h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Seleccione el profesional para atender el ticket <strong>{selectedTicket?.id}</strong>
                        </p>
                        <div className="staff-list" style={{ display: 'grid', gap: '10px' }}>
                            {staff.map(s => (
                                <button
                                    key={s.id}
                                    className="staff-option glass"
                                    onClick={() => handleAssign(s.id)}
                                >
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={{ fontWeight: 700 }}>{s.firstName} {s.lastName}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{s.role}</p>
                                    </div>
                                    <ArrowRight size={18} />
                                </button>
                            ))}
                        </div>
                        <button className="btn glass" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setIsAssignModalOpen(false)}>Cancelar</button>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {isStatusModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass fade-in" style={{ width: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ClipboardList color="var(--warning)" /> Registro de Proceso
                        </h2>
                        <div className="status-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
                            {[
                                { label: 'Pendiente', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.05)', icon: <Clock size={24} /> },
                                { label: 'En Proceso', color: 'var(--info)', bg: 'rgba(59, 130, 246, 0.05)', icon: <PlayCircle size={24} /> },
                                { label: 'Terminado', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.05)', icon: <CheckCircle size={24} /> }
                            ].map(st => (
                                <button
                                    key={st.label}
                                    className="status-btn"
                                    onClick={() => handleStatusUpdate(st.label, (document.getElementById('prog-notes') as HTMLTextAreaElement).value)}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '1rem', borderRadius: '12px', border: `1px solid ${st.color}`, background: st.bg, color: st.color, transition: '0.2s' }}
                                >
                                    {st.icon}
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{st.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Notas de Seguimiento</label>
                            <textarea
                                id="prog-notes"
                                className="form-input"
                                rows={4}
                                placeholder="Describa el avance o solución..."
                                defaultValue={selectedTicket?.progressNotes || ''}
                            ></textarea>
                        </div>
                        <button className="btn glass" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setIsStatusModalOpen(false)}>Cerrar</button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .row-hover:hover { background: rgba(0,0,0,0.02); }
                .p-tag { font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
                .p-baja { background: rgba(16, 185, 129, 0.1); color: var(--success); }
                .p-media { background: rgba(59, 130, 246, 0.1); color: var(--info); }
                .p-alta { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
                .p-critica { background: rgba(239, 68, 68, 0.1); color: var(--error); }

                .action-btn { padding: 8px; border-radius: 8px; border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-muted); cursor: pointer; transition: 0.2s; }
                .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .action-btn.assign:hover { color: var(--primary); border-color: var(--primary); }
                .action-btn.update:hover { color: var(--warning); border-color: var(--warning); }
                .action-btn.delete:hover { color: var(--error); border-color: var(--error); background: rgba(239, 68, 68, 0.05); }
                .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
                .modal-content { background: var(--surface); padding: 2.5rem; border-radius: 16px; width: 400px; box-shadow: 0 30px 60px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto; border: 1px solid var(--surface-border); }
                
                .staff-option { width: 100%; padding: 1.2rem; display: flex; align-items: center; justify-content: space-between; border-radius: 12px; transition: 0.2s; cursor: pointer; border: 1px solid transparent; }
                .staff-option:hover { background: var(--primary-glow); border-color: var(--primary); transform: translateX(5px); }
                
                .status-btn { padding: 1rem; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .status-btn:hover { background: var(--primary-glow); color: var(--primary); }
                
                .form-input { width: 100%; padding: 1rem; border-radius: 10px; border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); font-family: inherit; resize: none; outline: none; }
                .form-input:focus { border-color: var(--primary); }
            `}</style>
        </div>
    );
}
