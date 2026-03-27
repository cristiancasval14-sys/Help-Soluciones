'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Shield,
    Lock,
    User as UserIcon,
    Building2,
    Key,
    X,
    Save,
    Trash2,
    Eye,
    EyeOff,
    Briefcase,
    AlertCircle,
    Bell,
    CheckCircle,
    Calendar,
    Clock
} from 'lucide-react';
import { UserService, PasswordRequestService, CompanyService } from '@/lib/services';

import { MODULES } from '@/lib/navigation';

interface Credential {
    id: string;
    username: string;
    password: string;
    role: 'Administrador' | 'Técnico' | 'Cliente';
    assignedTo: string; // Name of person or company
    type: 'Personal' | 'Empresa';
    status: 'Activo' | 'Inactivo';
    allowedModules: string[];
}

interface PasswordRequest {
    id: string;
    username: string;
    date: string;
    status: 'Pendiente' | 'Resuelto';
}

export default function AccessControl() {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [passwordRequests, setPasswordRequests] = useState<PasswordRequest[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [showRequests, setShowRequests] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCred, setActiveCred] = useState<Credential | null>(null);
    const [showFormPass, setShowFormPass] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [formData, setFormData] = useState<Omit<Credential, 'id'>>({
        username: '',
        password: '',
        role: 'Técnico',
        assignedTo: '',
        type: 'Personal',
        status: 'Activo',
        allowedModules: []
    });

    // Check sessions and permissions
    useEffect(() => {
        const session = localStorage.getItem('help_session');
        if (session) {
            const user = JSON.parse(session);
            setCurrentUser(user);
        }

        const fetchData = async () => {
            try {
                const [users, requests, companiesData] = await Promise.all([
                    UserService.getAll(),
                    PasswordRequestService.getAll(),
                    CompanyService.getAll()
                ]);

                setCredentials(users.map((u: any) => ({
                    id: u.id,
                    username: u.username,
                    password: u.password,
                    role: u.role,
                    assignedTo: u.assigned_to,
                    type: u.type,
                    status: u.status,
                    allowedModules: u.allowed_modules || []
                })));

                setPasswordRequests(requests.map((r: any) => ({
                    id: r.id,
                    username: r.username,
                    date: r.created_at?.split('T')[0],
                    status: r.status
                })));
                setCompanies(companiesData);
            } catch (err) {
                console.error("Error loading access data:", err);
            }
        };

        fetchData();
    }, []);

    const handleDeleteRequest = async (id: string) => {
        try {
            await PasswordRequestService.delete(id);
            setPasswordRequests(passwordRequests.filter(r => r.id !== id));
        } catch (err) {
            alert("Error al eliminar solicitud");
        }
    };

    const handleResolveRequest = async (id: string) => {
        try {
            await PasswordRequestService.update(id, { status: 'Resuelto' });
            setPasswordRequests(passwordRequests.map(r => r.id === id ? { ...r, status: 'Resuelto' } : r));
        } catch (err) {
            alert("Error al resolver solicitud");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                username: formData.username,
                password: formData.password,
                role: formData.role,
                assigned_to: formData.assignedTo,
                type: formData.type,
                status: formData.status,
                allowed_modules: formData.allowedModules
            };

            if (activeCred) {
                await UserService.update(activeCred.id, payload);
                setCredentials(credentials.map(c => c.id === activeCred.id ? { ...formData, id: c.id } : c));
            } else {
                const newUser = await UserService.create(payload);
                setCredentials([...credentials, { 
                    ...formData, 
                    id: newUser.id,
                    allowedModules: newUser.allowed_modules || []
                }]);
            }
            setIsModalOpen(false);
        } catch (err) {
            alert("Error al guardar credencial en Supabase");
        }
    };

    const toggleModule = (moduleLabel: string) => {
        setFormData(prev => {
            const current = prev.allowedModules || [];
            if (current.includes(moduleLabel)) {
                return { ...prev, allowedModules: current.filter(m => m !== moduleLabel) };
            } else {
                return { ...prev, allowedModules: [...current, moduleLabel] };
            }
        });
    };

    const openModal = (cred?: Credential) => {
        if (cred) {
            setActiveCred(cred);
            setFormData({ ...cred });
        } else {
            setActiveCred(null);
            setFormData({
                username: '',
                password: '',
                role: 'Técnico',
                assignedTo: '',
                type: 'Personal',
                status: 'Activo',
                allowedModules: ['Dashboard']
            });
        }
        setShowFormPass(false);
        setIsModalOpen(true);
    };

    const toggleCardPass = (id: string) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const pendingCount = passwordRequests.filter(r => r.status === 'Pendiente').length;

    return (
        <div className="access-page fade-in">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Acceso y Usuarios</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gestión de credenciales y permisos de módulos</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button 
                        className={`btn ${pendingCount > 0 ? 'btn-warning' : 'glass'}`} 
                        onClick={() => setShowRequests(!showRequests)}
                        style={{ position: 'relative', border: pendingCount > 0 ? '1px solid var(--warning)' : '1px solid var(--surface-border)' }}
                    >
                        <Bell size={20} /> 
                        {pendingCount > 0 && (
                            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--error)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                                {pendingCount}
                            </span>
                        )}
                        Solicitudes Clave
                    </button>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={20} /> Crear Credencial
                    </button>
                </div>
            </header>

            {/* Password Reset Requests Section */}
            {showRequests && (
                <div className="requests-panel glass fade-in" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '2.5rem', border: '1px solid var(--primary-glow)', background: 'rgba(99, 102, 241, 0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={20} color="var(--primary)" />
                            <h2 style={{ fontSize: '1.1rem' }}>Reportes de Restablecimiento de Contraseña</h2>
                        </div>
                        <button onClick={() => setShowRequests(false)}><X size={20} /></button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {passwordRequests.length === 0 ? (
                            <p style={{ textAlign: 'center', gridColumn: '1/-1', padding: '2rem', color: 'var(--text-muted)' }}>No hay solicitudes registradas.</p>
                        ) : (
                            passwordRequests.map(req => (
                                <div key={req.id} className="request-card glass" style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--surface)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                        <span className={`badge ${req.status === 'Pendiente' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                                            {req.status}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} /> {req.date}
                                        </span>
                                    </div>
                                    <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                                        Usuario: <span style={{ color: 'var(--primary)' }}>{req.username}</span>
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--surface-border)', paddingTop: '0.8rem' }}>
                                        {req.status === 'Pendiente' && (
                                            <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }} onClick={() => handleResolveRequest(req.id)}>
                                                <CheckCircle size={14} /> Solucionado
                                            </button>
                                        )}
                                        <button className="btn glass" style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem', color: 'var(--error)' }} onClick={() => handleDeleteRequest(req.id)}>
                                            <Trash2 size={14} /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="toolbar glass" style={{ padding: '1.2rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Buscar por usuario o asignación..." className="search-input" />
                </div>
            </div>

            <div className="credentials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                {credentials.map(cred => (
                    <div key={cred.id} className="card glass cred-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: cred.type === 'Personal' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(13, 148, 136, 0.1)', color: cred.type === 'Personal' ? 'var(--primary)' : 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {cred.type === 'Personal' ? <UserIcon size={20} /> : <Building2 size={20} />}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{cred.assignedTo}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{cred.type}</p>
                                </div>
                            </div>
                            <span className={`status-badge ${cred.status.toLowerCase()}`}>{cred.status}</span>
                        </div>

                        <div className="cred-info glass" style={{ padding: '1rem', borderRadius: '10px', marginBottom: '1.2rem', border: '1px dashed var(--surface-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Usuario:</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{cred.username}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Perfil:</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>{cred.role}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Módulos:</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                    {cred.role === 'Administrador' ? 'Acceso Total' : `${(cred.allowedModules || []).length} asignados`}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', borderTop: '1px solid var(--surface-border)', paddingTop: '0.4rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contraseña:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 600 }}>
                                        {visiblePasswords[cred.id] ? cred.password : '••••••••'}
                                    </span>
                                    <button type="button" onClick={() => toggleCardPass(cred.id)} style={{ color: 'var(--text-muted)', display: 'flex' }}>
                                        {visiblePasswords[cred.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                            <button className="icon-btn" onClick={() => openModal(cred)} title="Modificar"><Lock size={16} /></button>
                            <button className="icon-btn delete" onClick={async () => {
                                if (confirm('¿Seguro que desea revocar este acceso?')) {
                                    try {
                                        await UserService.delete(cred.id);
                                        setCredentials(credentials.filter(c => c.id !== cred.id));
                                    } catch (err) {
                                        alert("Error al eliminar acceso");
                                    }
                                }
                            }} title="Borrar"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ width: '520px' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem' }}>{activeCred ? 'Modificar Credenciales' : 'Nueva Credencial'}</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </header>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                             <div className="form-group">
                                <label>Tipo de Asignación</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <button type="button" onClick={() => setFormData({ ...formData, type: 'Personal', assignedTo: '' })} className={`toggle-btn ${formData.type === 'Personal' ? 'active' : ''}`}><UserIcon size={16} /> Personal</button>
                                    <button type="button" onClick={() => setFormData({ ...formData, type: 'Empresa', assignedTo: '' })} className={`toggle-btn ${formData.type === 'Empresa' ? 'active' : ''}`}><Building2 size={16} /> Empresa</button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Asignado a</label>
                                {formData.type === 'Empresa' ? (
                                    <select 
                                        className="form-input" 
                                        value={formData.assignedTo} 
                                        onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} 
                                        required
                                    >
                                        <option value="">Seleccione Empresa...</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={formData.assignedTo} 
                                        onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} 
                                        required 
                                        placeholder="Nombre de la persona" 
                                    />
                                )}
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Nombre de Usuario</label>
                                    <input type="text" className="form-input" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Perfil</label>
                                    <select className="form-input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })}>
                                        <option value="Técnico">Técnico</option>
                                        <option value="Cliente">Cliente</option>
                                        <option value="Administrador">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showFormPass ? 'text' : 'password'} className="form-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                                    <button type="button" onClick={() => setShowFormPass(!showFormPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>{showFormPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                </div>
                            </div>

                            {/* MODULE ASSIGNMENT SECTION (RESTORED) */}
                            <div className="form-group">
                                <label>Módulos Permitidos</label>
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(2, 1fr)', 
                                    gap: '0.6rem', 
                                    background: 'var(--surface-alt)', 
                                    padding: '1.2rem', 
                                    borderRadius: '10px', 
                                    border: '1px solid var(--surface-border)',
                                    maxHeight: '160px',
                                    overflowY: 'auto'
                                }}>
                                    {MODULES.map(module => (
                                        <label key={module.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', cursor: 'pointer', padding: '4px' }}>
                                            <input 
                                                type="checkbox" 
                                                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                                                checked={formData.allowedModules?.includes(module.label) || formData.role === 'Administrador'} 
                                                disabled={formData.role === 'Administrador'}
                                                onChange={() => toggleModule(module.label)}
                                            />
                                            {module.label}
                                        </label>
                                    ))}
                                </div>
                                {formData.role === 'Administrador' && (
                                    <p style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '6px', fontWeight: 600 }}>
                                        * Los administradores tienen acceso total por defecto.
                                    </p>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', padding: '1rem', fontSize: '1rem' }}><Save size={20} /> Guardar Cambios</button>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .access-page { max-width: 1400px; margin: 0 auto; }
                .search-input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.5rem; border-radius: var(--radius-sm); border: 1px solid var(--surface-border); background: var(--surface); outline: none; }
                .badge { padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 800; text-transform: uppercase; }
                .badge-warning { background: rgba(245, 158, 11, 0.1); color: #d97706; }
                .badge-success { background: rgba(16, 185, 129, 0.1); color: #059669; }
                .btn-warning { background: var(--warning); color: white; border: none !important; }
                .status-badge { font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 4px; text-transform: uppercase; }
                .status-badge.activo { background: rgba(5, 150, 105, 0.1); color: #059669; }
                .toggle-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0.8rem; border: 1px solid var(--surface-border); border-radius: 8px; color: var(--text-muted); font-size: 0.9rem; font-weight: 600; }
                .toggle-btn.active { background: var(--primary-glow); color: var(--primary); border-color: var(--primary); }
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
                .modal-content { background: var(--surface); padding: 2.5rem; border-radius: var(--radius-lg); box-shadow: 0 25px 60px rgba(0,0,0,0.15); max-height: 90vh; overflow-y: auto; }
                .form-input { width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); font-family: inherit; font-size: 0.95rem; }
                .icon-btn { padding: 0.5rem; border-radius: 8px; color: var(--text-muted); transition: 0.15s; }
                .icon-btn:hover { background: rgba(0,0,0,0.05); color: var(--primary); }
                .icon-btn.delete:hover { color: var(--error); background: rgba(220, 38, 38, 0.05); }
            `}</style>
        </div>
    );
}
