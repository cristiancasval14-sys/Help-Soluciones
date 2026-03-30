'use client';

import React, { useState, useEffect } from 'react';
import {
    LogIn,
    ShieldCheck,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Send,
    AlertCircle
} from 'lucide-react';
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
                setError('Acceso denegado. Verifique sus credenciales.');
            }
        } catch (err) {
            setLoading(false);
            setError('Fallo en la comunicación con el servidor de seguridad.');
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
            alert("Error al procesar la solicitud de recuperación.");
        }
    };

    return (
        <div className="login-wrapper">
            {/* Animated Background Elements */}
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>
            <div className="bg-blob blob-3"></div>
            <div className="grid-overlay"></div>

            <div className="login-content fade-in">
                <div className="login-card glass">
                    <div className="card-accent"></div>
                    
                    <header className="login-header">
                        <div className="logo-container">
                            <img src="/logo.png" alt="Help Soluciones" className="logo-img" />
                        </div>
                        <h1 className="title-gradient">Help Soluciones</h1>
                        <p className="subtitle">Soporte Mesa de Ayuda</p>
                    </header>

                    {error && (
                        <div className="error-alert">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-group">
                            <label className="field-label">
                                <Mail size={15} className="label-icon" />
                                Nombre de Usuario
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    placeholder="ej. administrador_it"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="field-label">
                                <Lock size={15} className="label-icon" />
                                Contraseña
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="form-footer">
                                <button 
                                    type="button"
                                    className="forgot-link"
                                    onClick={() => setShowResetModal(true)} 
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? (
                                <div className="loader"></div>
                            ) : (
                                <>
                                    <span>Iniciar Sesión</span>
                                    <LogIn size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <footer className="login-footer">
                        <p>© 2026 Help Soluciones e Ingeniería S.A.S.</p>
                    </footer>
                </div>
            </div>

            {/* Premium Reset Modal */}
            {showResetModal && (
                <div className="modal-overlay">
                    <div className="modal-card glass scale-up">
                        {!resetSent ? (
                            <>
                                <div className="modal-icon-container">
                                    <ShieldCheck size={32} />
                                </div>
                                <h2>Recuperar Credenciales</h2>
                                <p>Por favor ingrese su identidad de usuario asignada. Un administrador revisará la solicitud de restablecimiento.</p>
                                <form onSubmit={handleRequestReset}>
                                    <div className="input-wrapper" style={{ marginBottom: '1.5rem' }}>
                                        <Mail className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Nombre de usuario"
                                            value={resetUsername}
                                            onChange={e => setResetUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" onClick={() => setShowResetModal(false)} className="btn-cancel">Descartar</button>
                                        <button type="submit" className="btn-submit">
                                            <Send size={18} /> 
                                            <span>Notificar Admin</span>
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="success-message fade-in">
                                <div className="success-icon">
                                    <ShieldCheck size={40} />
                                </div>
                                <h2>Solicitud Enviada</h2>
                                <p>Se ha generado una alarma de seguridad para el administrador. Se le contactará a la brevedad.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .login-wrapper {
                    min-height: 100vh;
                    width: 100vw;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #f0f4f8;
                    background-image: radial-gradient(ellipse at 60% 0%, #dbeafe 0%, transparent 60%),
                                      radial-gradient(ellipse at 10% 80%, #e0f2fe 0%, transparent 50%);
                    position: relative;
                    overflow: hidden;
                    font-family: 'Inter', -apple-system, sans-serif;
                }

                .bg-blob {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    border-radius: 50%;
                    filter: blur(120px);
                    z-index: 1;
                    opacity: 0.25;
                    animation: float 20s infinite alternate;
                }
                .blob-1 { background: #93c5fd; top: -100px; left: -100px; }
                .blob-2 { background: #99f6e4; bottom: -100px; right: -100px; animation-delay: -5s; }
                .blob-3 { background: #c7d2fe; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.2; }

                @keyframes float {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(50px, 100px) scale(1.1); }
                }

                .grid-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(rgba(59, 130, 246, 0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(59, 130, 246, 0.04) 1px, transparent 1px);
                    background-size: 50px 50px;
                    z-index: 2;
                    pointer-events: none;
                }

                .login-content {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 480px;
                    padding: 20px;
                }

                .login-card {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(25px) saturate(180%);
                    -webkit-backdrop-filter: blur(25px) saturate(180%);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 24px;
                    padding: 3.5rem 2.5rem;
                    box-shadow: 0 25px 60px -12px rgba(59, 130, 246, 0.12), 0 4px 16px rgba(0,0,0,0.06);
                    position: relative;
                    overflow: hidden;
                }

                .card-accent {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #3b82f6, #0d9488);
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .logo-container {
                    margin: 0 auto 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .logo-img {
                    height: 72px;
                    width: auto;
                    object-fit: contain;
                }

                .title-gradient {
                    font-size: 2.25rem;
                    font-weight: 800;
                    letter-spacing: -0.025em;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .subtitle {
                    color: #64748b;
                    font-size: 0.95rem;
                    font-weight: 500;
                }

                .error-alert {
                    background: rgba(239, 68, 68, 0.08);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #dc2626;
                    padding: 1rem;
                    border-radius: 12px;
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 2rem;
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }

                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .field-label {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.75rem;
                    padding-left: 4px;
                }

                .label-icon {
                    color: #3b82f6;
                    flex-shrink: 0;
                }

                .input-wrapper {
                    position: relative;
                    transition: all 0.3s ease;
                }

                .input-wrapper input {
                    width: 100%;
                    background: #f8fafc;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 1rem 1rem 1rem 1rem;
                    color: #0f172a;
                    font-size: 1rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .input-wrapper input::placeholder {
                    color: #cbd5e1;
                }

                .input-wrapper input:focus {
                    outline: none;
                    background: #fff;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }

                .password-toggle {
                    position: absolute;
                    right: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 4px;
                    transition: color 0.3s ease;
                }

                .password-toggle:hover {
                    color: #3b82f6;
                }

                .form-footer {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 0.5rem;
                }

                .forgot-link {
                    background: none;
                    border: none;
                    color: #64748b;
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: color 0.2s ease;
                }

                .forgot-link:hover {
                    color: #3b82f6;
                    text-decoration: underline;
                }

                .login-btn {
                    margin-top: 1rem;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border: none;
                    border-radius: 14px;
                    padding: 1.1rem;
                    color: #fff;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 8px 20px -5px rgba(37, 99, 235, 0.35);
                }

                .login-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px -10px rgba(37, 99, 235, 0.5);
                    background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
                }

                .login-btn:active:not(:disabled) {
                    transform: translateY(0);
                }

                .login-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .loader {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .login-footer {
                    margin-top: 3rem;
                    padding-top: 2rem;
                    border-top: 1px solid #f1f5f9;
                    text-align: center;
                }

                .login-footer p {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    letter-spacing: 0.02em;
                }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .modal-card {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    max-width: 440px;
                    width: 100%;
                    padding: 3rem;
                    border-radius: 28px;
                    text-align: center;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.12);
                }

                .modal-icon-container {
                    width: 70px;
                    height: 70px;
                    background: rgba(59, 130, 246, 0.08);
                    color: #3b82f6;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                }

                .modal-card h2 {
                    font-size: 1.5rem;
                    color: #0f172a;
                    margin-bottom: 1rem;
                }

                .modal-card p {
                    color: #64748b;
                    font-size: 0.9rem;
                    line-height: 1.6;
                    margin-bottom: 2rem;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                }

                .btn-cancel {
                    flex: 1;
                    padding: 0.8rem;
                    border-radius: 12px;
                    border: 1.5px solid #e2e8f0;
                    background: transparent;
                    color: #475569;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .btn-cancel:hover { background: #f8fafc; }

                .btn-submit {
                    flex: 2;
                    padding: 0.8rem;
                    border-radius: 12px;
                    background: #3b82f6;
                    color: #fff;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .success-icon {
                    color: #10b981;
                    margin-bottom: 1.5rem;
                }

                .success-message h2 { color: #0f172a; }

                .fade-in { animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
                .scale-up { animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }

                @media (max-width: 480px) {
                    .login-card { padding: 2.5rem 1.5rem; }
                    .title-gradient { font-size: 1.75rem; }
                }
            `}</style>
        </div>
    );
}
