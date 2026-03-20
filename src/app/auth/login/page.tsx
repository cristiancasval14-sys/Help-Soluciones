'use client';

import React, { useState } from 'react';
import {
    LogIn,
    ShieldCheck,
    Mail,
    Lock,
    ChevronRight,
    HelpCircle,
    Eye,
    EyeOff,
    Send,
    X,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserService, PasswordRequestService } from '@/lib/services';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Forgot Password States
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetUsername, setResetUsername] = useState('');
    const [resetSent, setResetSent] = useState(false);
    
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const validUser = await UserService.login(username, password);
            if (validUser) {
                // Map DB snake_case to UI/Legacy camelCase if needed elsewhere
                const sessionUser = {
                    id: validUser.id,
                    username: validUser.username,
                    role: validUser.role,
                    assignedTo: validUser.assigned_to,
                    type: validUser.type,
                    status: validUser.status,
                    allowedModules: validUser.allowed_modules || []
                };
                localStorage.setItem('help_session', JSON.stringify(sessionUser));
                router.push('/dashboard');
            } else {
                setLoading(false);
                setError('Credenciales incorrectas. Verifique su usuario y contraseña.');
            }
        } catch (err) {
            setLoading(false);
            setError('Error de conexión con el servidor.');
        }
    };

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetUsername) return;

        try {
            await PasswordRequestService.create(resetUsername);
            setResetSent(true);
            setTimeout(() => {
                setShowResetModal(false);
                setResetSent(false);
                setResetUsername('');
            }, 2500);
        } catch (err) {
            alert("Error al enviar solicitud");
        }
    };

    return (
        <div className="login-container fade-in" style={{
            minHeight: '100vh', width: '100vw',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(13, 148, 136, 0.05) 0%, transparent 40%)'
        }}>
            <div className="login-card glass" style={{ width: '420px', padding: '3rem', borderRadius: 'var(--radius-lg)' }}>
                <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                        <img
                            src="/logo.png"
                            alt="Logo Empresa"
                            style={{ height: '70px', width: 'auto', objectFit: 'contain' }}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Help Soluciones</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Plataforma Centralizada de Soporte</p>
                </header>

                {error && (
                    <div style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--error)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Nombre de Usuario</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ej: admin"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                                style={{ padding: '0.8rem 1rem 0.8rem 2.8rem', width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{ padding: '0.8rem 3rem 0.8rem 2.8rem', width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                            <button 
                                type="button"
                                onClick={() => setShowResetModal(true)} 
                                style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </p>
                    </div>

                    <button className="btn btn-primary" style={{ padding: '1rem', width: '100%', fontSize: '1rem', marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Validando...' : (
                            <>
                                <LogIn size={20} /> Entrar al Sistema
                            </>
                        )}
                    </button>
                </form>

                <footer style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--surface-border)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Soporte técnico externo para clientes corporativos</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                        <Link href="#" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <HelpCircle size={14} /> Centro de Ayuda
                        </Link>
                    </div>
                </footer>
            </div>

            {/* Password Reset Modal */}
            {showResetModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
                    <div className="modal-content glass" style={{ width: '400px', padding: '2.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                        {!resetSent ? (
                            <>
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                                    <HelpCircle size={32} />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Recuperar Acceso</h2>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                    Ingrese su nombre de usuario para notificar al administrador. Se generará un reporte de restablecimiento.
                                </p>
                                <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Tu nombre de usuario"
                                        value={resetUsername}
                                        onChange={e => setResetUsername(e.target.value)}
                                        required
                                        style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', width: '100%' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                        <button type="button" onClick={() => setShowResetModal(false)} className="btn glass" style={{ flex: 1 }}>Cancelar</button>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                            <Send size={18} /> Enviar Reporte
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="fade-in">
                                <div style={{ background: 'var(--success)', color: 'white', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                                    <ShieldCheck size={32} />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Reporte Enviado</h2>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    Se ha notificado al administrador de soporte. Por favor, espere a que su contraseña sea restablecida.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .form-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px var(--primary-glow); outline: none; }
                .fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
