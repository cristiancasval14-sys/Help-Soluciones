import { supabase, Ticket as DBTicket, Company as DBCompany, Staff as DBStaff } from './supabase';

// Helper for LocalStorage
const getLocal = (key: string) => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

const saveLocal = (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
};

const KEYS = {
    USERS: 'help_soluciones_users',
    CLIENTS: 'help_soluciones_clients',
    TICKETS: 'help_soluciones_tickets',
    INVENTORY: 'help_soluciones_inventory',
    STAFF: 'help_soluciones_staff',
    KNOWLEDGE: 'help_soluciones_knowledge',
    REPORTS: 'help_soluciones_reports',
    VISITS: 'help_soluciones_visits',
    PASSWORD_REQUESTS: 'help_password_requests'
};

export const TicketService = {
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*, company:companies(*), staff:staff(*)')
                .order('created_at', { ascending: false });

            if (!error && data ) return data;
        } catch (e) { console.warn("TicketService.getAll fallback"); }

        // Fallback
        const local = getLocal(KEYS.TICKETS);
        // Map local format to DB format if needed
        return local.map((t: any) => ({
            ...t,
            company: t.company || { name: t.client },
            staff: t.staff || (t.assignedTo ? { first_name: t.assignedTo.split(' ')[0], last_name: t.assignedTo.split(' ')[1] || '' } : null)
        }));
    },

    async updateStatus(id: string, status: string, notes: string) {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .update({ status, tech_notes: notes })
                .eq('id', id)
                .select();
            if (!error) return data;
        } catch (e) { }

        // Local Sync
        const local = getLocal(KEYS.TICKETS);
        const idx = local.findIndex((t: any) => t.id === id);
        if (idx !== -1) {
            local[idx] = { ...local[idx], status, tech_notes: notes };
            saveLocal(KEYS.TICKETS, local);
        }
    },

    async update(id: string, updates: any) {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .update(updates)
                .eq('id', id)
                .select();
            if (!error && data) return data[0];
        } catch (e) { }

        const local = getLocal(KEYS.TICKETS);
        const idx = local.findIndex((t: any) => t.id === id);
        if (idx !== -1) {
            local[idx] = { ...local[idx], ...updates };
            saveLocal(KEYS.TICKETS, local);
            return local[idx];
        }
    },

    async create(ticket: any) {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .insert([ticket])
                .select();
            if (!error && data) return data[0];
        } catch (e) { }

        const local = getLocal(KEYS.TICKETS);
        const newTicket = {
            ...ticket,
            id: ticket.id || `TICK-${Math.floor(Math.random() * 9000) + 1000}`,
            created_at: new Date().toISOString()
        };
        local.push(newTicket);
        saveLocal(KEYS.TICKETS, local);
        return newTicket;
    },

    async delete(id: string) {
        try {
            await supabase.from('tickets').delete().eq('id', id);
        } catch (e) { }
        const local = getLocal(KEYS.TICKETS);
        saveLocal(KEYS.TICKETS, local.filter((t: any) => t.id !== id));
    }
};

export const CompanyService = {
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*, employees:company_employees(*), sedes:company_sedes(*)');
            if (!error && data ) return data;
        } catch (e) { }
        return getLocal(KEYS.CLIENTS);
    },

    async create(company: any) {
        try {
            const { data, error } = await supabase.from('companies').insert([company]).select();
            if (!error && data) return data[0];
        } catch (e) { }
        const local = getLocal(KEYS.CLIENTS);
        const newComp = { ...company, id: `co-${Date.now()}` };
        local.push(newComp);
        saveLocal(KEYS.CLIENTS, local);
        return newComp;
    },

    async update(id: string, updates: any) {
        try {
            const { data, error } = await supabase.from('companies').update(updates).eq('id', id).select();
            if (!error && data) return data[0];
        } catch (e) { }
        const local = getLocal(KEYS.CLIENTS);
        const idx = local.findIndex((c: any) => c.id === id);
        if (idx !== -1) {
            local[idx] = { ...local[idx], ...updates };
            saveLocal(KEYS.CLIENTS, local);
            return local[idx];
        }
    },

    async delete(id: string) {
        try { await supabase.from('companies').delete().eq('id', id); } catch (e) { }
        const local = getLocal(KEYS.CLIENTS);
        saveLocal(KEYS.CLIENTS, local.filter((c: any) => c.id !== id));
    },

    async addEmployee(employee: any) {
        try {
            const { data, error } = await supabase.from('company_employees').insert([employee]).select();
            if (!error && data) return data[0];
        } catch (e) { }
        // For local simulation, we'd need to find the company, but for simplicity:
        return { ...employee, id: `emp-${Date.now()}` };
    },

    async deleteEmployee(id: string) {
        try { await supabase.from('company_employees').delete().eq('id', id); } catch (e) { }
    },

    async addSede(sede: any) {
        try {
            const { data, error } = await supabase.from('company_sedes').insert([sede]).select();
            if (!error && data) return data[0];
        } catch (e) { }
        return { ...sede, id: `sede-${Date.now()}` };
    },

    async deleteSede(id: string) {
        try { await supabase.from('company_sedes').delete().eq('id', id); } catch (e) { }
    }
};


export const InventoryService = {
    async getAll() {
        try {
            const { data, error } = await supabase.from('inventory').select('*, company:companies(name)');
            if (!error && data ) return data;
        } catch (e) { }
        return getLocal(KEYS.INVENTORY);
    },

    async create(asset: any) {
        try {
            const { data, error } = await supabase.from('inventory').insert([asset]).select();
            if (!error && data) return data[0];
        } catch (e) { }
        const local = getLocal(KEYS.INVENTORY);
        const newItem = { ...asset, id: `inv-${Date.now()}`, uuid: `inv-${Date.now()}` };
        local.push(newItem);
        saveLocal(KEYS.INVENTORY, local);
        return newItem;
    },

    async update(id: string, updates: any) {
        try {
            const { data, error } = await supabase.from('inventory').update(updates).eq('id', id).select();
            if (!error && data) return data[0];
        } catch (e) { }
        const local = getLocal(KEYS.INVENTORY);
        const idx = local.findIndex((i: any) => i.id === id || i.uuid === id);
        if (idx !== -1) {
            local[idx] = { ...local[idx], ...updates };
            saveLocal(KEYS.INVENTORY, local);
            return local[idx];
        }
    },

    async delete(id: string) {
        try { await supabase.from('inventory').delete().eq('id', id); } catch (e) { }
        const local = getLocal(KEYS.INVENTORY);
        saveLocal(KEYS.INVENTORY, local.filter((i: any) => i.id !== id && i.uuid !== id));
    }
};

export const StaffService = {
    async getAll() {
        try {
            const { data, error } = await supabase.from('staff').select('*');
            if (!error && data ) return data;
        } catch (e) { }
        return getLocal(KEYS.STAFF);
    },

    async create(staff: any) {
        try {
            const { data, error } = await supabase.from('staff').insert([staff]).select();
            if (!error && data) return data[0];
        } catch (e) { }
        const local = getLocal(KEYS.STAFF);
        const newItem = { ...staff, id: `staff-${Date.now()}` };
        local.push(newItem);
        saveLocal(KEYS.STAFF, local);
        return newItem;
    },

    async update(id: string, updates: any) {
        try {
            const { data, error } = await supabase.from('staff').update(updates).eq('id', id).select();
            if (!error && data) return data[0];
        } catch (e) { }
        const local = getLocal(KEYS.STAFF);
        const idx = local.findIndex((s: any) => s.id === id);
        if (idx !== -1) {
            local[idx] = { ...local[idx], ...updates };
            saveLocal(KEYS.STAFF, local);
            return local[idx];
        }
    },

    async delete(id: string) {
        try { await supabase.from('staff').delete().eq('id', id); } catch (e) { }
        const local = getLocal(KEYS.STAFF);
        saveLocal(KEYS.STAFF, local.filter((s: any) => s.id !== id));
    }
};

export const KnowledgeBaseService = {
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('knowledge_base')
                .select('*')
                .order('pinned', { ascending: false })
                .order('created_at', { ascending: false });
            if (!error && data ) return data;
        } catch (e) { }
        return getLocal(KEYS.KNOWLEDGE);
    },

    async create(article: any) {
        try {
            const { data, error } = await supabase.from('knowledge_base').insert([article]).select();
            if (!error && data) return data[0];
        } catch (e) { }
        const local = getLocal(KEYS.KNOWLEDGE);
        const newItem = { ...article, id: `kb-${Date.now()}` };
        local.push(newItem);
        saveLocal(KEYS.KNOWLEDGE, local);
        return newItem;
    },

    async update(id: string, updates: any) {
        try {
            const { data, error } = await supabase.from('knowledge_base').update(updates).eq('id', id).select();
            if (!error && data) return data[0];
        } catch (e) { }
        const local = getLocal(KEYS.KNOWLEDGE);
        const idx = local.findIndex((k: any) => k.id === id);
        if (idx !== -1) {
            local[idx] = { ...local[idx], ...updates };
            saveLocal(KEYS.KNOWLEDGE, local);
            return local[idx];
        }
    },

    async delete(id: string) {
        try { await supabase.from('knowledge_base').delete().eq('id', id); } catch (e) { }
        const local = getLocal(KEYS.KNOWLEDGE);
        saveLocal(KEYS.KNOWLEDGE, local.filter((k: any) => k.id !== id));
    }
};

export const ServiceReportService = {
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('service_reports')
                .select('*, company:companies(name), technician:staff(first_name, last_name)');
            if (!error && data ) return data;
        } catch (e) { }
        return getLocal(KEYS.REPORTS);
    },

    async create(report: any) {
        try {
            const { data, error } = await supabase.from('service_reports').insert([report]).select();
            if (!error && data) return data[0];
        } catch (e) { }
        const local = getLocal(KEYS.REPORTS);
        const newItem = { ...report, id: `rep-${Date.now()}` };
        local.push(newItem);
        saveLocal(KEYS.REPORTS, local);
        return newItem;
    }
};

export const UserService = {
    async getAll() {
        try {
            if (supabase) {
                const { data, error } = await supabase.from('profiles').select('*');
                if (!error && data ) return data;
            }
        } catch (e) { }
        return getLocal(KEYS.USERS);
    },

    async create(user: any) {
        try {
            if (supabase) {
                const { data, error } = await supabase.from('profiles').insert([user]).select();
                if (!error && data) return data[0];
            }
        } catch (e) { }
        const local = getLocal(KEYS.USERS);
        const newUser = { ...user, id: `u-${Date.now()}` };
        local.push(newUser);
        saveLocal(KEYS.USERS, local);
        return newUser;
    },

    async update(id: string, updates: any) {
        try {
            if (supabase) {
                const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select();
                if (!error && data) return data[0];
            }
        } catch (e) { }
        const local = getLocal(KEYS.USERS);
        const idx = local.findIndex((u: any) => u.id === id);
        if (idx !== -1) {
            local[idx] = { ...local[idx], ...updates };
            saveLocal(KEYS.USERS, local);
            return local[idx];
        }
    },

    async delete(id: string) {
        try { if (supabase) await supabase.from('profiles').delete().eq('id', id); } catch (e) { }
        const local = getLocal(KEYS.USERS);
        saveLocal(KEYS.USERS, local.filter((u: any) => u.id !== id));
    },

    async login(username: string, password: string) {
        try {
            if (supabase) {
                const { data, error } = await supabase.from('profiles').select('*').eq('username', username).eq('password', password).single();
                if (!error && data) return data;
            }
        } catch (e) { }

        const local = getLocal(KEYS.USERS);
        const user = local.find((u: any) => u.username?.toLowerCase() === username?.toLowerCase() && u.password === password);
        if (user) return { ...user, id: user.id || '1', username: user.username, role: user.role || 'Administrador', assigned_to: user.assignedTo || 'Admin Central', allowed_modules: user.allowedModules || [] };

        if (username.toLowerCase() === 'admin' && password === '123') {
            return { id: 'emergency-1', username: 'admin', role: 'Administrador', assigned_to: 'Admin Central', type: 'Personal', status: 'Activo', allowed_modules: ['Dashboard', 'Tickets', 'Clientes', 'Inventario', 'Staff', 'Usuarios', 'Reportes'] };
        }
        return null;
    }
};

export const PasswordRequestService = {
    async create(username: string) {
        try {
            const { data, error } = await supabase.from('password_requests').insert([{ username }]).select();
            if (!error && data) return data[0];
        } catch (e) { }
        const local = getLocal(KEYS.PASSWORD_REQUESTS);
        const newReq = { id: `pr-${Date.now()}`, username, status: 'Pendiente', created_at: new Date().toISOString() };
        local.push(newReq);
        saveLocal(KEYS.PASSWORD_REQUESTS, local);
        return newReq;
    },
    async getAll() {
        try {
            const { data, error } = await supabase.from('password_requests').select('*');
            if (!error && data ) return data;
        } catch (e) { }
        return getLocal(KEYS.PASSWORD_REQUESTS);
    },
    async update(id: string, updates: any) {
        try {
            const { data, error } = await supabase.from('password_requests').update(updates).eq('id', id).select();
            if (!error && data) return data[0];
        } catch (e) { }
        const local = getLocal(KEYS.PASSWORD_REQUESTS);
        const idx = local.findIndex((r: any) => r.id === id);
        if (idx !== -1) {
            local[idx] = { ...local[idx], ...updates };
            saveLocal(KEYS.PASSWORD_REQUESTS, local);
            return local[idx];
        }
    },
    async delete(id: string) {
        try { await supabase.from('password_requests').delete().eq('id', id); } catch (e) { }
        const local = getLocal(KEYS.PASSWORD_REQUESTS);
        saveLocal(KEYS.PASSWORD_REQUESTS, local.filter((r: any) => r.id !== id));
    }
};

export const VisitService = {
    async getAll() {
        try {
            const { data, error } = await supabase.from('visits').select('*, staff:staff(*), company:companies(*), sede:company_sedes(*)');
            if (!error && data ) return data;
        } catch (e) { }
        return getLocal(KEYS.VISITS);
    },
    async create(visit: any) {
        try {
            const { data, error } = await supabase.from('visits').insert([visit]).select();
            if (!error && data) return data[0];
        } catch (e) { }
        const local = getLocal(KEYS.VISITS);
        const newV = { ...visit, id: `v-${Date.now()}` };
        local.push(newV);
        saveLocal(KEYS.VISITS, local);
        return newV;
    },
    async update(id: string, updates: any) {
        try {
            const { data, error } = await supabase.from('visits').update(updates).eq('id', id).select();
            if (!error && data) return data[0];
        } catch (e) { }
        const local = getLocal(KEYS.VISITS);
        const idx = local.findIndex((v: any) => v.id === id);
        if (idx !== -1) {
            local[idx] = { ...local[idx], ...updates };
            saveLocal(KEYS.VISITS, local);
            return local[idx];
        }
    },
    async delete(id: string) {
        try { await supabase.from('visits').delete().eq('id', id); } catch (e) { }
        const local = getLocal(KEYS.VISITS);
        saveLocal(KEYS.VISITS, local.filter((v: any) => v.id !== id));
    }
};
