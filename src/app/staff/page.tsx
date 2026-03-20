'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Camera,
    Car,
    Bike,
    User,
    X,
    Save,
    CheckCircle,
    MoreVertical,
    FileCheck,
    AlertTriangle,
    Shield
} from 'lucide-react';
import { StaffService } from '@/lib/services';

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    role: 'Técnico' | 'Tecnólogo' | 'Ingeniero';
    photo: string;
    vehicle: 'Carro' | 'Moto' | 'Ninguno';
    plate: string;
    vehicleBrand: string;
    vehicleModel: string;
    soatExpiry: string;
    tecnoExpiry: string;
}

export default function StaffPage() {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Omit<Staff, 'id'>>({
        firstName: '', lastName: '', role: 'Técnico', photo: '', vehicle: 'Ninguno',
        plate: '', vehicleBrand: '', vehicleModel: '', soatExpiry: '', tecnoExpiry: ''
    });
    
    // Fetch from Supabase
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const data = await StaffService.getAll();
                const mapped = data.map((s: any) => ({
                    id: s.id,
                    firstName: s.first_name,
                    lastName: s.last_name,
                    role: s.role,
                    photo: s.photo,
                    vehicle: s.vehicle,
                    plate: s.plate,
                    vehicleBrand: s.vehicle_brand,
                    vehicleModel: s.vehicle_model,
                    soatExpiry: s.soat_expiry,
                    tecnoExpiry: s.tecno_expiry
                }));
                setStaffList(mapped);
            } catch (err) {
                console.error("Error connecting to Supabase Staff:", err);
            }
        };

        fetchStaff();
    }, []);

    const openModal = (staff?: Staff) => {
        if (staff) {
            setEditingStaff(staff);
            setFormData({ ...staff });
        } else {
            setEditingStaff(null);
            setFormData({
                firstName: '', lastName: '', role: 'Técnico', photo: '', vehicle: 'Ninguno',
                plate: '', vehicleBrand: '', vehicleModel: '', soatExpiry: '', tecnoExpiry: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                role: formData.role,
                photo: formData.photo,
                vehicle: formData.vehicle,
                plate: formData.plate,
                vehicle_brand: formData.vehicleBrand,
                vehicle_model: formData.vehicleModel,
                soat_expiry: formData.soatExpiry,
                tecno_expiry: formData.tecnoExpiry
            };

            if (editingStaff) {
                await StaffService.update(editingStaff.id, payload);
                setStaffList(staffList.map((s: Staff) => s.id === editingStaff.id ? { ...formData, id: s.id } : s));
            } else {
                const newStaff = await StaffService.create(payload);
                setStaffList([...staffList, { 
                    id: newStaff.id,
                    firstName: newStaff.first_name,
                    lastName: newStaff.last_name,
                    role: newStaff.role,
                    photo: newStaff.photo,
                    vehicle: newStaff.vehicle,
                    plate: newStaff.plate,
                    vehicleBrand: newStaff.vehicle_brand,
                    vehicleModel: newStaff.vehicle_model,
                    soatExpiry: newStaff.soat_expiry,
                    tecnoExpiry: newStaff.tecno_expiry
                } as any]);
            }
            setIsModalOpen(false);
        } catch (err) {
            alert("Error al guardar en Supabase");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Está seguro de eliminar este registro?')) {
            try {
                await StaffService.delete(id);
                setStaffList(staffList.filter((s: Staff) => s.id !== id));
            } catch (err) {
                alert("Error al eliminar");
            }
        }
    };

    // Document status helpers
    const isExpired = (date: string) => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    const isExpiringSoon = (date: string) => {
        if (!date) return false;
        const expiry = new Date(date);
        const now = new Date();
        const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 30 && diffDays >= 0;
    };

    const getDocStatus = (date: string) => {
        if (!date) return { label: 'No registrado', color: 'var(--text-muted)', bg: 'rgba(0,0,0,0.03)', icon: '⚪' };
        if (isExpired(date)) return { label: 'Vencido', color: 'var(--error)', bg: 'rgba(239,68,68,0.1)', icon: '🔴' };
        if (isExpiringSoon(date)) return { label: 'Por Vencer', color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)', icon: '🟡' };
        return { label: 'Vigente', color: 'var(--success)', bg: 'rgba(5,150,105,0.1)', icon: '🟢' };
    };

    const filteredStaff = staffList.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="staff-page fade-in">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Personal Técnico</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gestión de ingenieros, técnicos y sus vehículos</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={20} /> Agregar Personal
                </button>
            </header>

            <div className="toolbar glass" style={{ padding: '1.2rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Buscar por nombre o cargo..." className="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="staff-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                {filteredStaff.map(person => {
                    const soatStatus = getDocStatus(person.soatExpiry);
                    const tecnoStatus = getDocStatus(person.tecnoExpiry);
                    const hasVehicle = person.vehicle !== 'Ninguno';

                    return (
                        <div key={person.id} className="card glass person-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <div className="avatar-box" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {person.photo ? <img src={person.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} color="var(--primary)" />}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className="badge badge-role">{person.role}</span>
                                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '8px' }}>
                                        <button onClick={() => openModal(person)} className="icon-btn edit"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(person.id)} className="icon-btn delete"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{person.firstName} {person.lastName}</h3>

                            {/* Vehicle Info */}
                            <div className="vehicle-info" style={{ marginTop: '1.2rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasVehicle ? '0.8rem' : '0' }}>
                                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                                        {person.vehicle === 'Carro' ? <Car size={18} color="var(--primary)" /> :
                                            person.vehicle === 'Moto' ? <Bike size={18} color="#a855f7" /> :
                                                <User size={18} color="var(--text-muted)" />}
                                        <span>{person.vehicle === 'Ninguno' ? 'Sin vehículo' : `${person.vehicle}`}</span>
                                    </p>
                                    {hasVehicle && (
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: person.vehicle === 'Carro' ? 'rgba(37,99,235,0.1)' : 'rgba(168,85,247,0.1)', color: person.vehicle === 'Carro' ? 'var(--primary)' : '#a855f7' }}>
                                            {person.plate}
                                        </span>
                                    )}
                                </div>

                                {hasVehicle && (
                                    <>
                                        {(person.vehicleBrand || person.vehicleModel) && (
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem', marginLeft: '26px' }}>
                                                {person.vehicleBrand} {person.vehicleModel}
                                            </p>
                                        )}

                                        {/* SOAT & Tecnomecánica */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                            <div style={{ padding: '0.7rem', borderRadius: '8px', background: soatStatus.bg, border: `1px solid ${soatStatus.color}20` }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: soatStatus.color, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                                    <FileCheck size={12} /> SOAT
                                                </p>
                                                <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {person.soatExpiry || 'No registrado'}
                                                </p>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: soatStatus.color, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    {soatStatus.icon} {soatStatus.label}
                                                </span>
                                            </div>
                                            <div style={{ padding: '0.7rem', borderRadius: '8px', background: tecnoStatus.bg, border: `1px solid ${tecnoStatus.color}20` }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: tecnoStatus.color, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                                    <FileCheck size={12} /> Tecnomecánica
                                                </p>
                                                <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {person.tecnoExpiry || 'No registrado'}
                                                </p>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: tecnoStatus.color, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    {tecnoStatus.icon} {tecnoStatus.label}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass">
                        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2>{editingStaff ? 'Editar Personal' : 'Nuevo Personal Técnico'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </header>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Nombre</label>
                                    <input type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Apellido</label>
                                    <input type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required className="form-input" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Cargo</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} className="form-input">
                                    <option value="Técnico">Técnico</option>
                                    <option value="Tecnólogo">Tecnólogo</option>
                                    <option value="Ingeniero">Ingeniero</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Foto (URL)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input type="text" value={formData.photo} onChange={e => setFormData({ ...formData, photo: e.target.value })} placeholder="https://..." className="form-input" style={{ flex: 1 }} />
                                    <button type="button" className="btn glass"><Camera size={18} /></button>
                                </div>
                            </div>

                            {/* Vehicle Section */}
                            <div className="section-divider" style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', margin: '0.5rem 0 0' }}>
                                🚗 Información de Vehículo
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Tipo de Vehículo</label>
                                    <select value={formData.vehicle} onChange={e => setFormData({ ...formData, vehicle: e.target.value as any })} className="form-input">
                                        <option value="Ninguno">Ninguno</option>
                                        <option value="Carro">🚗 Carro</option>
                                        <option value="Moto">🏍️ Moto</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Placa</label>
                                    <input
                                        type="text"
                                        value={formData.plate}
                                        onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                                        placeholder="ABC-123"
                                        disabled={formData.vehicle === 'Ninguno'}
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            {formData.vehicle !== 'Ninguno' && (
                                <>
                                    <div className="form-row fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label>Marca del Vehículo</label>
                                            <input type="text" value={formData.vehicleBrand} onChange={e => setFormData({ ...formData, vehicleBrand: e.target.value })} placeholder="Ej: Chevrolet, Honda..." className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label>Modelo del Vehículo</label>
                                            <input type="text" value={formData.vehicleModel} onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })} placeholder="Ej: Spark, CBR 250..." className="form-input" />
                                        </div>
                                    </div>

                                    <div className="section-divider fade-in" style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--warning)', margin: '0.3rem 0 0' }}>
                                        📋 Documentación Vigente
                                    </div>

                                    <div className="form-row fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label>Vencimiento SOAT</label>
                                            <input type="date" value={formData.soatExpiry} onChange={e => setFormData({ ...formData, soatExpiry: e.target.value })} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label>Vencimiento Tecnomecánica</label>
                                            <input type="date" value={formData.tecnoExpiry} onChange={e => setFormData({ ...formData, tecnoExpiry: e.target.value })} className="form-input" />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    <Save size={20} /> Guardar Registro
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        .search-input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.5rem; border-radius: var(--radius-sm); border: 1px solid var(--surface-border); background: var(--surface); outline: none; color: var(--text-main); font-family: inherit; }
        .badge-role { background: rgba(99, 102, 241, 0.1); color: var(--primary); font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 99px; font-weight: 600; }
        .icon-btn { padding: 0.5rem; border-radius: 8px; transition: 0.2s; cursor: pointer; }
        .icon-btn.edit { color: var(--info); }
        .icon-btn.edit:hover { background: rgba(59, 130, 246, 0.1); }
        .icon-btn.delete { color: var(--error); }
        .icon-btn.delete:hover { background: rgba(239, 68, 68, 0.1); }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { width: 520px; background: var(--surface); padding: 2.5rem; border-radius: var(--radius-lg); box-shadow: 0 20px 50px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted); }
        .form-input { width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); font-family: inherit; }
        .form-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
}
