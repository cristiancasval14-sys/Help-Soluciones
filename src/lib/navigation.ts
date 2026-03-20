import {
    LayoutDashboard,
    Ticket,
    Package,
    BarChart3,
    Users,
    Briefcase,
    Building2,
    Shield,
    CalendarDays,
    BookOpen,
    Activity
} from 'lucide-react';

export const MODULES = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Acceso y Usuarios', icon: Shield, href: '/users' },
    { label: 'Asignar Visita', icon: CalendarDays, href: '/calendar' },
    { label: 'Clientes', icon: Building2, href: '/clients' },
    { label: 'Gestión Tickets', icon: Activity, href: '/management' },
    { label: 'Informes', icon: BarChart3, href: '/reports' },
    { label: 'Inventario', icon: Package, href: '/inventory' },
    { label: 'Personal Técnico', icon: Users, href: '/staff' },
    { label: 'Reporte Técnico', icon: Briefcase, href: '/service-reports' },
    { label: 'Repositorio de Soluciones', icon: BookOpen, href: '/knowledge' },
    { label: 'Tickets', icon: Ticket, href: '/tickets' },
];
