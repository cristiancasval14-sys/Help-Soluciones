'use client';

import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    X,
    Save,
    Clock,
    MapPin,
    User,
    Building2,
    Calendar as CalendarIcon,
    Trash2,
    Navigation,
    Users,
    AlertCircle
} from 'lucide-react';
import { StaffService, CompanyService, VisitService } from '@/lib/services';

interface Visit {
    id: string;
    date: string;
    time: string;
    technicianId: string;
    technicianName: string;
    companyId: string;
    companyName: string;
    sedeId?: string;
    sedeName?: string;
    description: string;
    status: 'Programada' | 'En Curso' | 'Completada' | 'Cancelada';
    lat?: string;
    lng?: string;
    isAllDay?: boolean;
}

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
}

interface Company {
    id: string;
    name: string;
    lat: string;
    lng: string;
    sedes: { id: string; name: string; lat: string; lng: string; }[];
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [visits, setVisits] = useState<Visit[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
    const [filterTechnician, setFilterTechnician] = useState('');

    const [visitForm, setVisitForm] = useState({
        date: '',
        time: '09:00',
        isAllDay: false,
        technicianId: '',
        companyId: '',
        sedeId: '',
        description: '',
        status: 'Programada' as Visit['status']
    });

    const [currentUser, setCurrentUser] = useState<any>(null);

    // Load data
    useEffect(() => {
        const session = localStorage.getItem('help_session');
        const user = session ? JSON.parse(session) : null;
        setCurrentUser(user);

        const fetchData = async () => {
            let loadedStaff: Staff[] = [];
            try {
                const staffData = await StaffService.getAll();
                loadedStaff = staffData.map((s: any) => ({
                    id: s.id,
                    firstName: s.first_name,
                    lastName: s.last_name,
                    role: s.role
                }));
                setStaff(loadedStaff);
            } catch (err: any) {
                console.error("Error loading staff:", err);
            }

            try {
                const companyData = await CompanyService.getAll();
                setCompanies(companyData as any[]);
            } catch (err: any) {
                console.error("Error loading companies:", err);
            }

            try {
                const visitData = await VisitService.getAll();
                let visitsList = visitData.map((v: any) => {
                    const tech = loadedStaff.find(s => s.id === v.technician_id);
                    return {
                        id: v.id,
                        date: v.date,
                        time: v.time,
                        technicianId: v.technician_id,
                        technicianName: tech ? `${tech.firstName} ${tech.lastName}` : 'No asignado',
                        companyId: v.company_id,
                        companyName: v.company?.name || '',
                        sedeId: v.sede_id,
                        sedeName: v.sede?.name || 'Sede Principal',
                        description: v.description,
                        status: v.status,
                        lat: v.lat,
                        lng: v.lng,
                        isAllDay: v.is_all_day
                    };
                });

                // --- Technician Role Logic ---
                if (user && user.role === 'Técnico') {
                    // Find the staff entry for this user
                    const staffMember = loadedStaff.find(s =>
                        `${s.firstName} ${s.lastName}`.trim().toLowerCase() === user.assignedTo?.trim().toLowerCase()
                    );
                    if (staffMember) {
                        visitsList = visitsList.filter(v => v.technicianId === staffMember.id);
                        setFilterTechnician(staffMember.id);
                    }
                }

                setVisits(visitsList);
            } catch (err: any) {
                console.error("Error loading visits:", err);
            }
        };

        fetchData();
    }, []);


    // Calendar helpers
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    const getDateStr = (day: number) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const getVisitsForDate = (dateStr: string) => {
        return visits.filter(v => {
            const matches = v.date === dateStr;
            if (filterTechnician) return matches && v.technicianId === filterTechnician;
            return matches;
        });
    };

    const openNewVisit = (dateStr: string) => {
        setSelectedVisit(null);
        setVisitForm({
            date: dateStr,
            time: '09:00',
            isAllDay: false,
            technicianId: '',
            companyId: '',
            sedeId: '',
            description: '',
            status: 'Programada'
        });
        setSelectedDate(dateStr);
        setIsModalOpen(true);
    };

    const handleSaveVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const tech = staff.find(s => s.id === visitForm.technicianId);
            const comp = companies.find(c => c.id === visitForm.companyId);
            const sede = comp?.sedes?.find((s: any) => s.id === visitForm.sedeId);

            const payload = {
                date: visitForm.date,
                time: visitForm.time,
                technician_id: visitForm.technicianId,
                company_id: visitForm.companyId,
                sede_id: visitForm.sedeId || null,
                description: visitForm.description,
                status: visitForm.status,
                lat: sede?.lat || comp?.lat || '',
                lng: sede?.lng || comp?.lng || '',
                is_all_day: visitForm.isAllDay
            };

            let saved;
            if (selectedVisit) {
                saved = await VisitService.update(selectedVisit.id, payload);
            } else {
                saved = await VisitService.create(payload);
            }

            // Refresh visits (could be optimized)
            const visitData = await VisitService.getAll();
            setVisits(visitData.map((v: any) => {
                const tInfo = staff.find(s => s.id === v.technician_id);
                return {
                    id: v.id,
                    date: v.date,
                    time: v.time,
                    technicianId: v.technician_id,
                    technicianName: tInfo ? `${tInfo.firstName} ${tInfo.lastName}` : 'No asignado',
                    companyId: v.company_id,
                    companyName: v.company?.name || '',
                    sedeId: v.sede_id,
                    sedeName: v.sede?.name || 'Sede Principal',
                    description: v.description,
                    status: v.status,
                    lat: v.lat,
                    lng: v.lng,
                    isAllDay: v.is_all_day
                };
            }));

            setIsModalOpen(false);
        } catch (err: any) {
            alert("Error al guardar visita: " + (err.message || 'Error desconocido'));
        }
    };

    const statusColors: Record<string, { bg: string; color: string; border: string }> = {
        'Programada': { bg: 'rgba(37,99,235,0.1)', color: '#2563eb', border: 'rgba(37,99,235,0.3)' },
        'En Curso': { bg: 'rgba(245,158,11,0.1)', color: '#d97706', border: 'rgba(245,158,11,0.3)' },
        'Completada': { bg: 'rgba(5,150,105,0.1)', color: '#059669', border: 'rgba(5,150,105,0.3)' },
        'Cancelada': { bg: 'rgba(239,68,68,0.08)', color: '#dc2626', border: 'rgba(239,68,68,0.2)' }
    };

    const selectedCompany = companies.find(c => c.id === visitForm.companyId);

    // Calendar grid
    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

    // Week view
    const getWeekDays = () => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const filteredVisits = filterTechnician
        ? visits.filter(v => v.technicianId === filterTechnician)
        : visits;

    const upcomingVisits = filteredVisits
        .filter(v => v.date >= todayStr && v.status !== 'Cancelada')
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
        .slice(0, 5);
    const isAdmin = currentUser?.role === 'Administrador';

    return (
        <div className="calendar-page fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>{isAdmin ? 'Asignar Visita' : 'Visitas Programadas'}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{isAdmin ? 'Programación y asignación de visitas técnicas a empresas' : 'Visualización de sus visitas programadas'}</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => openNewVisit(todayStr)}>
                        <Plus size={20} /> Nueva Visita
                    </button>
                )}
            </header>

            {/* Toolbar */}
            <div className="glass" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={20} /></button>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, minWidth: '200px', textAlign: 'center' }}>
                        {monthNames[month]} {year}
                    </h2>
                    <button onClick={nextMonth} className="nav-btn"><ChevronRight size={20} /></button>
                    <button onClick={goToday} className="btn glass" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Hoy</button>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => setViewMode('month')} className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}>Mes</button>
                        <button onClick={() => setViewMode('week')} className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}>Semana</button>
                    </div>
                    {isAdmin && (
                        <select className="filter-select" value={filterTechnician} onChange={e => setFilterTechnician(e.target.value)}>
                            <option value="">Todos los técnicos</option>
                            {staff.map(s => (
                                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
                {/* Calendar Grid */}
                <div className="card glass" style={{ padding: '1.5rem' }}>
                    {viewMode === 'month' ? (
                        <>
                            <div className="calendar-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', marginBottom: '0.5rem' }}>
                                {dayNames.map(d => (
                                    <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.5rem', textTransform: 'uppercase' }}>{d}</div>
                                ))}
                            </div>
                            <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                {calendarDays.map((day, idx) => {
                                    if (day === null) return <div key={`empty-${idx}`} className="calendar-cell empty" />;
                                    const dateStr = getDateStr(day);
                                    const dayVisits = getVisitsForDate(dateStr);
                                    const isToday = dateStr === todayStr;
                                    return (
                                        <div key={dateStr} className={`calendar-cell ${isToday ? 'today' : ''} ${dayVisits.length > 0 ? 'has-visits' : ''}`}
                                            onClick={() => isAdmin && openNewVisit(dateStr)} style={{ cursor: isAdmin ? 'pointer' : 'default' }}>
                                            <span className={`day-number ${isToday ? 'today-badge' : ''}`}>{day}</span>
                                            {dayVisits.slice(0, 3).map(v => (
                                                <div key={v.id} className="visit-pill"
                                                    style={{ background: statusColors[v.status]?.bg, color: statusColors[v.status]?.color, borderLeft: `3px solid ${statusColors[v.status]?.color}` }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isAdmin) {
                                                            setSelectedVisit(v);
                                                            setVisitForm({
                                                                date: v.date, time: v.time, isAllDay: !!v.isAllDay, technicianId: v.technicianId,
                                                                companyId: v.companyId, sedeId: v.sedeId || '', description: v.description, status: v.status
                                                            });
                                                            setIsModalOpen(true);
                                                        } else {
                                                            // For tech, maybe just show details (future)
                                                            setSelectedVisit(v);
                                                            setVisitForm({
                                                                date: v.date, time: v.time, isAllDay: !!v.isAllDay, technicianId: v.technicianId,
                                                                companyId: v.companyId, sedeId: v.sedeId || '', description: v.description, status: v.status
                                                            });
                                                            setIsModalOpen(true); // Open modal read-only
                                                        }
                                                    }}>
                                                    <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>{v.isAllDay ? 'Todo el día' : v.time}</span>
                                                    <span style={{ fontSize: '0.6rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.companyName}</span>
                                                </div>
                                            ))}
                                            {dayVisits.length > 3 && (
                                                <span style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 700 }}>+{dayVisits.length - 3} más</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : viewMode === 'week' ? (
                        /* Week View */
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gap: '2px' }}>
                                <div />
                                {getWeekDays().map(d => {
                                    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                    const isT = ds === todayStr;
                                    return (
                                        <div key={ds} style={{ textAlign: 'center', padding: '0.8rem', borderBottom: '2px solid var(--surface-border)', background: isT ? 'var(--primary-glow)' : 'transparent', borderRadius: isT ? '8px 8px 0 0' : '0' }}>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{dayNames[d.getDay()]}</p>
                                            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: isT ? 'var(--primary)' : 'var(--text-main)' }}>{d.getDate()}</p>
                                        </div>
                                    );
                                })}
                                <React.Fragment key="all-day">
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0.8rem 0.5rem', borderTop: '1px solid var(--surface-border)', background: 'var(--primary-glow)' }}>Día</div>
                                    {getWeekDays().map(d => {
                                        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                        const dayVisits = getVisitsForDate(ds).filter(v => !!v.isAllDay);
                                        return (
                                            <div key={`${ds}-allday`} className="week-cell" style={{ background: 'var(--primary-glow)' }} onClick={() => { setSelectedDate(ds); openNewVisit(ds); }}>
                                                {dayVisits.map(v => (
                                                    <div key={v.id} className="visit-pill-week" style={{ background: statusColors[v.status]?.bg, color: statusColors[v.status]?.color, borderLeft: `3px solid ${statusColors[v.status]?.color}` }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedVisit(v);
                                                            setVisitForm({ date: v.date, time: v.time, isAllDay: !!v.isAllDay, technicianId: v.technicianId, companyId: v.companyId, sedeId: v.sedeId || '', description: v.description, status: v.status });
                                                            setIsModalOpen(true);
                                                        }}>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{v.technicianName}</span>
                                                        <span style={{ fontSize: '0.6rem' }}>{v.companyName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                                {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(hour => (
                                    <React.Fragment key={hour}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0.8rem 0.5rem', borderTop: '1px solid var(--surface-border)' }}>{hour}</div>
                                        {getWeekDays().map(d => {
                                            const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                            const hourVisits = getVisitsForDate(ds).filter(v => !v.isAllDay && v.time.startsWith(hour.split(':')[0]));
                                            return (
                                                <div key={`${ds}-${hour}`} className="week-cell" onClick={() => { setSelectedDate(ds); openNewVisit(ds); }}>
                                                    {hourVisits.map(v => (
                                                        <div key={v.id} className="visit-pill-week" style={{ background: statusColors[v.status]?.bg, color: statusColors[v.status]?.color, borderLeft: `3px solid ${statusColors[v.status]?.color}` }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedVisit(v);
                                                                setVisitForm({ date: v.date, time: v.time, isAllDay: !!v.isAllDay, technicianId: v.technicianId, companyId: v.companyId, sedeId: v.sedeId || '', description: v.description, status: v.status });
                                                                setIsModalOpen(true);
                                                            }}>
                                                            <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{v.technicianName}</span>
                                                            <span style={{ fontSize: '0.6rem' }}>{v.companyName}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Day View */
                        <div>
                            <div style={{ padding: '0.8rem', borderBottom: '2px solid var(--surface-border)', textAlign: 'center', background: 'var(--primary-glow)', borderRadius: '8px 8px 0 0' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>{dayNames[currentDate.getDay()]} {currentDate.getDate()} {monthNames[currentDate.getMonth()]}</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '2px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, padding: '1rem', borderBottom: '1px solid var(--surface-border)', textAlign: 'right', background: 'var(--primary-glow)' }}>Día</div>
                                <div className="week-cell" style={{ borderBottom: '1px solid var(--surface-border)', background: 'var(--primary-glow)', display: 'flex', flexDirection: 'column', gap: '4px', padding: '0.5rem' }} onClick={() => { setSelectedDate(getDateStr(currentDate.getDate())); openNewVisit(getDateStr(currentDate.getDate())); }}>
                                    {getVisitsForDate(getDateStr(currentDate.getDate())).filter(v => !!v.isAllDay).map(v => (
                                        <div key={v.id} className="visit-pill-week" style={{ background: statusColors[v.status]?.bg, color: statusColors[v.status]?.color, borderLeft: `3px solid ${statusColors[v.status]?.color}`, padding: '0.5rem' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedVisit(v);
                                                setVisitForm({ date: v.date, time: v.time, isAllDay: !!v.isAllDay, technicianId: v.technicianId, companyId: v.companyId, sedeId: v.sedeId || '', description: v.description, status: v.status });
                                                setIsModalOpen(true);
                                            }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{v.technicianName}</span>
                                            <span style={{ fontSize: '0.75rem' }}>{v.companyName} - {v.description}</span>
                                        </div>
                                    ))}
                                </div>
                                {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(hour => {
                                    const ds = getDateStr(currentDate.getDate());
                                    const hourVisits = getVisitsForDate(ds).filter(v => !v.isAllDay && v.time.startsWith(hour.split(':')[0]));
                                    return (
                                        <React.Fragment key={hour}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, padding: '1rem', borderTop: '1px solid var(--surface-border)', textAlign: 'right' }}>{hour}</div>
                                            <div className="week-cell" style={{ borderTop: '1px solid var(--surface-border)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }} onClick={() => { setSelectedDate(ds); openNewVisit(ds); }}>
                                                {hourVisits.map(v => (
                                                    <div key={v.id} className="visit-pill-week" style={{ background: statusColors[v.status]?.bg, color: statusColors[v.status]?.color, borderLeft: `3px solid ${statusColors[v.status]?.color}`, padding: '0.5rem' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedVisit(v);
                                                            setVisitForm({ date: v.date, time: v.time, isAllDay: !!v.isAllDay, technicianId: v.technicianId, companyId: v.companyId, sedeId: v.sedeId || '', description: v.description, status: v.status });
                                                            setIsModalOpen(true);
                                                        }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{v.technicianName}</span>
                                                        <span style={{ fontSize: '0.75rem' }}>{v.companyName} - {v.description}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </React.Fragment>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar - Upcoming Visits */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Stats */}
                    <div className="card glass">
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CalendarIcon size={18} color="var(--primary)" /> Resumen del Mes
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                            {[
                                { label: 'Programadas', count: visits.filter(v => v.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`) && v.status === 'Programada').length, color: '#2563eb' },
                                { label: 'En Curso', count: visits.filter(v => v.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`) && v.status === 'En Curso').length, color: '#d97706' },
                                { label: 'Completadas', count: visits.filter(v => v.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`) && v.status === 'Completada').length, color: '#059669' },
                                { label: 'Canceladas', count: visits.filter(v => v.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`) && v.status === 'Cancelada').length, color: '#dc2626' }
                            ].map(stat => (
                                <div key={stat.label} style={{ padding: '0.6rem', borderRadius: '8px', background: `${stat.color}10`, textAlign: 'center' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.count}</p>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming */}
                    <div className="card glass">
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} color="var(--warning)" /> Próximas Visitas
                        </h3>
                        {upcomingVisits.length === 0 ? (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                                No hay visitas programadas
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {upcomingVisits.map(v => (
                                    <div key={v.id} style={{
                                        padding: '0.8rem', borderRadius: '8px', border: `1px solid ${statusColors[v.status]?.border}`,
                                        background: statusColors[v.status]?.bg, cursor: 'pointer', transition: '0.2s'
                                    }} onClick={() => {
                                        setSelectedVisit(v);
                                        setVisitForm({ date: v.date, time: v.time, isAllDay: !!v.isAllDay, technicianId: v.technicianId, companyId: v.companyId, sedeId: v.sedeId || '', description: v.description, status: v.status });
                                        setIsModalOpen(true);
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: statusColors[v.status]?.color }}>{v.date} · {v.isAllDay ? 'Todo el día' : v.time}</span>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: statusColors[v.status]?.bg, color: statusColors[v.status]?.color }}>{v.status}</span>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>{v.companyName}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <User size={12} /> {v.technicianName}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="card glass" style={{ padding: '1rem' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>LEYENDA</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {Object.entries(statusColors).map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: v.color }} />
                                    <span>{k}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Visit Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ width: '520px' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <div>
                                <h2>{selectedVisit ? 'Editar Visita' : 'Programar Visita'}</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {visitForm.date && `📅 ${visitForm.date}`}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </header>
                        <form onSubmit={handleSaveVisit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: visitForm.isAllDay ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Fecha</label>
                                    <input type="date" className="form-input" value={visitForm.date} onChange={e => setVisitForm({ ...visitForm, date: e.target.value })} required disabled={!isAdmin} />
                                </div>
                                {!visitForm.isAllDay && (
                                    <div className="form-group">
                                        <label>Hora</label>
                                        <input type="time" className="form-input" value={visitForm.time} onChange={e => setVisitForm({ ...visitForm, time: e.target.value })} required disabled={!isAdmin} />
                                    </div>
                                )}
                            </div>
                            <div className="form-group" style={{ marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isAdmin ? 'pointer' : 'default', margin: 0 }}>
                                    <input type="checkbox" style={{ width: '16px', height: '16px' }} checked={visitForm.isAllDay} onChange={e => setVisitForm({ ...visitForm, isAllDay: e.target.checked })} disabled={!isAdmin} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Asignar por todo el día</span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label>Técnico Asignado</label>
                                <select className="form-input" value={visitForm.technicianId} onChange={e => setVisitForm({ ...visitForm, technicianId: e.target.value })} required disabled={!isAdmin}>
                                    <option value="">Seleccionar técnico...</option>
                                    {staff.map(s => (
                                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.role}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Empresa</label>
                                <select className="form-input" value={visitForm.companyId} onChange={e => setVisitForm({ ...visitForm, companyId: e.target.value, sedeId: '' })} required disabled={!isAdmin}>
                                    <option value="">Seleccionar empresa...</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedCompany && selectedCompany.sedes && selectedCompany.sedes.length > 0 && (
                                <div className="form-group fade-in">
                                    <label>Sede</label>
                                    <select className="form-input" value={visitForm.sedeId} onChange={e => setVisitForm({ ...visitForm, sedeId: e.target.value })} disabled={!isAdmin}>
                                        <option value="">Sede Principal</option>
                                        {selectedCompany.sedes.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedCompany && (
                                <div className="fade-in" style={{ padding: '0.8rem', borderRadius: '8px', background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.2)' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.3rem' }}>
                                        <Navigation size={14} /> Ubicación de destino
                                    </p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                                        📍 Lat: {visitForm.sedeId ? selectedCompany.sedes?.find((s: any) => s.id === visitForm.sedeId)?.lat || selectedCompany.lat : selectedCompany.lat},
                                        Lng: {visitForm.sedeId ? selectedCompany.sedes?.find((s: any) => s.id === visitForm.sedeId)?.lng || selectedCompany.lng : selectedCompany.lng}
                                    </p>
                                    <a href={`https://www.google.com/maps?q=${visitForm.sedeId ? selectedCompany.sedes?.find((s: any) => s.id === visitForm.sedeId)?.lat || selectedCompany.lat : selectedCompany.lat},${visitForm.sedeId ? selectedCompany.sedes?.find((s: any) => s.id === visitForm.sedeId)?.lng || selectedCompany.lng : selectedCompany.lng}`}
                                        target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                                        Ver en Google Maps ↗
                                    </a>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Descripción / Motivo</label>
                                <textarea className="form-input" value={visitForm.description} onChange={e => setVisitForm({ ...visitForm, description: e.target.value })}
                                    rows={3} placeholder="Describa el motivo de la visita..." required disabled={!isAdmin} style={{ resize: 'none' }} />
                            </div>

                            {selectedVisit && (
                                <div className="form-group">
                                    <label>Estado</label>
                                    <select className="form-input" value={visitForm.status} onChange={e => setVisitForm({ ...visitForm, status: e.target.value as Visit['status'] })} disabled={!isAdmin}>
                                        <option value="Programada">Programada</option>
                                        <option value="En Curso">En Curso</option>
                                        <option value="Completada">Completada</option>
                                        <option value="Cancelada">Cancelada</option>
                                    </select>
                                </div>
                            )}

                            {isAdmin && (
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                        <Save size={20} /> {selectedVisit ? 'Actualizar' : 'Programar'} Visita
                                    </button>
                                    {selectedVisit && (
                                        <button type="button" className="btn" style={{ color: 'var(--error)', border: '1px solid var(--error)', padding: '0.6rem 1rem' }}
                                            onClick={async () => {
                                                if (confirm('¿Eliminar esta visita?')) {
                                                    try {
                                                        await VisitService.delete(selectedVisit.id);
                                                        setVisits(visits.filter(v => v.id !== selectedVisit.id));
                                                        setIsModalOpen(false);
                                                    } catch (err) {
                                                        alert("Error al eliminar visita");
                                                    }
                                                }
                                            }}>
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            )}
                            {!isAdmin && (
                                <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Vista de solo lectura</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Solo el administrador puede modificar las visitas programadas.</p>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .nav-btn { padding: 0.5rem; border-radius: 8px; color: var(--text-main); border: 1px solid var(--surface-border); background: var(--surface); cursor: pointer; transition: 0.2s; }
                .nav-btn:hover { background: var(--primary-glow); color: var(--primary); border-color: var(--primary); }
                .view-btn { padding: 0.4rem 0.8rem; font-size: 0.8rem; font-weight: 600; border-radius: 6px; border: 1px solid var(--surface-border); background: var(--surface); cursor: pointer; transition: 0.2s; color: var(--text-muted); }
                .view-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
                .filter-select { padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 6px; border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); font-family: inherit; }

                .calendar-cell { min-height: 90px; padding: 0.4rem; border: 1px solid var(--surface-border); border-radius: 6px; cursor: pointer; transition: 0.15s; display: flex; flex-direction: column; gap: 2px; }
                .calendar-cell:hover { background: rgba(37,99,235,0.03); border-color: var(--primary); }
                .calendar-cell.empty { background: transparent; border: none; cursor: default; }
                .calendar-cell.today { background: rgba(37,99,235,0.05); border-color: var(--primary); }
                .calendar-cell.has-visits { background: rgba(0,0,0,0.01); }

                .day-number { font-size: 0.8rem; font-weight: 600; color: var(--text-main); margin-bottom: 2px; }
                .today-badge { background: var(--primary); color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.75rem; }

                .visit-pill { padding: 2px 4px; border-radius: 4px; display: flex; flex-direction: column; cursor: pointer; transition: 0.15s; }
                .visit-pill:hover { transform: scale(1.02); filter: brightness(0.95); }

                .week-cell { min-height: 50px; padding: 0.3rem; border-top: 1px solid var(--surface-border); cursor: pointer; transition: 0.15s; }
                .week-cell:hover { background: rgba(37,99,235,0.03); }
                .visit-pill-week { padding: 3px 6px; border-radius: 4px; margin-bottom: 2px; cursor: pointer; display: flex; flex-direction: column; }

                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
                .modal-content { background: var(--surface); padding: 2.5rem; border-radius: var(--radius-lg); box-shadow: 0 20px 50px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
                .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--text-muted); }
                .form-input { width: 100%; padding: 0.7rem; border-radius: 8px; border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); font-family: inherit; font-size: 0.9rem; outline: none; }
                .form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
                .fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
