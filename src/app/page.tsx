'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Ticket,
  Zap,
  BarChart3,
  Monitor,
  Users
} from 'lucide-react';

export default function Home() {
  return (
    <div className="landing-page fade-in" style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <section className="hero" style={{ textAlign: 'center', marginBottom: '8rem', marginTop: '4rem' }}>
        <div style={{ display: 'inline-flex', padding: '0.5rem 1rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '2rem', gap: '8px', alignItems: 'center' }}>
          <Zap size={14} /> Nueva Versión 2.0 Operacional
        </div>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1, background: 'linear-gradient(135deg, var(--text-main) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Gestión Inteligente de <br /> Soporte Tecnológico
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 3rem auto', lineHeight: 1.6 }}>
          Mesa de Ayuda profesional para empresas que prestan soporte técnico a múltiples clientes.
          Escalable, segura y diseñada para la eficiencia operativa.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          <Link href="/auth/login" className="btn btn-primary" style={{ padding: '1.2rem 2.5rem', fontSize: '1.1rem', borderRadius: 'var(--radius-md)' }}>
            <ShieldCheck size={20} /> Entrar al Portal <ArrowRight size={20} />
          </Link>
          <Link href="#features" className="btn glass" style={{ padding: '1.2rem 2.5rem', fontSize: '1.1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', border: '1px solid var(--surface-border)' }}>
            Explorar Módulos
          </Link>
        </div>
      </section>

      <section id="features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', marginBottom: '8rem' }}>
        {[
          { title: 'Gestor de Tickets', icon: Ticket, desc: 'Clasificación automática, historial de actividades y estados inteligentes.', color: 'var(--primary)' },
          { title: 'ANS / SLA', icon: Zap, desc: 'Control de tiempos de respuesta y solución según la prioridad del incidente.', color: 'var(--warning)' },
          { title: 'Inventario CMDB', icon: Monitor, desc: 'Gestión detallada de activos tecnológicos por cliente y ubicación.', color: 'var(--info)' },
          { title: 'Dashboard KPI', icon: BarChart3, desc: 'Métricas de desempeño, cumplimiento de SLA y productividad técnica.', color: 'var(--success)' },
          { title: 'Multicliente', icon: Users, desc: 'Aislamiento de datos y gestión de perfiles para múltiples organizaciones.', color: 'var(--secondary)' },
          { title: 'Seguridad RBAC', icon: ShieldCheck, desc: 'Control de acceso basado en roles: Admin, Coordinador, Técnico, Cliente.', color: 'var(--error)' },
        ].map(item => (
          <div key={item.title} className="card glass feature-card" style={{ padding: '2.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <item.icon size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.8rem' }}>{item.title}</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
          </div>
        ))}
      </section>

      <footer style={{ textAlign: 'center', borderTop: '1px solid var(--surface-border)', paddingTop: '4rem', paddingBottom: '4rem' }}>
        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>Help Soluciones</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>© 2026 Help Soluciones. Todos los derechos reservados.</p>
      </footer>

      <style jsx>{`
        .feature-card:hover { transform: translateY(-8px); border-color: var(--primary) !important; background: rgba(99, 102, 241, 0.05) !important; transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
      `}</style>
    </div>
  );
}
