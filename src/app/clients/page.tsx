'use client';

import React, { useState, useEffect } from 'react';
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
    MapPinned,
    Globe,
    Lock
} from 'lucide-react';

import { CompanyService } from '@/lib/services';
import { Company as DBCompany } from '@/lib/supabase';

interface Sede {
    id: string;
    name: string;
    lat: string;
    lng: string;
}

interface Employee {
    id: string;
    name: string;
    email: string;
    phone: string;
}

interface Company extends DBCompany {
    employees: Employee[];
    sedes: Sede[];
}

export default function ClientsPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCompany, setActiveCompany] = useState<Company | null>(null);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [isSedeModalOpen, setIsSedeModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'sedes'>('info');

    const [companyForm, setCompanyForm] = useState({ name: '', nit: '', lat: '', lng: '', email: '' });
    const [employeeForm, setEmployeeForm] = useState({ name: '', email: '', phone: '' });
    const [sedeForm, setSedeForm] = useState({ name: '', lat: '', lng: '' });
    const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

    useEffect(() => {
        const fetchCompanies = async () => {
            const session = localStorage.getItem('help_session');
            const user = session ? JSON.parse(session) : null;
            setCurrentUser(user);

            try {
                const data = await CompanyService.getAll();
                let list: Company[] = data as any;
                
                // If user is a Client, filter to only show THEIR company
                if (user && user.role === 'Cliente') {
                    const filtered = list.filter(c => c.name === user.assignedTo);
                    setCompanies(filtered);
                    if (filtered.length > 0) setExpandedCompany(filtered[0].id);
                } else {
                    setCompanies(list);
                }
            } catch (err) {
                console.error("Error fetching companies:", err);
            }
        };

        fetchCompanies();
    }, []);

    const handleSaveCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (activeCompany) {
                await CompanyService.update(activeCompany.id, companyForm);
                setCompanies(companies.map(c => c.id === activeCompany.id ? { ...c, ...companyForm } : c));
            } else {
                const newCo = await CompanyService.create(companyForm);
                setCompanies([...companies, { ...newCo, employees: [], sedes: [] } as any]);
            }
            setIsModalOpen(false);
            setActiveCompany(null);
        } catch (err) {
            alert("Error al guardar empresa");
        }
    };

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCompany) return;
        try {
            const newEmp = await CompanyService.addEmployee({ company_id: activeCompany.id, ...employeeForm });
            setCompanies(companies.map(c =>
                c.id === activeCompany.id ? { ...c, employees: [...c.employees, newEmp] } : c
            ));
            setIsEmployeeModalOpen(false);
            setEmployeeForm({ name: '', email: '', phone: '' });
        } catch (err) {
            alert("Error al agregar empleado");
        }
    };

    const handleAddSede = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCompany) return;
        try {
            const newSede = await CompanyService.addSede({ company_id: activeCompany.id, ...sedeForm });
            setCompanies(companies.map(c =>
                c.id === activeCompany.id ? { ...c, sedes: [...c.sedes, newSede] } : c
            ));
            setIsSedeModalOpen(false);
            setSedeForm({ name: '', lat: '', lng: '' });
        } catch (err) {
            alert("Error al agregar sede");
        }
    };

    const isAdmin = currentUser?.role === 'Administrador';
    const isClient = currentUser?.role === 'Cliente';

    return (
        <div className="clients-page fade-in">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>
                        {isClient ? `Mi Empresa: ${currentUser?.assignedTo}` : 'Gestión de Clientes'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {isClient ? 'Gestione sus sedes y personal autorizado' : 'Registro de organizaciones, sedes y empleados'}
                    </p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => { setActiveCompany(null); setCompanyForm({ name: '', nit: '', lat: '', lng: '', email: '' }); setIsModalOpen(true); }}>
                        <Building2 size={20} /> Registrar Empresa
                    </button>
                )}
            </header>

            <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: isClient ? '1fr' : 'repeat(auto-fill, minmax(440px, 1fr))', gap: '2rem' }}>
                {companies.map(company => (
                    <div key={company.id} className="card glass client-card" style={isClient ? { maxWidth: '800px', margin: '0 auto' } : {}}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Building2 size={24} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {(isAdmin || isClient) && (
                                    <button className="icon-btn edit" title="Editar Información" onClick={() => { setActiveCompany(company); setCompanyForm({ name: company.name, nit: company.nit || '', lat: company.lat || '', lng: company.lng || '', email: company.email || '' }); setIsModalOpen(true); }}>
                                        <Edit2 size={16} />
                                    </button>
                                )}
                                {isAdmin && (
                                    <button className="icon-btn delete" title="Eliminar" onClick={async () => {
                                        if (confirm('¿Seguro que desea eliminar esta empresa?')) {
                                            try {
                                                await CompanyService.delete(company.id);
                                                setCompanies(companies.filter(c => c.id !== company.id));
                                            } catch (err) {
                                                alert("Error al eliminar");
                                            }
                                        }
                                    }}>
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{company.name}</h2>
                        
                        {!isClient ? (
                            <>
                                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                    <Hash size={14} /> NIT: {company.nit}
                                </p>
                                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                    <Navigation size={14} /> Coords: {company.lat}, {company.lng}
                                </p>
                                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                    <Mail size={14} /> {company.email}
                                </p>
                                {company.lat && company.lng && (
                                    <a
                                        href={`https://www.google.com/maps?q=${company.lat},${company.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.3rem', marginBottom: '1rem' }}
                                    >
                                        <Globe size={14} /> Ver en Google Maps ↗
                                    </a>
                                )}
                            </>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <Hash size={14} /> NIT: {company.nit}
                                </p>
                                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <Mail size={14} /> {company.email || 'N/A'}
                                </p>
                            </div>
                        )}
                        
                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--surface-border)', margin: '1.5rem 0 1.2rem 0' }}>
                            {(['info', 'sedes'] as const).map(tab => (
                                <button key={tab} onClick={() => { setExpandedCompany(company.id); setActiveTab(tab); }}
                                    style={{
                                        padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
                                        color: (expandedCompany === company.id && activeTab === tab) ? 'var(--primary)' : 'var(--text-muted)',
                                        borderBottom: (expandedCompany === company.id && activeTab === tab) ? '2px solid var(--primary)' : '2px solid transparent',
                                        marginBottom: '-2px', transition: '0.2s'
                                    }}>
                                    {tab === 'info' && `👥 Empleados (${company.employees?.length || 0})`}
                                    {tab === 'sedes' && `📍 Sedes (${company.sedes?.length || 0})`}
                                </button>
                            ))}
                        </div>

                        {/* Employees Tab */}
                        {expandedCompany === company.id && activeTab === 'info' && (
                            <div className="tab-content fade-in">
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.8rem' }}>
                                    <button className="btn glass" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => { setActiveCompany(company); setIsEmployeeModalOpen(true); }}>
                                        <Plus size={14} /> Agregar Empleado
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {(!company.employees || company.employees.length === 0) ? (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>Sin empleados registrados</p>
                                    ) : (
                                        company.employees.map(emp => (
                                            <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-alt)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)' }}>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{emp.name}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email} · {emp.phone}</p>
                                                </div>
                                                <button onClick={async () => {
                                                    if (confirm('¿Eliminar empleado?')) {
                                                        try {
                                                            await CompanyService.deleteEmployee(emp.id);
                                                            const updatedEmps = company.employees.filter(e => e.id !== emp.id);
                                                            setCompanies(companies.map(c => c.id === company.id ? { ...c, employees: updatedEmps } : c));
                                                        } catch (err) {
                                                            alert("Error al eliminar");
                                                        }
                                                    }
                                                }} style={{ color: 'var(--error)', opacity: 0.6 }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Sedes Tab */}
                        {expandedCompany === company.id && activeTab === 'sedes' && (
                            <div className="tab-content fade-in">
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.8rem' }}>
                                    <button className="btn glass" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => { setActiveCompany(company); setIsSedeModalOpen(true); }}>
                                        <MapPinned size={14} /> Nueva Sede
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gap: '0.8rem' }}>
                                    {(!company.sedes || company.sedes.length === 0) ? (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>Sin sedes registradas</p>
                                    ) : (
                                        company.sedes.map(sede => (
                                            <div key={sede.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(13, 148, 136, 0.05)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(13,148,136,0.15)' }}>
                                                <div>
                                                    <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                                        <MapPin size={14} color="var(--secondary)" /> {sede.name}
                                                    </p>
                                                    <a href={`https://www.google.com/maps?q=${sede.lat},${sede.lng}`} target="_blank" rel="noopener noreferrer"
                                                        style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                                                        Ver Ubicación ↗
                                                    </a>
                                                </div>
                                                <button onClick={async () => {
                                                    if (confirm('¿Eliminar sede?')) {
                                                        try {
                                                            await CompanyService.deleteSede(sede.id);
                                                            const updatedSedes = company.sedes.filter(s => s.id !== sede.id);
                                                            setCompanies(companies.map(c => c.id === company.id ? { ...c, sedes: updatedSedes } : c));
                                                        } catch (err) {
                                                            alert("Error al eliminar");
                                                        }
                                                    }
                                                }} style={{ color: 'var(--error)', opacity: 0.6 }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ width: '520px' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2>{isClient ? 'Mi Información' : (activeCompany ? 'Editar Empresa' : 'Nueva Empresa')}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </header>
                        <form onSubmit={handleSaveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-group">
                                <label>Nombre Comercial</label>
                                <input type="text" className="form-input" value={companyForm.name} 
                                    onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} 
                                    disabled={isClient} required />
                            </div>
                            <div className="form-group">
                                <label>NIT</label>
                                <input type="text" className="form-input" value={companyForm.nit} 
                                    onChange={e => setCompanyForm({ ...companyForm, nit: e.target.value })} 
                                    disabled={isClient} required />
                            </div>
                            <div className="form-group">
                                <label>Latitud</label>
                                <input type="text" className="form-input" value={companyForm.lat} 
                                    onChange={e => setCompanyForm({ ...companyForm, lat: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Longitud</label>
                                <input type="text" className="form-input" value={companyForm.lng} 
                                    onChange={e => setCompanyForm({ ...companyForm, lng: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Correo Corporativo</label>
                                <input type="email" className="form-input" value={companyForm.email} 
                                    onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}><Save size={20} /> Guardar Cambios</button>
                        </form>
                    </div>
                </div>
            )}

            {isEmployeeModalOpen && (
                 <div className="modal-overlay">
                     <div className="modal-content glass">
                         <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                             <h2>Agregar Empleado</h2>
                             <button onClick={() => setIsEmployeeModalOpen(false)}><X size={24} /></button>
                         </header>
                         <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                             <div className="form-group">
                                 <label>Nombre</label>
                                 <input type="text" className="form-input" value={employeeForm.name} onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })} required />
                             </div>
                             <div className="form-group">
                                 <label>Email</label>
                                 <input type="email" className="form-input" value={employeeForm.email} onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })} required />
                             </div>
                             <div className="form-group">
                                 <label>Teléfono</label>
                                 <input type="text" className="form-input" value={employeeForm.phone} onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })} />
                             </div>
                             <button type="submit" className="btn btn-primary"><Save size={20} /> Registrar</button>
                         </form>
                     </div>
                 </div>
            )}

            {isSedeModalOpen && (
                 <div className="modal-overlay">
                     <div className="modal-content glass">
                         <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                             <h2>Nueva Sede</h2>
                             <button onClick={() => setIsSedeModalOpen(false)}><X size={24} /></button>
                         </header>
                         <form onSubmit={handleAddSede} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                             <div className="form-group">
                                 <label>Nombre Sede</label>
                                 <input type="text" className="form-input" value={sedeForm.name} onChange={e => setSedeForm({ ...sedeForm, name: e.target.value })} required />
                             </div>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                 <input type="text" className="form-input" placeholder="Latitud" value={sedeForm.lat} onChange={e => setSedeForm({ ...sedeForm, lat: e.target.value })} required />
                                 <input type="text" className="form-input" placeholder="Longitud" value={sedeForm.lng} onChange={e => setSedeForm({ ...sedeForm, lng: e.target.value })} required />
                             </div>
                             <button type="submit" className="btn btn-primary"><Save size={20} /> Guardar</button>
                         </form>
                     </div>
                 </div>
            )}

            <style jsx>{`
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: flex-start; justify-content: center; padding-top: 5vh; padding-bottom: 5vh; overflow-y: auto; z-index: 1000; backdrop-filter: blur(4px); }
                .modal-content { width: 450px; background: var(--surface); padding: 2.5rem; border-radius: var(--radius-lg); box-shadow: 0 20px 50px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
                .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted); }
                .form-input { width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); font-family: inherit; }
                .icon-btn { padding: 0.4rem; border-radius: 4px; color: var(--text-muted); }
                .icon-btn:hover { color: var(--primary); background: rgba(99, 102, 241, 0.05); }
                .client-card { border: 1px solid var(--surface-border); }
                .tab-content { min-height: 60px; }
            `}</style>
        </div>
    );
}
