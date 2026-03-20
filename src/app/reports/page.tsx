'use client';

import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Calendar,
    Download,
    Filter,
    Database,
    Clock,
    CheckCircle,
    PieChart as PieChartIcon,
    FileText,
    Users,
    TrendingUp
} from 'lucide-react';
import { InventoryService, CompanyService, TicketService, StaffService } from '@/lib/services';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Ticket {
    id: string;
    client: string;
    requester: string;
    type: string;
    priority: string;
    status: string;
    date: string;
    assignedTo?: string;
    techNotes?: string;
    description?: string;
    assetId?: string;
}

interface User {
    id: string;
    username: string;
    role: string;
    assignedTo: string;
}

export default function Reports() {
    const [generating, setGenerating] = useState(false);
    const [filters, setFilters] = useState({
        client: 'Todos los Clientes',
        employee: 'Todos los Usuarios',
        technician: 'Todos los Técnicos',
        equipment: 'Todos los Equipos',
        startDate: '',
        endDate: ''
    });
    
    const [inventory, setInventory] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [technicians, setTechnicians] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
             try {
                 const [invData, clientData, ticketData, staffData] = await Promise.all([
                     InventoryService.getAll(),
                     CompanyService.getAll(),
                     TicketService.getAll(),
                     StaffService.getAll()
                 ]);

                 setInventory(invData as any[]);
                 setClients(clientData as any[]);
                 setTickets(ticketData.map((t: any) => ({
                    id: t.id,
                    client: t.company?.name || '---',
                    requester: t.requester_name,
                    type: t.type,
                    priority: t.priority,
                    status: t.status,
                    date: t.date || t.created_at?.split('T')[0],
                    assignedTo: t.staff ? `${t.staff.first_name} ${t.staff.last_name}` : undefined,
                    techNotes: t.tech_notes,
                    description: t.description,
                    assetId: t.inventory_id
                 })));

                 setTechnicians(staffData.map((s: any) => `${s.first_name} ${s.last_name}`));
             } catch (err) {
                 console.error("Error loading reports data:", err);
             }
        };

        fetchData();
    }, []);

    const getFilteredTickets = () => {
        return tickets.filter(t => {
            const matchClient = filters.client === 'Todos los Clientes' || t.client === filters.client;
            const matchTech = filters.technician === 'Todos los Técnicos' || t.assignedTo === filters.technician;
            const matchEquip = filters.equipment === 'Todos los Equipos' || t.assetId === filters.equipment;
            const matchUser = filters.employee === 'Todos los Usuarios' || t.requester === filters.employee;
            
            let matchDate = true;
            if (filters.startDate) matchDate = matchDate && t.date >= filters.startDate;
            if (filters.endDate) matchDate = matchDate && t.date <= filters.endDate;

            return matchClient && matchTech && matchEquip && matchDate && matchUser;
        });
    };

    const generatePDF = () => {
        const filteredData = getFilteredTickets();
        if (filteredData.length === 0) {
            alert('No hay datos para exportar con los filtros seleccionados.');
            return;
        }

        setGenerating(true);
        const doc = new jsPDF() as any;

        // -- Page Styling --
        const primaryColor = [67, 56, 202]; // Indigo 700
        const lightGray = [249, 250, 251];

        // Header Rect
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 40, 'F');

        // Logo Simulation / Text
        doc.setTextColor(255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('HELP SOLUCIONES', 14, 25);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('REPORTE OFICIAL DE SERVICIOS TÉCNICOS', 14, 32);

        // Metadata Right aligned
        doc.setFontSize(9);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 196, 20, { align: 'right' });
        doc.text(`ID Reporte: HS-${Math.floor(Date.now() / 10000)}`, 196, 26, { align: 'right' });

        // -- Summary Box --
        doc.setTextColor(50);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen de Filtros Aplicados', 14, 55);

        const filterSummary = [
            ['Cliente:', filters.client, 'Técnico:', filters.technician],
            ['Desde:', filters.startDate || 'Inicio', 'Hasta:', filters.endDate || 'Hoy'],
            ['Equipo:', filters.equipment, 'Total Encontrado:', filteredData.length.toString()]
        ];

        doc.autoTable({
            startY: 60,
            body: filterSummary,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', width: 25 }, 2: { fontStyle: 'bold', width: 35 } }
        });

        // -- Stats Bar --
        const resolved = filteredData.filter(t => ['Resuelto', 'Terminado', 'Finalizado', 'Cerrado'].includes(t.status)).length;
        const pending = filteredData.length - resolved;
        const resolutionRate = ((resolved / filteredData.length) * 100).toFixed(1);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Indicadores de Rendimiento', 14, doc.lastAutoTable.finalY + 15);

        const statsData = [
            ['Total Solicitudes', 'Tickets Finalizados', 'Tickets Pendientes', '% Efectividad'],
            [filteredData.length.toString(), resolved.toString(), pending.toString(), `${resolutionRate}%`]
        ];

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [statsData[0]],
            body: [statsData[1]],
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: 255, halign: 'center' },
            bodyStyles: { halign: 'center', fontSize: 12, fontStyle: 'bold' }
        });

        // -- Detailed Table --
        doc.setFontSize(11);
        doc.text('Desglose Detallado de Actividades', 14, doc.lastAutoTable.finalY + 15);

        const tableRows = filteredData.map(t => [
            t.id,
            t.date,
            t.client,
            t.assignedTo || 'Sin asignar',
            t.status,
            t.priority
        ]);

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Ticket ID', 'Fecha', 'Empresa / Cliente', 'Técnico Responsable', 'Estado', 'Prioridad']],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [100, 116, 139], textColor: 255 }, // Slate 500
            styles: { fontSize: 8 },
            columnStyles: {
                0: { fontStyle: 'bold' }
            }
        });

        // -- Footer / Signatures --
        const finalY = doc.lastAutoTable.finalY + 30;
        if (finalY < 250) {
            doc.setLineWidth(0.5);
            doc.line(14, finalY, 70, finalY);
            doc.line(130, finalY, 190, finalY);
            
            doc.setFontSize(8);
            doc.text('Firma Responsable Help Soluciones', 14, finalY + 5);
            doc.text('Sello / Firma de Conformidad Cliente', 130, finalY + 5);
        }

        // Page Numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Help Soluciones e Ingeniería - www.helpsoluciones.com | Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
        }

        doc.save(`Reporte_HS_${new Date().toISOString().split('T')[0]}.pdf`);
        setGenerating(false);
    };

    const generateExcel = () => {
        const filteredData = getFilteredTickets();
        if (filteredData.length === 0) {
            alert('No hay datos para exportar con los filtros seleccionados.');
            return;
        }

        const worksheetData = filteredData.map(t => ({
            'ID Ticket': t.id,
            'Fecha': t.date,
            'Empresa / Cliente': t.client,
            'Usuario Solicitante': t.requester,
            'Técnico Asignado': t.assignedTo || 'Sin asignar',
            'Equipo (ID)': t.assetId || 'N/A',
            'Tipo de Servicio': t.type,
            'Prioridad': t.priority,
            'Estado': t.status,
            'Descripción': t.description || '',
            'Notas Técnicas': t.techNotes || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Soportes");

        // Column widths for better presentation
        const wscols = [
            { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 25 }, 
            { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, 
            { wch: 12 }, { wch: 40 }, { wch: 40 }
        ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `Reporte_Tickets_HS_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="reports-page fade-in">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem' }}>Informes Avanzados</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Análisis de rendimiento, KPIs e indicadores de servicio</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" style={{ padding: '0.8rem 1.2rem' }} onClick={generatePDF} disabled={generating}>
                        <FileText size={18} /> {generating ? 'Generando PDF...' : 'Exportar PDF'}
                    </button>
                    <button className="btn glass" style={{ padding: '0.8rem 1.2rem', color: 'var(--success)', borderColor: 'var(--success)' }} onClick={generateExcel}>
                        <Database size={18} /> Exportar Excel
                    </button>
                </div>
            </header>

            {/* Filter Section */}
            <div className="filter-bar glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', alignItems: 'flex-end' }}>
                <div className="filter-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-muted)' }}><Calendar size={14}/> FECHA INICIAL</label>
                    <input type="date" className="form-input" style={{ width: '100%' }} value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                </div>
                <div className="filter-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-muted)' }}><Calendar size={14}/> FECHA FINAL</label>
                    <input type="date" className="form-input" style={{ width: '100%' }} value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                </div>
                <div className="filter-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-muted)' }}><Database size={14}/> CLIENTE</label>
                    <select className="form-input" style={{ width: '100%' }} value={filters.client} onChange={e => setFilters({ ...filters, client: e.target.value, employee: 'Todos los Usuarios' })}>
                        <option>Todos los Clientes</option>
                        {clients.map((c: any) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-muted)' }}><Users size={14}/> USUARIO SOLICITANTE</label>
                    <select className="form-input" style={{ width: '100%' }} value={filters.employee} onChange={e => setFilters({ ...filters, employee: e.target.value })} disabled={filters.client === 'Todos los Clientes'}>
                        <option value="Todos los Usuarios">Todos los Usuarios</option>
                        {(() => {
                            const selectedClient = clients.find(c => c.name === filters.client);
                            if (!selectedClient) return null;
                            return (selectedClient.employees || []).map((emp: any) => (
                                <option key={emp.id} value={emp.name}>{emp.name}</option>
                            ));
                        })()}
                    </select>
                </div>
                <div className="filter-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-muted)' }}><Database size={14}/> EQUIPO (ID)</label>
                    <select className="form-input" style={{ width: '100%' }} value={filters.equipment} onChange={e => setFilters({ ...filters, equipment: e.target.value })}>
                        <option value="Todos los Equipos">Todos los Equipos</option>
                        {(() => {
                            let filteredInv = inventory;
                            if (filters.client !== 'Todos los Clientes') {
                                filteredInv = filteredInv.filter((inv: any) => inv.clientName === filters.client);
                            }
                            return filteredInv.map((inv: any) => (
                                <option key={inv.id} value={inv.equipment_id}>{inv.equipment_id} - {inv.brand} {inv.model}</option>
                            ));
                        })()}
                    </select>
                </div>
                <div className="filter-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-muted)' }}><Users size={14}/> TÉCNICO ASIGNADO</label>
                    <select className="form-input" style={{ width: '100%' }} value={filters.technician} onChange={e => setFilters({ ...filters, technician: e.target.value })}>
                        <option>Todos los Técnicos</option>
                        {technicians.map(tech => (
                            <option key={tech} value={tech}>{tech}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Dashboard Simulation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="card glass" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TICKETS TOTALES</span>
                        <TrendingUp size={18} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{getFilteredTickets().length}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Bajo los filtros actuales</p>
                </div>
                <div className="card glass" style={{ borderLeft: '4px solid var(--success)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>RESOLUCIÓN</span>
                        <CheckCircle size={18} color="var(--success)" />
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>
                        {(() => {
                            const data = getFilteredTickets();
                            if (data.length === 0) return '0%';
                            const resolved = data.filter(t => ['Resuelto', 'Terminado', 'Finalizado', 'Cerrado'].includes(t.status)).length;
                            return `${((resolved / data.length) * 100).toFixed(0)}%`;
                        })()}
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Efectividad en cierre</p>
                </div>
                <div className="card glass" style={{ borderLeft: '4px solid var(--warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>PRIORIDAD ALTA</span>
                        <Clock size={18} color="var(--warning)" />
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>
                        {getFilteredTickets().filter(t => t.priority === 'Alta' || t.priority === 'Crítica').length}
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Casos urgentes</p>
                </div>
            </div>

            <div className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Vista Previa de Registros</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mostrando {getFilteredTickets().length} registros encontrados</span>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem', borderBottom: '1px solid var(--surface-border)' }}>ID</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem', borderBottom: '1px solid var(--surface-border)' }}>CLIENTE</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem', borderBottom: '1px solid var(--surface-border)' }}>TÉCNICO</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem', borderBottom: '1px solid var(--surface-border)' }}>ESTADO</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem', borderBottom: '1px solid var(--surface-border)' }}>FECHA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredTickets().length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron registros bajo estos parámetros.</td>
                                </tr>
                            ) : (
                                getFilteredTickets().map(t => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{t.id}</td>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{t.client}</td>
                                        <td style={{ padding: '1rem' }}>{t.assignedTo || 'Sin asignar'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)' }}>{t.status}</span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{t.date}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                .form-input { padding: 0.8rem; border-radius: 8px; border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); font-family: inherit; }
                .card { transition: 0.3s; }
                .card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
            `}</style>
        </div>
    );
}
