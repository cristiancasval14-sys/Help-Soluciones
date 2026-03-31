'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, Search, BookOpen, Tag, Eye, ThumbsUp, ThumbsDown,
    X, Save, Trash2, ChevronRight, FolderOpen, FileText,
    Edit2, Clock, Filter, Star, Bookmark
} from 'lucide-react';
import { KnowledgeBaseService } from '@/lib/services';

interface Article {
    id: string;
    kbId: string;
    title: string;
    category: string;
    tags: string[];
    content: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    views: number;
    helpful: number;
    notHelpful: number;
    pinned: boolean;
}

const CATEGORIES = [
    { id: 'hardware', name: 'Hardware', icon: '🖥️', color: '#3b82f6' },
    { id: 'software', name: 'Software', icon: '💿', color: '#8b5cf6' },
    { id: 'redes', name: 'Redes', icon: '🌐', color: '#06b6d4' },
    { id: 'seguridad', name: 'Seguridad', icon: '🔒', color: '#ef4444' },
    { id: 'email', name: 'Correo Electrónico', icon: '📧', color: '#f59e0b' },
    { id: 'impresoras', name: 'Impresoras', icon: '🖨️', color: '#10b981' },
    { id: 'general', name: 'General', icon: '📋', color: '#6b7280' },
];

export default function KnowledgeBase() {
    const [articles, setArticles] = useState<Article[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [activeArticle, setActiveArticle] = useState<Article | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [formData, setFormData] = useState({
        title: '', category: 'general', tags: '', content: '', author: ''
    });

    // Load and fetch from Supabase
    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const data = await KnowledgeBaseService.getAll();
                const mapped: Article[] = data.map((a: any) => ({
                    id: a.id,
                    kbId: a.kb_id,
                    title: a.title,
                    category: a.category,
                    tags: a.tags || [],
                    content: a.content,
                    author: a.author_name,
                    createdAt: a.created_at?.split('T')[0],
                    updatedAt: a.updated_at?.split('T')[0],
                    views: a.views,
                    helpful: a.helpful,
                    notHelpful: a.not_helpful,
                    pinned: !!a.pinned
                }));

                // If empty, add some common solutions as examples
                if (mapped.length === 0) {
                    const examples: Article[] = [
                        {
                            id: 'ex1', kbId: 'KB-101', title: 'Problemas de Conexión a Internet (Wi-Fi/LAN)', category: 'redes',
                            tags: ['internet', 'red', 'wifi'], author: 'Soporte Help', views: 45, helpful: 12, notHelpful: 0, pinned: true,
                            createdAt: '2024-03-20', updatedAt: '2024-03-20',
                            content: '1. Verifique que el cable de red esté conectado correctamente.\n2. Reinicie el router o switch de su área.\n3. Verifique que el adaptador de red esté habilitado en Panel de Control.\n4. Ejecute el comando ipconfig /release y ipconfig /renew en la terminal.'
                        },
                        {
                            id: 'ex2', kbId: 'KB-102', title: 'Impresora no responde o está en cola', category: 'impresoras',
                            tags: ['impresora', 'cola', 'print'], author: 'Soporte Help', views: 82, helpful: 24, notHelpful: 2, pinned: false,
                            createdAt: '2024-03-21', updatedAt: '2024-03-21',
                            content: '1. Verifique que la impresora esté encendida y tenga papel.\n2. Reinicie el servicio de "Cola de impresión" (Spooler) en Windows Services.\n3. Asegúrese de que no haya documentos atascados en la bandeja física.'
                        },
                        {
                            id: 'ex3', kbId: 'KB-103', title: 'Configuración de Correo en Outlook', category: 'email',
                            tags: ['outlook', 'correo', 'config'], author: 'Soporte Help', views: 120, helpful: 50, notHelpful: 1, pinned: false,
                            createdAt: '2024-03-22', updatedAt: '2024-03-22',
                            content: 'Para configurar su correo corporativo:\n1. Abra Outlook > Archivo > Agregar cuenta.\n2. Ingrese su dirección de correo completa.\n3. Seleccione IMAP/POP según las instrucciones enviadas por IT.\n4. Servidor de entrada: mail.empresa.com (Puerto 993 SSL).\n5. Servidor de salida: mail.empresa.com (Puerto 465 SSL).'
                        },
                        {
                            id: 'ex4', kbId: 'KB-104', title: 'El equipo no enciende o pantalla negra', category: 'hardware',
                            tags: ['energia', 'pc', 'hardware'], author: 'Soporte Help', views: 30, helpful: 5, notHelpful: 0, pinned: false,
                            createdAt: '2024-03-23', updatedAt: '2024-03-23',
                            content: '1. Verifique la conexión a la toma de corriente.\n2. Pruebe con otro cable de poder si es posible.\n3. Mantenga presionado el botón de encendido por 30 segundos (descarga estática).\n4. Si es portátil, verifique si el indicador de carga del adaptador enciende.'
                        }
                    ];
                    setArticles(examples);
                } else {
                    setArticles(mapped);
                }
            } catch (err) {
                console.error("Error connecting to Supabase KB:", err);
            }
        };

        fetchArticles();
    }, []);

    const openNew = () => {
        setActiveArticle(null);
        setFormData({ title: '', category: 'general', tags: '', content: '', author: '' });
        setIsModalOpen(true);
    };

    const openEdit = (art: Article) => {
        setActiveArticle(art);
        setFormData({ title: art.title, category: art.category, tags: art.tags.join(', '), content: art.content, author: art.author });
        setIsModalOpen(true);
    };

    const openView = async (art: Article) => {
        setActiveArticle(art);
        setIsViewOpen(true);
        // Track view in DB
        try {
            await KnowledgeBaseService.update(art.id, { views: art.views + 1 });
            setArticles(articles.map(a => a.id === art.id ? { ...a, views: a.views + 1 } : a));
        } catch (err) {
            console.error("Error updating views:", err);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                title: formData.title,
                category: formData.category,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                content: formData.content,
                author_name: formData.author,
                updated_at: new Date().toISOString()
            };

            if (activeArticle) {
                await KnowledgeBaseService.update(activeArticle.id, payload);
                setArticles(articles.map(a => a.id === activeArticle.id ? { 
                    ...a, 
                    title: formData.title, 
                    category: formData.category,
                    tags: payload.tags,
                    content: formData.content,
                    author: formData.author,
                    updatedAt: new Date().toISOString().split('T')[0]
                } : a));
            } else {
                const newArtData = await KnowledgeBaseService.create({
                    ...payload,
                    kb_id: `KB-${Math.floor(100+Math.random()*900)}`
                });
                setArticles([{
                    id: newArtData.id,
                    kbId: newArtData.kb_id,
                    title: newArtData.title,
                    category: newArtData.category,
                    tags: newArtData.tags,
                    content: newArtData.content,
                    author: newArtData.author_name,
                    createdAt: newArtData.created_at.split('T')[0],
                    updatedAt: newArtData.updated_at.split('T')[0],
                    views: 0,
                    helpful: 0,
                    notHelpful: 0,
                    pinned: false
                }, ...articles]);
            }
            setIsModalOpen(false);
        } catch (err) {
            alert("Error al guardar en Supabase");
        }
    };

    const vote = async (id: string, type: 'helpful' | 'notHelpful') => {
        const dbField = type === 'helpful' ? 'helpful' : 'not_helpful';
        const article = articles.find(a => a.id === id);
        if (!article) return;
        
        try {
            const newVal = (article as any)[type] + 1;
            await KnowledgeBaseService.update(id, { [dbField]: newVal });
            setArticles(articles.map(a => a.id === id ? { ...a, [type]: newVal } : a));
        } catch (err) {
            console.error("Error voting:", err);
        }
    };

    const filtered = articles.filter((a: Article) => {
        const matchSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.tags.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
            a.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = !filterCategory || a.category === filterCategory;
        return matchSearch && matchCat;
    }).sort((a: Article, b: Article) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    const getCat = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[6];

    return (
        <div className="knowledge-page fade-in">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Repositorio de Soluciones</h1>
                    <p style={{ color: 'var(--text-muted)' }}></p>
                </div>
                <button className="btn btn-primary" onClick={openNew}><Plus size={20} /> Nuevo Artículo</button>
            </header>

            {/* Category chips */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <button onClick={() => setFilterCategory('')}
                    className={`cat-chip ${!filterCategory ? 'active' : ''}`}>
                    📁 Todas ({articles.length})
                </button>
                {CATEGORIES.map((cat: any) => {
                    const count = articles.filter((a: Article) => a.category === cat.id).length;
                    return (
                        <button key={cat.id} onClick={() => setFilterCategory(filterCategory === cat.id ? '' : cat.id)}
                            className={`cat-chip ${filterCategory === cat.id ? 'active' : ''}`}
                            style={{ '--chip-color': cat.color } as any}>
                            {cat.icon} {cat.name} ({count})
                        </button>
                    );
                })}
            </div>

            <div className="toolbar glass" style={{ padding: '1.2rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Buscar artículos, etiquetas o contenido..." className="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* Articles Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
                {filtered.map(art => {
                    const cat = getCat(art.category);
                    return (
                        <div key={art.id} className="card glass article-card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => openView(art)}>
                            {art.pinned && (
                                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                    <Bookmark size={16} fill="var(--warning)" color="var(--warning)" />
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.8rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: `${cat.color}15`, color: cat.color }}>
                                    {cat.icon} {cat.name}
                                </span>
                            </div>
                            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>{art.title}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {art.content.replace(/[#*`\n]/g, ' ').substring(0, 120)}...
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                                {art.tags.map(tag => (
                                    <span key={tag} style={{ fontSize: '0.6rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.08)', color: 'var(--primary)' }}>
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--surface-border)', paddingTop: '0.6rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> {art.views}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={12} /> {art.helpful}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {art.updatedAt}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p>No se encontraron artículos.</p>
                </div>
            )}

            {/* View Article Modal */}
            {isViewOpen && activeArticle && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ width: '700px' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: `${getCat(activeArticle.category).color}15`, color: getCat(activeArticle.category).color, marginBottom: '0.5rem', display: 'inline-block' }}>
                                    {getCat(activeArticle.category).icon} {getCat(activeArticle.category).name}
                                </span>
                                <h2 style={{ fontSize: '1.4rem', marginTop: '0.5rem' }}>{activeArticle.title}</h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                                    Por {activeArticle.author} · Actualizado: {activeArticle.updatedAt} · 👁️ {activeArticle.views + 1} vistas
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <button className="icon-btn" onClick={() => { setIsViewOpen(false); openEdit(activeArticle); }}><Edit2 size={18} /></button>
                                <button onClick={() => setIsViewOpen(false)}><X size={24} /></button>
                            </div>
                        </header>
                        <div className="article-content" style={{ background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '8px', minHeight: '200px', marginBottom: '1.5rem', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.95rem' }}>
                            {activeArticle.content}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            {activeArticle.tags.map(tag => (
                                <span key={tag} style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.08)', color: 'var(--primary)' }}>#{tag}</span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--surface-border)' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>¿Fue útil este artículo?</span>
                            <button className="btn glass" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }} onClick={() => vote(activeArticle.id, 'helpful')}>
                                <ThumbsUp size={14} /> Sí ({activeArticle.helpful})
                            </button>
                            <button className="btn glass" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }} onClick={() => vote(activeArticle.id, 'notHelpful')}>
                                <ThumbsDown size={14} /> No ({activeArticle.notHelpful})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ width: '600px' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2>{activeArticle ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </header>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-group">
                                <label>Título del Artículo</label>
                                <input type="text" className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ej: Cómo reiniciar el servicio de red..." required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Categoría</label>
                                    <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Autor</label>
                                    <input type="text" className="form-input" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} placeholder="Nombre del autor" required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Etiquetas (separadas por coma)</label>
                                <input type="text" className="form-input" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="Ej: windows, contraseña, acceso" />
                            </div>
                            <div className="form-group">
                                <label>Contenido (soporta Markdown)</label>
                                <textarea className="form-input" rows={10} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="Escriba la solución o guía técnica..." required style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                            </div>
                            <button type="submit" className="btn btn-primary"><Save size={20} /> {activeArticle ? 'Actualizar' : 'Publicar'} Artículo</button>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .search-input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.5rem; border-radius: var(--radius-sm); border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); outline: none; font-family: inherit; }
                .cat-chip { padding: 0.4rem 0.8rem; font-size: 0.75rem; font-weight: 600; border-radius: 20px; border: 1px solid var(--surface-border); background: var(--surface); cursor: pointer; transition: 0.2s; color: var(--text-muted); }
                .cat-chip:hover { border-color: var(--primary); color: var(--primary); }
                .cat-chip.active { background: var(--primary); color: white; border-color: var(--primary); }
                .article-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
                .icon-btn { padding: 0.4rem; border-radius: 6px; color: var(--text-muted); cursor: pointer; }
                .icon-btn:hover { background: rgba(0,0,0,0.05); color: var(--primary); }
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
                .modal-content { background: var(--surface); padding: 2.5rem; border-radius: var(--radius-lg); box-shadow: 0 20px 50px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
                .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--text-muted); }
                .form-input { width: 100%; padding: 0.7rem; border-radius: 8px; border: 1px solid var(--surface-border); background: var(--surface); color: var(--text-main); font-family: inherit; }
                .fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
