'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Server,
    Monitor,
    HardDrive as HardDriveIcon,
    Cpu,
    Layers,
    MapPin,
    X,
    Save,
    Trash2,
    ChevronRight,
    Edit2,
    MoreVertical,
    Building2,
    Box,
    Wrench,
    Key,
    AppWindow,
    Shield,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    User,
    Users,
    RefreshCw
} from 'lucide-react';

import { InventoryService, CompanyService } from '@/lib/services';

interface SoftwareLicense {
    id: string;
    name: string;
    licenseKey: string;
    type: 'Perpetua' | 'Suscripción' | 'OEM';
    expiryDate: string;
    seats: number;
}

interface InstalledProgram {
    id: string;
    name: string;
    version: string;
    publisher: string;
}

interface Asset {
    id: string; // Internal Supabase UUID
    equipment_id: string; // Human-readable ID like EQU-001
    clientName: string; 
    company_id?: string;
    assigned_employee_id?: string;
    assignedEmployee?: string;
    locationType: 'Bodega' | 'Cliente' | 'En Reparación';
    brand: string;
    model: string;
    serial: string;
    storage: string;
    ram: string;
    processor: string;
    status: 'Activo' | 'Mantenimiento' | 'Baja';
    licenses: SoftwareLicense[];
    programs: InstalledProgram[];
}

export default function Inventory() {
    const [isMounted, setIsMounted] = useState(false);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
    const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
    const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
    const [assetTab, setAssetTab] = useState<'specs' | 'licenses' | 'programs'>('specs');
    const [searchTerm, setSearchTerm] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const [formData, setFormData] = useState({
        id: '', // UI field for equipment_id
        clientName: '',
        assignedEmployee: '',
        locationType: 'Bodega' as 'Bodega' | 'Cliente' | 'En Reparación',
        brand: '',
        model: '',
        serial: '',
        storage: '',
        ram: '',
        processor: '',
        status: 'Activo' as 'Activo' | 'Mantenimiento' | 'Baja'
    });

    const [licenseForm, setLicenseForm] = useState<Omit<SoftwareLicense, 'id'>>({
        name: '', licenseKey: '', type: 'Suscripción', expiryDate: '', seats: 1
    });

    const [programForm, setProgramForm] = useState<Omit<InstalledProgram, 'id'>>({
        name: '', version: '', publisher: ''
    });
    
    // Persist to Supabase
    useEffect(() => {
        setIsMounted(true);
        const fetchData = async () => {
            const session = localStorage.getItem('help_session');
            const user = session ? JSON.parse(session) : null;
            setCurrentUser(user);

            try {
                const data = await InventoryService.getAll();
                const mappedAssets = data.map((a: any) => ({
                    ...a,
                    equipment_id: a.equipment_id || 'N/A',
                    clientName: a.company?.name || 'Inventario Base',
                    assignedEmployee: a.employee?.name || '',
                    locationType: a.location_type || a.locationType || 'Bodega',
                    brand: a.brand || 'N/A',
                    model: a.model || 'N/A',
                    serial: a.serial || 'N/A',
                    licenses: Array.isArray(a.licenses) ? a.licenses : [],
                    programs: Array.isArray(a.programs) ? a.programs : []
                }));

                let finalAssets = mappedAssets;
                if (user && user.role === 'Cliente') {
                    finalAssets = mappedAssets.filter((a: any) => 
                        a.clientName?.trim().toLowerCase() === user.assignedTo?.trim().toLowerCase()
                    );
                }
                setAssets(finalAssets);

                const companies = await CompanyService.getAll();
                setClients(companies as any);
            } catch (err) {
                console.error("Error connecting to Supabase Inventory:", err);
            }
        };

        fetchData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const company = clients.find(c => c.name === formData.clientName);
            const employeeUser = (company?.employees || []).find((e: any) => e.name === formData.assignedEmployee);

            const payload = {
                equipment_id: formData.id,
                company_id: company?.id || null,
                location_type: formData.locationType,
                brand: formData.brand,
                model: formData.model,
                serial: formData.serial,
                storage: formData.storage,
                ram: formData.ram,
                processor: formData.processor,
                status: formData.status,
                assigned_employee_id: employeeUser?.id || null
            };

            if (activeAsset) {
                await InventoryService.update(activeAsset.id, payload);
                setAssets(assets.map(a => a.id === activeAsset.id ? { ...a, ...formData, equipment_id: formData.id } : a));
            } else {
                const newAsset = await InventoryService.create(payload);
                setAssets([...assets, { ...newAsset, clientName: formData.clientName, licenses: [], programs: [] } as any]);
            }
            setIsModalOpen(false);
        } catch (err) {
            alert("Error al guardar en Supabase");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Está seguro de eliminar este equipo?')) {
            try {
                await InventoryService.delete(id);
                setAssets(assets.filter(a => a.id !== id));
            } catch (err) {
                alert("Error al eliminar");
            }
        }
    };

    const generateConsecutiveId = (loc: string, clientName: string) => {
        let prefix = loc === 'Bodega' ? 'BOD' : loc === 'En Reparación' ? 'REP' : 'CLI';
        let matchingAssets = assets.filter(a => a.locationType === loc);
        
        if (loc === 'Cliente') {
            if (clientName) {
                const clientPrefix = clientName.substring(0, 3).toUpperCase();
                prefix = `CLI-${clientPrefix}`;
                matchingAssets = matchingAssets.filter(a => a.clientName === clientName);
            } else {
                return `CLI-${Math.floor(1000 + Math.random() * 9000)}`;
            }
        }

        let maxNum = 0;
        matchingAssets.forEach(a => {
            const eqId = a.equipment_id || '';
            if (eqId.toUpperCase().startsWith(prefix.toUpperCase() + '-')) {
                const parts = eqId.split('-');
                const numStr = parts[parts.length - 1];
                // Ignore 4-digit randoms generated previously so we strictly start from 01
                if (numStr && numStr.length <= 3) {
                    const num = parseInt(numStr, 10);
                    if (!isNaN(num) && num > maxNum) {
                        maxNum = num;
                    }
                }
            }
        });

        const nextNum = (maxNum + 1).toString().padStart(2, '0');
        return `${prefix}-${nextNum}`;
    };

    const openModal = (asset?: Asset) => {
        if (asset) {
            setActiveAsset(asset);
            setFormData({ 
                id: asset.equipment_id, 
                clientName: asset.clientName, 
                assignedEmployee: asset.assignedEmployee || '', 
                locationType: asset.locationType, 
                brand: asset.brand, 
                model: asset.model, 
                serial: asset.serial, 
                storage: asset.storage, 
                ram: asset.ram, 
                processor: asset.processor, 
                status: asset.status 
            });
        } else {
            setActiveAsset(null);
            const newId = generateConsecutiveId('Bodega', '');
            setFormData({ id: newId, clientName: '', assignedEmployee: '', locationType: 'Bodega', brand: '', model: '', serial: '', storage: '', ram: '', processor: '', status: 'Activo' });
        }
        setIsModalOpen(true);
    };

    const handleAddLicense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeAsset) return;
        const newLic = { id: Math.random().toString(36).substr(2, 9), ...licenseForm };
        const updatedLicenses = [...activeAsset.licenses, newLic];
        try {
            await InventoryService.update(activeAsset.id, { licenses: updatedLicenses });
            setAssets(assets.map(a => a.id === activeAsset.id ? { ...a, licenses: updatedLicenses } : a));
            setIsLicenseModalOpen(false);
            setLicenseForm({ name: '', licenseKey: '', type: 'Suscripción', expiryDate: '', seats: 1 });
        } catch (err) {
            alert("Error al guardar licencia");
        }
    };

    const handleAddProgram = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeAsset) return;
        const newProg = { id: Math.random().toString(36).substr(2, 9), ...programForm };
        const updatedPrograms = [...activeAsset.programs, newProg];
        try {
            await InventoryService.update(activeAsset.id, { programs: updatedPrograms });
            setAssets(assets.map(a => a.id === activeAsset.id ? { ...a, programs: updatedPrograms } : a));
            setIsProgramModalOpen(false);
            setProgramForm({ name: '', version: '', publisher: '' });
        } catch (err) {
            alert("Error al registrar programa");
        }
    };

    const isLicenseExpired = (date: string) => date && new Date(date) < new Date();
    const isLicenseExpiringSoon = (date: string) => {
        if (!date) return false;
        const d = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return d <= 30 && d >= 0;
    };

    const filteredAssets = assets.filter(a =>
        a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [clients, setClients] = useState<any[]>([]);
    
    // We already fetch clients in the main fetchData, so this is redundant, but we keep the state.
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const data = await CompanyService.getAll();
                setClients(data as any);
            } catch (err) {
                console.error("Error loading clients:", err);
            }
        };
        fetchClients();
    }, []);

    if (!isMounted) return null;

    // Agrupar assets filtrados por empresa
    const groupedAssets = filteredAssets.reduce((acc, asset) => {
        const key = asset.clientName || 'Inventario Base';
        if (!acc[key]) acc[key] = [];
        acc[key].push(asset);
        return acc;
    }, {} as Record<string, Asset[]>);

    // Ordenar: primero las empresas con más equipos
    const sortedGroupKeys = Object.keys(groupedAssets).sort((a, b) =>
        groupedAssets[b].length - groupedAssets[a].length
    );

    return (
        <div className="inventory-page fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                        {currentUser?.role === 'Cliente' ? 'Mis Equipos' : 'Inventario Tecnológico'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Gestión de activos (CMDB), licencias y software ·{' '}
                        <strong style={{ color: 'var(--primary)' }}>{filteredAssets.length}</strong> equipo{filteredAssets.length !== 1 ? 's' : ''} en{' '}
                        <strong style={{ color: 'var(--primary)' }}>{sortedGroupKeys.length}</strong> empresa{sortedGroupKeys.length !== 1 ? 's' : ''}
                    </p>
                </div>
                {currentUser?.role !== 'Cliente' && (
                    <button className="btn btn-primary" onClick={() => openModal()} style={{ flexShrink: 0 }}>
                        <Plus size={20} /> Nuevo Equipo
                    </button>
                )}
            </header>

            {/* Summary Stats Bar */}
            {currentUser?.role !== 'Cliente' && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Total Equipos', value: assets.length, icon: <Monitor size={16}/>, color: 'var(--primary)', bg: 'rgba(99,102,241,0.1)' },
                        { label: 'En Clientes', value: assets.filter(a => a.locationType === 'Cliente').length, icon: <Building2 size={16}/>, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                        { label: 'En Bodega', value: assets.filter(a => a.locationType === 'Bodega').length, icon: <Box size={16}/>, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                        { label: 'En Reparación', value: assets.filter(a => a.locationType === 'En Reparación').length, icon: <Wrench size={16}/>, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                    ].map(stat => (
                        <div key={stat.label} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1.2rem', borderRadius: '12px', flex: '1', minWidth: '140px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {stat.icon}
                            </div>
                            <div>
                                <p style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1, color: stat.color }}>{stat.value}</p>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Search toolbar */}
            <div className="glass" style={{ padding: '1rem 1.2rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Buscar por serial, ID, marca o empresa..." className="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} style={{ padding: '0.5rem', color: 'var(--text-muted)', borderRadius: '8px', transition: '0.2s' }}>
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Grouped by Company */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {sortedGroupKeys.length === 0 && (
                    <div className="glass" style={{ padding: '3rem', borderRadius: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Monitor size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No se encontraron equipos</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>Intenta con otros términos de búsqueda</p>
                    </div>
                )}
                {sortedGroupKeys.map(companyName => {
                    const companyAssets = groupedAssets[companyName];
                    const isBase = companyName === 'Inventario Base';
                    const repCount = companyAssets.filter(a => a.locationType === 'En Reparación').length;
                    const licCount = companyAssets.reduce((sum, a) => sum + a.licenses.length, 0);
                    const isCollapsed = collapsedGroups[companyName] !== false;

                    return (
                        <div key={companyName} className="company-group fade-in">
                            {/* Company Header */}
                            <div
                                className="company-header glass"
                                onClick={() => setCollapsedGroups(prev => ({ ...prev, [companyName]: prev[companyName] !== false ? false : true }))}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.4rem',
                                    borderRadius: '14px', marginBottom: isCollapsed ? 0 : '1.2rem',
                                    cursor: 'pointer', userSelect: 'none',
                                    border: `1px solid ${isBase ? 'rgba(59,130,246,0.3)' : 'rgba(99,102,241,0.25)'}`,
                                    background: isBase ? 'rgba(59,130,246,0.05)' : 'rgba(99,102,241,0.05)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                                    background: isBase ? 'rgba(59,130,246,0.15)' : 'rgba(99,102,241,0.15)',
                                    color: isBase ? '#3b82f6' : 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {isBase ? <Box size={22} /> : <Building2 size={22} />}
                                </div>

                                {/* Name & info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.15rem', color: isBase ? '#3b82f6' : 'var(--primary)' }}>
                                        {companyName}
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Monitor size={12} /> {companyAssets.length} equipo{companyAssets.length !== 1 ? 's' : ''}
                                        </span>
                                        {licCount > 0 && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                🔑 {licCount} licencia{licCount !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {repCount > 0 && (
                                            <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                                <Wrench size={12} /> {repCount} en reparación
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Employee chips */}
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', maxWidth: '260px' }}>
                                    {Array.from(new Set(companyAssets.map(a => a.assignedEmployee).filter(Boolean))).slice(0, 3).map(emp => (
                                        <span key={emp} style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'rgba(99,102,241,0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <User size={10} /> {emp}
                                        </span>
                                    ))}
                                    {Array.from(new Set(companyAssets.map(a => a.assignedEmployee).filter(Boolean))).length > 3 && (
                                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>
                                            +{Array.from(new Set(companyAssets.map(a => a.assignedEmployee).filter(Boolean))).length - 3}
                                        </span>
                                    )}
                                </div>

                                {/* Collapse chevron */}
                                <ChevronRight size={20} style={{ color: 'var(--text-muted)', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.25s ease', flexShrink: 0 }} />
                            </div>

                            {/* Assets Grid */}
                            {!isCollapsed && (
                                <div className="asset-grid fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.2rem', paddingLeft: '0.5rem' }}>
                                    {companyAssets.map(asset => (
                                        <div key={asset.id} className="card glass asset-card" style={{ borderRadius: '14px', padding: '1.4rem' }}>
                                            {/* Card Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Monitor size={20} />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3 }}>{asset.brand} {asset.model}</p>
                                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '1px' }}>{asset.equipment_id}</p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                    <span className={`location-tag ${asset.locationType.toLowerCase().replace(' ', '-')}`}>
                                                        {asset.locationType === 'Bodega' && <Box size={12} />}
                                                        {asset.locationType === 'Cliente' && <Building2 size={12} />}
                                                        {asset.locationType === 'En Reparación' && <Wrench size={12} />}
                                                        {asset.locationType}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px',
                                                        background: asset.status === 'Activo' ? 'rgba(16,185,129,0.12)' : asset.status === 'Mantenimiento' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                                        color: asset.status === 'Activo' ? '#10b981' : asset.status === 'Mantenimiento' ? '#f59e0b' : '#ef4444'
                                                    }}>
                                                        {asset.status === 'Activo' ? '● Activo' : asset.status === 'Mantenimiento' ? '● Mantenim.' : '● Baja'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Assigned Employee */}
                                            {asset.assignedEmployee && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.8rem', padding: '0.4rem 0.7rem', borderRadius: '8px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
                                                    <User size={12} color="var(--primary)" />
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Asignado a:</span>
                                                    <strong style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>{asset.assignedEmployee}</strong>
                                                </div>
                                            )}

                                            {/* Quick stats */}
                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'rgba(37,99,235,0.1)', color: 'var(--primary)' }}>
                                                    🔑 {asset.licenses.length} Lic.
                                                </span>
                                                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'rgba(13,148,136,0.1)', color: 'var(--secondary)' }}>
                                                    📦 {asset.programs.length} Prog.
                                                </span>
                                            </div>

                                            {/* Tabs */}
                                            <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--surface-border)', marginBottom: '1rem' }}>
                                                {(['specs', 'licenses', 'programs'] as const).map(tab => (
                                                    <button key={tab} onClick={() => { setExpandedAsset(asset.id); setAssetTab(tab); }}
                                                        style={{
                                                            padding: '0.45rem 0.7rem', fontSize: '0.72rem', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
                                                            color: (expandedAsset === asset.id && assetTab === tab) ? 'var(--primary)' : 'var(--text-muted)',
                                                            borderBottom: (expandedAsset === asset.id && assetTab === tab) ? '2px solid var(--primary)' : '2px solid transparent',
                                                            marginBottom: '-2px', transition: '0.2s'
                                                        }}>
                                                        {tab === 'specs' && '⚙️ Hardware'}
                                                        {tab === 'licenses' && '🔑 Licencias'}
                                                        {tab === 'programs' && '📦 Programas'}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Specs Tab */}
                                            {(expandedAsset !== asset.id || assetTab === 'specs') && (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                                                    <div>
                                                        <p className="spec-label"><Cpu size={13} /> Procesador</p>
                                                        <p className="spec-value" style={{ fontSize: '0.8rem' }}>{asset.processor || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="spec-label"><Layers size={13} /> RAM</p>
                                                        <p className="spec-value" style={{ fontSize: '0.8rem' }}>{asset.ram || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="spec-label"><HardDriveIcon size={13} /> Disco</p>
                                                        <p className="spec-value" style={{ fontSize: '0.8rem' }}>{asset.storage || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="spec-label">Serial</p>
                                                        <p className="spec-value font-mono" style={{ fontSize: '0.75rem' }}>{asset.serial}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Licenses Tab */}
                                            {expandedAsset === asset.id && assetTab === 'licenses' && (
                                                <div className="fade-in">
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.6rem' }}>
                                                        <button className="btn glass" style={{ padding: '0.35rem 0.7rem', fontSize: '0.72rem' }} onClick={() => { setActiveAsset(asset); setIsLicenseModalOpen(true); }}>
                                                            <Key size={13} /> Agregar Licencia
                                                        </button>
                                                    </div>
                                                    {asset.licenses.length === 0 ? (
                                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '0.8rem' }}>Sin licencias registradas</p>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            {asset.licenses.map(lic => {
                                                                const expired = isLicenseExpired(lic.expiryDate);
                                                                const expiring = isLicenseExpiringSoon(lic.expiryDate);
                                                                return (
                                                                    <div key={lic.id} style={{ padding: '0.7rem', borderRadius: '8px', border: `1px solid ${expired ? 'var(--error)' : expiring ? 'var(--warning)' : 'var(--surface-border)'}`, background: expired ? 'rgba(239,68,68,0.05)' : expiring ? 'rgba(245,158,11,0.05)' : 'rgba(0,0,0,0.02)' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <div>
                                                                                <p style={{ fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                                    <Key size={13} color="var(--primary)" /> {lic.name}
                                                                                </p>
                                                                                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>{lic.licenseKey}</p>
                                                                                <div style={{ display: 'flex', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
                                                                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'rgba(37,99,235,0.1)', color: 'var(--primary)' }}>{lic.type}</span>
                                                                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: expired ? 'rgba(239,68,68,0.1)' : expiring ? 'rgba(245,158,11,0.1)' : 'rgba(5,150,105,0.1)', color: expired ? 'var(--error)' : expiring ? 'var(--warning)' : 'var(--success)' }}>
                                                                                        {expired ? '⚠️ Vencida' : expiring ? '⏳ Por vencer' : '✅ Vigente'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <button onClick={async () => {
                                                                                const updated = asset.licenses.filter(l => l.id !== lic.id);
                                                                                try { await InventoryService.update(asset.id, { licenses: updated }); setAssets(assets.map(a => a.id === asset.id ? { ...a, licenses: updated } : a)); }
                                                                                catch (err) { alert("Error al eliminar licencia"); }
                                                                            }} style={{ color: 'var(--error)', padding: '3px' }}><Trash2 size={13} /></button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Programs Tab */}
                                            {expandedAsset === asset.id && assetTab === 'programs' && (
                                                <div className="fade-in">
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.6rem' }}>
                                                        <button className="btn glass" style={{ padding: '0.35rem 0.7rem', fontSize: '0.72rem' }} onClick={() => { setActiveAsset(asset); setIsProgramModalOpen(true); }}>
                                                            <AppWindow size={13} /> Agregar Programa
                                                        </button>
                                                    </div>
                                                    {asset.programs.length === 0 ? (
                                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '0.8rem' }}>Sin programas registrados</p>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                            {asset.programs.map(prog => (
                                                                <div key={prog.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.7rem', borderRadius: '6px', background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.1)' }}>
                                                                    <div>
                                                                        <p style={{ fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                            <AppWindow size={13} color="var(--secondary)" /> {prog.name}
                                                                        </p>
                                                                        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>v{prog.version} · {prog.publisher}</p>
                                                                    </div>
                                                                    <button onClick={async () => {
                                                                        const updated = asset.programs.filter(p => p.id !== prog.id);
                                                                        try { await InventoryService.update(asset.id, { programs: updated }); setAssets(assets.map(a => a.id === asset.id ? { ...a, programs: updated } : a)); }
                                                                        catch (err) { alert("Error al eliminar programa"); }
                                                                    }} style={{ color: 'var(--error)', padding: '3px' }}><Trash2 size={13} /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {currentUser?.role !== 'Cliente' && (
                                                <div style={{ borderTop: '1px solid var(--surface-border)', marginTop: '1rem', paddingTop: '0.8rem', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                                                    <button className="icon-btn edit" onClick={() => openModal(asset)}><Edit2 size={15} /></button>
                                                    <button className="icon-btn delete" onClick={() => handleDelete(asset.id)}><Trash2 size={15} /></button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Asset Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass">
                        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2>{activeAsset ? 'Editar Equipo' : 'Nuevo Equipo'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </header>

                        <form onSubmit={handleSave} className="asset-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>ID Interno (Etiqueta)</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="text" className="form-input font-mono" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} placeholder="BOD-1234" required />
                                        <button 
                                            type="button" 
                                            className="btn glass" 
                                            title="Regenerar ID" 
                                            onClick={() => {
                                                const newId = generateConsecutiveId(formData.locationType, formData.clientName);
                                                setFormData({ ...formData, id: newId });
                                            }}
                                            style={{ padding: '0 0.8rem', borderRadius: '8px' }}
                                        >
                                            <RefreshCw size={18} color="var(--primary)" />
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Ubicación</label>
                                    <select className="form-input" value={formData.locationType} onChange={e => {
                                        const newLoc = e.target.value as any;
                                        setFormData(prev => {
                                            let newId = prev.id;
                                            if (!activeAsset) {
                                                newId = generateConsecutiveId(newLoc, prev.clientName);
                                            }
                                            return { ...prev, locationType: newLoc, id: newId };
                                        });
                                    }}>
                                        <option value="Bodega">Bodega</option>
                                        <option value="Cliente">Cliente</option>
                                        <option value="En Reparación">En Reparación</option>
                                    </select>
                                </div>
                            </div>

                            {formData.locationType === 'Cliente' && (
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Seleccionar Cliente</label>
                                            <select className="form-input" value={formData.clientName} onChange={e => {
                                                const newClient = e.target.value;
                                                setFormData(prev => {
                                                    let newId = prev.id;
                                                    if (!activeAsset && prev.locationType === 'Cliente') {
                                                        newId = generateConsecutiveId('Cliente', newClient);
                                                    }
                                                    return { ...prev, clientName: newClient, assignedEmployee: '', id: newId };
                                                });
                                            }} required>
                                                <option value="">Seleccione Empresa...</option>
                                                {clients.map((c: any) => (
                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Empleado Asignado</label>
                                            {(() => {
                                                const selectedCompany = clients.find((c: any) => c.name === formData.clientName);
                                                const companyEmployees = selectedCompany?.employees || [];
                                                if (!formData.clientName) {
                                                    return <select className="form-input" disabled><option>Seleccione un cliente primero</option></select>;
                                                }
                                                if (companyEmployees.length === 0) {
                                                    return (
                                                        <>
                                                            <input type="text" className="form-input" value={formData.assignedEmployee} onChange={e => setFormData({ ...formData, assignedEmployee: e.target.value })} placeholder="Escriba el nombre del usuario..." />
                                                            <p style={{ fontSize: '0.7rem', color: 'var(--warning)', marginTop: '4px', fontWeight: 600 }}>⚠️ Sin empleados registrados en este cliente.</p>
                                                        </>
                                                    );
                                                }
                                                return (
                                                    <select className="form-input" value={formData.assignedEmployee} onChange={e => setFormData({ ...formData, assignedEmployee: e.target.value })}>
                                                        <option value="">Seleccione empleado...</option>
                                                        {companyEmployees.map((emp: any) => (
                                                            <option key={emp.id} value={emp.name}>{emp.name}</option>
                                                        ))}
                                                    </select>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="section-title">Hardware</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Marca</label>
                                    <input type="text" className="form-input" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Dell, HP, Apple..." required />
                                </div>
                                <div className="form-group">
                                    <label>Modelo</label>
                                    <input type="text" className="form-input" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Número de Serial</label>
                                <input type="text" className="form-input font-mono" value={formData.serial} onChange={e => setFormData({ ...formData, serial: e.target.value })} required />
                            </div>

                            <div className="form-row-3">
                                <div className="form-group">
                                    <label>Procesador</label>
                                    <select className="form-input" value={formData.processor} onChange={e => setFormData({ ...formData, processor: e.target.value })} required>
                                        <option value="">Seleccione Procesador...</option>
                                        <optgroup label="Intel Core">
                                            <option value="Intel Core i3 (4ta Gen)">Intel Core i3 (4ta Gen)</option>
                                            <option value="Intel Core i3 (5ta Gen)">Intel Core i3 (5ta Gen)</option>
                                            <option value="Intel Core i3 (6ta Gen)">Intel Core i3 (6ta Gen)</option>
                                            <option value="Intel Core i3 (7ma Gen)">Intel Core i3 (7ma Gen)</option>
                                            <option value="Intel Core i3 (8va Gen)">Intel Core i3 (8va Gen)</option>
                                            <option value="Intel Core i3 (9na Gen)">Intel Core i3 (9na Gen)</option>
                                            <option value="Intel Core i3 (10ma Gen)">Intel Core i3 (10ma Gen)</option>
                                            <option value="Intel Core i3 (11va Gen)">Intel Core i3 (11va Gen)</option>
                                            <option value="Intel Core i3 (12va Gen)">Intel Core i3 (12va Gen)</option>
                                            <option value="Intel Core i5 (4ta Gen)">Intel Core i5 (4ta Gen)</option>
                                            <option value="Intel Core i5 (5ta Gen)">Intel Core i5 (5ta Gen)</option>
                                            <option value="Intel Core i5 (6ta Gen)">Intel Core i5 (6ta Gen)</option>
                                            <option value="Intel Core i5 (7ma Gen)">Intel Core i5 (7ma Gen)</option>
                                            <option value="Intel Core i5 (8va Gen)">Intel Core i5 (8va Gen)</option>
                                            <option value="Intel Core i5 (9na Gen)">Intel Core i5 (9na Gen)</option>
                                            <option value="Intel Core i5 (10ma Gen)">Intel Core i5 (10ma Gen)</option>
                                            <option value="Intel Core i5 (11va Gen)">Intel Core i5 (11va Gen)</option>
                                            <option value="Intel Core i5 (12va Gen)">Intel Core i5 (12va Gen)</option>
                                            <option value="Intel Core i5 (13va Gen)">Intel Core i5 (13va Gen)</option>
                                            <option value="Intel Core i5 (14va Gen)">Intel Core i5 (14va Gen)</option>
                                            <option value="Intel Core i7 (4ta Gen)">Intel Core i7 (4ta Gen)</option>
                                            <option value="Intel Core i7 (5ta Gen)">Intel Core i7 (5ta Gen)</option>
                                            <option value="Intel Core i7 (6ta Gen)">Intel Core i7 (6ta Gen)</option>
                                            <option value="Intel Core i7 (7ma Gen)">Intel Core i7 (7ma Gen)</option>
                                            <option value="Intel Core i7 (8va Gen)">Intel Core i7 (8va Gen)</option>
                                            <option value="Intel Core i7 (9na Gen)">Intel Core i7 (9na Gen)</option>
                                            <option value="Intel Core i7 (10ma Gen)">Intel Core i7 (10ma Gen)</option>
                                            <option value="Intel Core i7 (11va Gen)">Intel Core i7 (11va Gen)</option>
                                            <option value="Intel Core i7 (12va Gen)">Intel Core i7 (12va Gen)</option>
                                            <option value="Intel Core i7 (13va Gen)">Intel Core i7 (13va Gen)</option>
                                            <option value="Intel Core i7 (14va Gen)">Intel Core i7 (14va Gen)</option>
                                            <option value="Intel Core i9 (12va Gen)">Intel Core i9 (12va Gen)</option>
                                            <option value="Intel Core i9 (13va Gen)">Intel Core i9 (13va Gen)</option>
                                            <option value="Intel Core i9 (14va Gen)">Intel Core i9 (14va Gen)</option>
                                        </optgroup>
                                        <optgroup label="AMD Ryzen">
                                            <option value="AMD Ryzen 3 (Serie 3000)">AMD Ryzen 3 (Serie 3000)</option>
                                            <option value="AMD Ryzen 3 (Serie 5000)">AMD Ryzen 3 (Serie 5000)</option>
                                            <option value="AMD Ryzen 5 (Serie 3000)">AMD Ryzen 5 (Serie 3000)</option>
                                            <option value="AMD Ryzen 5 (Serie 5000)">AMD Ryzen 5 (Serie 5000)</option>
                                            <option value="AMD Ryzen 5 (Serie 7000)">AMD Ryzen 5 (Serie 7000)</option>
                                            <option value="AMD Ryzen 5 (Serie 8000)">AMD Ryzen 5 (Serie 8000)</option>
                                            <option value="AMD Ryzen 7 (Serie 5000)">AMD Ryzen 7 (Serie 5000)</option>
                                            <option value="AMD Ryzen 7 (Serie 7000)">AMD Ryzen 7 (Serie 7000)</option>
                                            <option value="AMD Ryzen 7 (Serie 8000)">AMD Ryzen 7 (Serie 8000)</option>
                                            <option value="AMD Ryzen 9 (Serie 5000)">AMD Ryzen 9 (Serie 5000)</option>
                                            <option value="AMD Ryzen 9 (Serie 7000)">AMD Ryzen 9 (Serie 7000)</option>
                                        </optgroup>
                                        <optgroup label="Apple Silicon">
                                            <option value="Apple M1">Apple M1</option>
                                            <option value="Apple M1 Pro / Max">Apple M1 Pro / Max</option>
                                            <option value="Apple M2">Apple M2</option>
                                            <option value="Apple M2 Pro / Max">Apple M2 Pro / Max</option>
                                            <option value="Apple M3">Apple M3</option>
                                            <option value="Apple M3 Pro / Max">Apple M3 Pro / Max</option>
                                        </optgroup>
                                        <option value="Otro">Otro (Especificar en modelo)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>RAM</label>
                                    <select className="form-input" value={formData.ram} onChange={e => setFormData({ ...formData, ram: e.target.value })} required>
                                        <option value="">Seleccione RAM...</option>
                                        <option value="4 GB">4 GB</option>
                                        <option value="8 GB">8 GB</option>
                                        <option value="12 GB">12 GB</option>
                                        <option value="16 GB">16 GB</option>
                                        <option value="24 GB">24 GB</option>
                                        <option value="32 GB">32 GB</option>
                                        <option value="64 GB">64 GB</option>
                                        <option value="128 GB">128 GB</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Disco Duro</label>
                                    <select className="form-input" value={formData.storage} onChange={e => setFormData({ ...formData, storage: e.target.value })} required>
                                        <option value="">Seleccione Almacenamiento...</option>
                                        <optgroup label="SSD (Estado Sólido)">
                                            <option value="128 GB SSD">128 GB SSD</option>
                                            <option value="256 GB SSD">256 GB SSD</option>
                                            <option value="480 GB SSD">480 GB SSD</option>
                                            <option value="512 GB SSD">512 GB SSD</option>
                                            <option value="1 TB SSD">1 TB SSD</option>
                                            <option value="2 TB SSD">2 TB SSD</option>
                                            <option value="4 TB SSD">4 TB SSD</option>
                                        </optgroup>
                                        <optgroup label="HDD (Mecánico)">
                                            <option value="128 GB HDD">128 GB HDD</option>
                                            <option value="256 GB HDD">256 GB HDD</option>
                                            <option value="480 GB HDD">480 GB HDD</option>
                                            <option value="512 GB HDD">512 GB HDD</option>
                                            <option value="1 TB HDD">1 TB HDD</option>
                                            <option value="2 TB HDD">2 TB HDD</option>
                                            <option value="4 TB HDD">4 TB HDD</option>
                                        </optgroup>
                                        <optgroup label="Híbrido / Otros">
                                            <option value="256GB SSD + 1TB HDD">256GB SSD + 1TB HDD</option>
                                            <option value="512GB SSD + 1TB HDD">512GB SSD + 1TB HDD</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
                                <Save size={20} /> Guardar Equipo
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* License Modal */}
            {isLicenseModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ width: '500px' }}>
                                    <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                        <div>
                                            <h2>Agregar Licencia</h2>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Para {activeAsset?.brand} {activeAsset?.model} ({activeAsset?.equipment_id})</p>
                                        </div>
                                        <button onClick={() => setIsLicenseModalOpen(false)}><X size={24} /></button>
                                    </header>
                        <form onSubmit={handleAddLicense} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-group">
                                <label>Nombre del Software</label>
                                <input type="text" className="form-input" value={licenseForm.name} onChange={e => setLicenseForm({ ...licenseForm, name: e.target.value })} placeholder="Ej: Microsoft Office 365" required />
                            </div>
                            <div className="form-group">
                                <label>Clave de Licencia</label>
                                <input type="text" className="form-input" style={{ fontFamily: 'monospace' }} value={licenseForm.licenseKey} onChange={e => setLicenseForm({ ...licenseForm, licenseKey: e.target.value })} placeholder="XXXXX-XXXXX-XXXXX" required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Tipo de Licencia</label>
                                    <select className="form-input" value={licenseForm.type} onChange={e => setLicenseForm({ ...licenseForm, type: e.target.value as any })}>
                                        <option value="Suscripción">Suscripción</option>
                                        <option value="Perpetua">Perpetua</option>
                                        <option value="OEM">OEM</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Plazas/Puestos</label>
                                    <input type="number" className="form-input" value={licenseForm.seats} onChange={e => setLicenseForm({ ...licenseForm, seats: parseInt(e.target.value) || 1 })} min={1} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Fecha de Vencimiento</label>
                                <input type="date" className="form-input" value={licenseForm.expiryDate} onChange={e => setLicenseForm({ ...licenseForm, expiryDate: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}><Save size={20} /> Guardar Licencia</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Program Modal */}
            {isProgramModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ width: '460px' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <div>
                                <h2>Agregar Programa</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Para {activeAsset?.brand} {activeAsset?.model} ({activeAsset?.equipment_id})</p>
                            </div>
                            <button onClick={() => setIsProgramModalOpen(false)}><X size={24} /></button>
                        </header>
                        <form onSubmit={handleAddProgram} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-group">
                                <label>Nombre del Programa</label>
                                <input type="text" className="form-input" value={programForm.name} onChange={e => setProgramForm({ ...programForm, name: e.target.value })} placeholder="Ej: Google Chrome" required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Versión</label>
                                    <input type="text" className="form-input" value={programForm.version} onChange={e => setProgramForm({ ...programForm, version: e.target.value })} placeholder="Ej: 120.0" required />
                                </div>
                                <div className="form-group">
                                    <label>Editor / Publisher</label>
                                    <input type="text" className="form-input" value={programForm.publisher} onChange={e => setProgramForm({ ...programForm, publisher: e.target.value })} placeholder="Ej: Google LLC" required />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}><Save size={20} /> Registrar Programa</button>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        .search-input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.5rem; border-radius: var(--radius-sm); border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); outline: none; }
        .location-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.8rem; border-radius: 6px; }
        .location-tag.bodega { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .location-tag.cliente { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .location-tag.en-reparación { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .spec-label { font-size: 0.7rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-bottom: 0.2rem; }
        .spec-value { font-size: 0.85rem; font-weight: 600; }
        .section-title { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); margin: 1rem 0 0.5rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.8rem; }
        .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.8rem; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--text-muted); }
        .form-input { width: 100%; padding: 0.7rem; border-radius: 8px; border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); font-family: inherit; font-size: 0.9rem; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: flex-start; justify-content: center; padding: 5vh 1rem; overflow-y: auto; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { width: 550px; background: var(--surface); padding: 2.5rem; border-radius: var(--radius-lg); box-shadow: 0 20px 50px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto; }
        .icon-btn { padding: 0.4rem; border-radius: 6px; color: var(--text-muted); cursor: pointer; transition: 0.2s; }
        .icon-btn.edit:hover { background: rgba(0,0,0,0.05); color: var(--primary); }
        .icon-btn.delete:hover { background: rgba(239, 68, 68, 0.1); color: var(--error); }
      `}</style>
        </div>
    );
}

function Edit2Icon({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
}
