'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Ticket,
    Package,
    BarChart3,
    Users,
    Briefcase,
    Building2,
    PlusCircle,
    HelpCircle,
    Shield,
    LogOut,
    CalendarDays,
    BookOpen
} from 'lucide-react';

import { MODULES } from '@/lib/navigation';

export function Sidebar() {
    const pathname = usePathname();
    const [userModules, setUserModules] = React.useState<string[]>([]);

    React.useEffect(() => {
        const session = localStorage.getItem('help_session');
        if (session) {
            const user = JSON.parse(session);
            // Si es admin, ve todo por defecto, o si tiene una lista de módulos permitidos
            if (user.role === 'Administrador') {
                setUserModules(MODULES.map(m => m.label));
            } else {
                setUserModules(user.allowedModules || []);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('help_session');
        window.location.href = '/auth/login';
    };

    const filteredItems = MODULES.filter(item => userModules.includes(item.label));

    return (
        <aside className="sidebar glass" style={{ width: '280px', borderRight: '1px solid var(--surface-border)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
            <div className="sidebar-header" style={{ marginBottom: '3rem', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <img
                    src="/logo.png"
                    alt="Logo Empresa"
                    style={{ width: 'auto', maxHeight: '50px', objectFit: 'contain', alignSelf: 'flex-start' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div>
                    <h1 style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 800 }}>Help Soluciones - V7</h1>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mesa de Ayuda Pro</p>
                </div>
            </div>

            <nav className="sidebar-nav custom-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                <ul style={{ listStyle: 'none' }}>
                    {filteredItems.map((item) => {
                        const isActive = pathname === item.href;

                        return (
                            <li key={item.label} style={{ marginBottom: '0.5rem' }}>
                                <Link href={item.href} legacyBehavior>
                                    <a className={`sidebar-link ${isActive ? 'active' : ''}`} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '0.8rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        color: isActive ? 'var(--primary)' : 'var(--text-main)',
                                        background: isActive ? 'var(--primary-glow)' : 'transparent',
                                        transition: 'var(--transition-fast)',
                                        fontWeight: isActive ? 600 : 400
                                    }}>
                                        <item.icon size={20} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                                        <span>{item.label}</span>
                                    </a>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="sidebar-footer" style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem', marginTop: 'auto' }}>
                <button 
                    className="sidebar-link" 
                    onClick={handleLogout}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--error)', cursor: 'pointer', border: 'none', background: 'transparent' }}
                >
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>

            <style jsx>{`
        .sidebar-link:hover {
          background: rgba(37, 99, 235, 0.05) !important;
          transform: translateX(4px);
        }
        .sidebar-link.active:hover {
          background: rgba(37, 99, 235, 0.15) !important;
        }
      `}</style>
            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--surface-border);
          border-radius: 4px;
        }
      `}</style>
        </aside>
    );
}
