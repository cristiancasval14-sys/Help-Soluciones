'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

import {
    Plus,
    Search,
    Building2,
    MapPin,
    Hash,
    Users,
    X,
    Save,
    Trash2,
    Edit2,
    Mail,
    Navigation,
    Globe,
    ChevronRight,
    ChevronDown
} from 'lucide-react';

import { CompanyService } from '@/lib/services';

interface Sede {
    id: string;
    company_id: string;
    name: string;
    lat: string;
    lng: string;
}

interface Employee {
    id: string;
    company_id: string;
    name: string;
    email: string;
    phone: string;
}

interface Company {
    id: string;
    name: string;
    nit: string;
    lat: string;
    lng: string;
    email: string;
    employees: Employee[];
    sedes: Sede[];
}

// Portal wrapper to render modal above all layout containers
function ModalPortal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    return ReactDOM.createPortal(children, document.body);
}

export default function ClientsPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCompany, setActiveCompany] = useState<Company | null>(null);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isSedeModalOpen, setIsSedeModalOpen] = useState(false);
    const [editingSede, setEditingSede] = useState<Sede | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'sedes'>('info');

    const [companyForm, setCompanyForm] = useState({ name: '', nit: '', lat: '', lng: '', email: '' });
    const [employeeForm, setEmployeeForm] = useState({ name: '', email: '', phone: '' });
    const [sedeForm, setSedeForm] = useState({ name: '', lat: '', lng: '' });
    const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

    const fetchCompanies = async () => {
        const session = localStorage.getItem('help_session');
        const user = session ? JSON.parse(session) : null;
        setCurrentUser(user);

        try {
            const data = await CompanyService.getAll();
            let list: Company[] = data as any;

            if (user && user.role === 'Cliente') {
                const filtered = list.filter(c => c.name?.trim().toLowerCase() === user.assignedTo?.trim().toLowerCase());
                setCompanies(filtered);
                if (filtered.length > 0) setExpandedCompany(filtered[0].id);
            } else {
                setCompanies(list);
            }
        } catch (err) {
            console.error("Error fetching companies:", err);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleSaveCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (activeCompany) {
                await CompanyService.update(activeCompany.id, companyForm);
            } else {
                await CompanyService.create(companyForm);
            }
            await fetchCompanies();
            setIsModalOpen(false);
            setActiveCompany(null);
        } catch (err) {
            alert("Error al guardar empresa");
        }
    };

    const handleSaveEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCompany) return;
        try {
            if (editingEmployee) {
                await CompanyService.updateEmployee(editingEmployee.id, employeeForm);
            } else {
                await CompanyService.addEmployee({ company_id: activeCompany.id, ...employeeForm });
            }
            await fetchCompanies();
            setIsEmployeeModalOpen(false);
            setEditingEmployee(null);
            setEmployeeForm({ name: '', email: '', phone: '' });
        } catch (err) {
            alert("Error al guardar empleado");
        }
    };

    const handleSaveSede = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCompany) return;
        try {
            if (editingSede) {
                await CompanyService.updateSede(editingSede.id, sedeForm);
            } else {
                await CompanyService.addSede({ company_id: activeCompany.id, ...sedeForm });
            }
            await fetchCompanies();
            setIsSedeModalOpen(false);
            setEditingSede(null);
            setSedeForm({ name: '', lat: '', lng: '' });
        } catch (err) {
            alert("Error al guardar sede");
        }
    };

    const isAdmin = currentUser?.role === 'Administrador';
    const isClient = currentUser?.role === 'Cliente';

    // Filter companies
    const filteredCompanies = companies.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nit?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats
    const totalCompanies = companies.length;
    const totalEmployees = companies.reduce((acc, c) => acc + (c.employees?.length || 0), 0);
    const totalSedes = companies.reduce((acc, c) => acc + (c.sedes?.length || 0), 0);

    return (
        <div className="clients-page fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
                        {isClient ? `Mi Empresa: ${currentUser?.assignedTo}` : 'Gestión de Clientes'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {isClient ? 'Gestión central de sedes y personal autorizado' : 'Administración de organizaciones, centros de costos y usuarios finales'}
                    </p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => { setActiveCompany(null); setCompanyForm({ name: '', nit: '', lat: '', lng: '', email: '' }); setIsModalOpen(true); }}>
                        <Plus size={20} /> Registrar Cliente
                    </button>
                )}
            </header>

            {/* Stats Bar */}
            {!isClient && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="card glass stat-card" style={{ padding: '1.2rem', borderLeft: '4px solid var(--primary)' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Total Empresas</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Building2 size={24} color="var(--primary)" />
                            <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalCompanies}</span>
                        </div>
                    </div>
                    <div className="card glass stat-card" style={{ padding: '1.2rem', borderLeft: '4px solid var(--secondary)' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Total Empleados</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Users size={24} color="var(--secondary)" />
                            <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalEmployees}</span>
                        </div>
                    </div>
                    <div className="card glass stat-card" style={{ padding: '1.2rem', borderLeft: '4px solid var(--info)' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Centros / Sedes</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MapPin size={24} color="var(--info)" />
                            <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalSedes}</span>
                        </div>
                    </div>
                    <div className="card glass stat-card" style={{ padding: '1.2rem', borderLeft: '4px solid var(--success)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Estado Promedio</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Globe size={24} color="var(--success)" />
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>ACTIVOS</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="toolbar glass" style={{ padding: '1rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar empresa por nombre o NIT..."
                        className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn glass" onClick={fetchCompanies}><Globe size={18} /> Actualizar</button>
            </div>

            <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: isClient ? '1fr' : 'repeat(auto-fill, minmax(450px, 1fr))', gap: '2rem' }}>
                {filteredCompanies.map(company => (
                    <div key={company.id} className={`card glass client-card-main ${expandedCompany === company.id ? 'expanded' : ''}`}
                        style={{
                            border: '1px solid var(--surface-border)',
                            overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            ...(isClient ? { maxWidth: '900px', margin: '0 auto' } : {})
                        }}>

                        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: expandedCompany === company.id ? 'rgba(99, 102, 241, 0.03)' : 'transparent' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '14px',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)'
                                }}>
                                    <Building2 size={28} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>{company.name}</h2>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Hash size={12} /> {company.nit}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {company.email || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {(isAdmin || isClient) && (
                                    <button className="icon-btn-v2 edit" title="Editar Información" onClick={() => { setActiveCompany(company); setCompanyForm({ name: company.name, nit: company.nit || '', lat: company.lat || '', lng: company.lng || '', email: company.email || '' }); setIsModalOpen(true); }}>
                                        <Edit2 size={16} />
                                    </button>
                                )}
                                {isAdmin && (
                                    <button className="icon-btn-v2 delete" title="Eliminar" onClick={async () => {
                                        if (confirm('¿Seguro que desea eliminar esta empresa? Todos los datos asociados (tickets, inventario, reportes) serán borrados.')) {
                                            try {
                                                await CompanyService.delete(company.id);
                                                setCompanies(companies.filter(c => c.id !== company.id));
                                            } catch (err: any) {
                                                alert("Error al eliminar la empresa: " + (err.message || "Falla en transacción"));
                                            }
                                        }
                                    }}>
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Collapsed view indicator */}
                        {expandedCompany !== company.id && (
                            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Empleados</p>
                                        <p style={{ fontSize: '1rem', fontWeight: 800 }}>{company.employees?.length || 0}</p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sedes</p>
                                        <p style={{ fontSize: '1rem', fontWeight: 800 }}>{company.sedes?.length || 0}</p>
                                    </div>
                                </div>
                                <button className="btn glass" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }} onClick={() => setExpandedCompany(company.id)}>
                                    Gestionar Detalles <ChevronRight size={14} />
                                </button>
                            </div>
                        )}

                        {expandedCompany === company.id && (
                            <div className="expanded-content fade-in" style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                                {/* Location Info */}
                                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--surface-border)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Coordenadas Principales</p>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{company.lat || '0.0'}, {company.lng || '0.0'}</p>
                                        </div>
                                        {company.lat && company.lng && (
                                            <a href={`https://www.google.com/maps?q=${company.lat},${company.lng}`} target="_blank" rel="noopener noreferrer" className="btn glass" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Navigation size={14} /> Abrir Mapa
                                            </a>
                                        )}
                                    </div>
                                    <button className="btn glass" style={{ fontSize: '0.75rem' }} onClick={() => setExpandedCompany(null)}>Cerrar</button>
                                </div>

                                {/* Tabs Navigation */}
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem', borderBottom: '1px solid var(--surface-border)' }}>
                                    <button onClick={() => setActiveTab('info')} className={`tab-btn-v2 ${activeTab === 'info' ? 'active' : ''}`}>
                                        <Users size={16} /> Personal Autorizado ({company.employees?.length || 0})
                                    </button>
                                    <button onClick={() => setActiveTab('sedes')} className={`tab-btn-v2 ${activeTab === 'sedes' ? 'active' : ''}`}>
                                        <MapPin size={16} /> Sedes / Sucursales ({company.sedes?.length || 0})
                                    </button>
                                </div>

                                {/* Tab Panels */}
                                <div style={{ minHeight: '150px' }}>
                                    {activeTab === 'info' ? (
                                        <div className="fade-in">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lista de Empleados</h3>
                                                <button className="btn btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }} onClick={() => { setActiveCompany(company); setEditingEmployee(null); setEmployeeForm({ name: '', email: '', phone: '' }); setIsEmployeeModalOpen(true); }}>
                                                    <Plus size={14} /> Nuevo Registro
                                                </button>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                                {company.employees?.map(emp => (
                                                    <div key={emp.id} className="item-row glass">
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{emp.name}</p>
                                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.email} · {emp.phone || 'Sin tel'}</p>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button onClick={() => { setEditingEmployee(emp); setActiveCompany(company); setEmployeeForm({ name: emp.name, email: emp.email, phone: emp.phone || '' }); setIsEmployeeModalOpen(true); }} className="mini-icon-btn"><Edit2 size={12} /></button>
                                                            <button onClick={async () => {
                                                                if (confirm('¿Eliminar empleado?')) {
                                                                    await CompanyService.deleteEmployee(emp.id);
                                                                    fetchCompanies();
                                                                }
                                                            }} className="mini-icon-btn delete"><Trash2 size={12} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!company.employees || company.employees.length === 0) && <p className="empty-msg">No hay personal registrado</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="fade-in">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sedes Autorizadas</h3>
                                                <button className="btn btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }} onClick={() => { setActiveCompany(company); setEditingSede(null); setSedeForm({ name: '', lat: '', lng: '' }); setIsSedeModalOpen(true); }}>
                                                    <Plus size={14} /> Nueva Sede
                                                </button>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                                {company.sedes?.map(sede => (
                                                    <div key={sede.id} className="item-row glass" style={{ borderColor: 'rgba(13, 148, 136, 0.2)' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{sede.name}</p>
                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📍 {sede.lat}, {sede.lng}</span>
                                                                <a href={`https://www.google.com/maps?q=${sede.lat},${sede.lng}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>Map ↗</a>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button onClick={() => { setEditingSede(sede); setActiveCompany(company); setSedeForm({ name: sede.name, lat: sede.lat || '', lng: sede.lng || '' }); setIsSedeModalOpen(true); }} className="mini-icon-btn"><Edit2 size={12} /></button>
                                                            <button onClick={async () => {
                                                                if (confirm('¿Eliminar sede?')) {
                                                                    await CompanyService.deleteSede(sede.id);
                                                                    fetchCompanies();
                                                                }
                                                            }} className="mini-icon-btn delete"><Trash2 size={12} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!company.sedes || company.sedes.length === 0) && <p className="empty-msg">No hay sedes registradas</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modals */}
            <ModalPortal>
                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content-glass">
                            <header className="modal-header">
                                <h2>{activeCompany ? 'Editar Empresa' : 'Nuevo Cliente Corporativo'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="close-btn"><X size={22} /></button>
                            </header>
                            <form onSubmit={handleSaveCompany} className="modal-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Nombre Legal / Comercial *</label>
                                        <input type="text" value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} required placeholder="Ej: Tech Corp S.A." disabled={isClient} className="form-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>NIT / Identificación *</label>
                                        <input type="text" value={companyForm.nit} onChange={e => setCompanyForm({ ...companyForm, nit: e.target.value })} required placeholder="Ej: 900.123.456-7" disabled={isClient} className="form-input" />
                                    </div>
                                    <div className="form-group full">
                                        <label>Email de Notificaciones *</label>
                                        <input type="email" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} required placeholder="it-manager@empresa.com" className="form-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>Latitud (Oficina Principal)</label>
                                        <input type="text" value={companyForm.lat} onChange={e => setCompanyForm({ ...companyForm, lat: e.target.value })} placeholder="4.7110" className="form-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>Longitud (Oficina Principal)</label>
                                        <input type="text" value={companyForm.lng} onChange={e => setCompanyForm({ ...companyForm, lng: e.target.value })} placeholder="-74.0721" className="form-input" />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn glass" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary"><Save size={18} /> Guardar Cambios</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isEmployeeModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content-glass tiny">
                            <header className="modal-header">
                                <h2>{editingEmployee ? 'Editar Empleado' : 'Asignar Nuevo Empleado'}</h2>
                                <button onClick={() => setIsEmployeeModalOpen(false)} className="close-btn"><X size={20} /></button>
                            </header>
                            <form onSubmit={handleSaveEmployee} className="modal-form">
                                <div className="form-group">
                                    <label>Nombre Completo *</label>
                                    <input type="text" className="form-input" value={employeeForm.name} onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Email Corporativo *</label>
                                    <input type="email" className="form-input" value={employeeForm.email} onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Teléfono / Celular</label>
                                    <input type="text" className="form-input" value={employeeForm.phone} onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })} />
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="btn btn-primary full"><Save size={18} /> {editingEmployee ? 'Actualizar' : 'Registrar'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isSedeModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content-glass tiny">
                            <header className="modal-header">
                                <h2>{editingSede ? 'Editar Sede' : 'Registrar Nueva Sede'}</h2>
                                <button onClick={() => setIsSedeModalOpen(false)} className="close-btn"><X size={20} /></button>
                            </header>
                            <form onSubmit={handleSaveSede} className="modal-form">
                                <div className="form-group">
                                    <label>Nombre de la Sede *</label>
                                    <input type="text" className="form-input" value={sedeForm.name} onChange={e => setSedeForm({ ...sedeForm, name: e.target.value })} required placeholder="Ej: Planta Norte, Oficina Calle 100" />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Latitud *</label>
                                        <input type="text" className="form-input" value={sedeForm.lat} onChange={e => setSedeForm({ ...sedeForm, lat: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Longitud *</label>
                                        <input type="text" className="form-input" value={sedeForm.lng} onChange={e => setSedeForm({ ...sedeForm, lng: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="btn btn-primary full"><Save size={18} /> {editingSede ? 'Actualizar Sede' : 'Guardar Sede'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </ModalPortal>

            <style jsx>{`
                .clients-page { max-width: 1400px; margin: 0 auto; }
                .stat-card { transition: transform 0.2s; }
                .stat-card:hover { transform: translateY(-3px); }
                .icon-btn-v2 { padding: 8px; border-radius: 10px; background: rgba(0,0,0,0.02); color: var(--text-muted); transition: 0.2s; border: 1px solid transparent; }
                .icon-btn-v2:hover { color: var(--primary); background: var(--primary-glow); border-color: var(--primary); }
                .icon-btn-v2.delete:hover { color: var(--error); background: rgba(239, 68, 68, 0.05); border-color: var(--error); }
                
                .tab-btn-v2 { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: none; background: none; cursor: pointer; color: var(--text-muted); font-size: 0.85rem; font-weight: 700; border-bottom: 3px solid transparent; transition: 0.2s; }
                .tab-btn-v2.active { color: var(--primary); border-bottom-color: var(--primary); background: var(--primary-glow); border-radius: 8px 8px 0 0; }
                
                .item-row { display: flex; align-items: center; padding: 10px 14px; background: rgba(0,0,0,0.02); border: 1px solid var(--surface-border); borderRadius: 10px; transition: 0.2s; }
                .item-row:hover { background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                
                .mini-icon-btn { padding: 4px; border-radius: 6px; color: var(--text-muted); opacity: 0.6; transition: 0.2s; }
                .mini-icon-btn:hover { opacity: 1; background: rgba(99, 102, 241, 0.1); color: var(--primary); }
                .mini-icon-btn.delete:hover { color: var(--error); background: rgba(239, 68, 68, 0.1); }
                
                .empty-msg { grid-column: span 2; padding: 2rem; color: var(--text-muted); text-align: center; font-style: italic; font-size: 0.85rem; }
                
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justifyContent: center; z-index: 9999; }
                .modal-content-glass { background: white; border: 1px solid rgba(255,255,255,0.2); borderRadius: 24px; box-shadow: 0 40px 100px rgba(0,0,0,0.3); width: 600px; padding: 2.5rem; }
                .modal-content-glass.tiny { width: 420px; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .modal-header h2 { margin: 0; font-size: 1.4rem; fontWeight: 800; color: #1e293b; }
                
                .modal-form { display: flex; flex-direction: column; gap: 1.5rem; }
                .form-grid { display: grid; gridTemplateColumns: 1fr 1fr; gap: 1.2rem; }
                .form-group.full { grid-column: span 2; }
                .form-group label { display: block; font-size: 0.82rem; fontWeight: 700; color: #64748b; margin-bottom: 0.5rem; textTransform: uppercase; }
                .form-input { width: 100%; padding: 12px 16px; border: 1.5px solid #e2e8f0; background: #f8fafc; borderRadius: 12px; color: #1e293b; font-family: inherit; font-size: 0.95rem; box-sizing: border-box; }
                .form-input:focus { outline: none; border-color: var(--primary); background: white; box-shadow: 0 0 0 4px var(--primary-glow); }
                
                .modal-actions { display: flex; gap: 12px; margin-top: 1rem; }
                .btn.full { width: 100%; justifyContent: center; padding: 14px; }
                
                .close-btn { background: #f1f5f9; border: none; borderRadius: 10px; padding: 5px; cursor: pointer; color: #64748b; transition: 0.2s; }
                .close-btn:hover { background: #fee2e2; color: #ef4444; }
                
                .fade-in { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
