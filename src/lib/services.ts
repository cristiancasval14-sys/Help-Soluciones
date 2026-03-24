import { supabase, Ticket as DBTicket, Company as DBCompany, Staff as DBStaff } from './supabase';

export const TicketService = {
    async getAll() {
        const { data, error } = await supabase
            .from('tickets')
            .select('*, company:companies(*), staff:staff(*)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("TicketService.getAll error:", error);
            throw error;
        }
        return data || [];
    },

    async updateStatus(id: string, status: string, notes: string) {
        const { data, error } = await supabase
            .from('tickets')
            .update({ status, tech_notes: notes })
            .eq('id', id)
            .select();
        if (error) throw error;
        return data;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('tickets')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async create(ticket: any) {
        const { data, error } = await supabase
            .from('tickets')
            .insert([ticket])
            .select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async delete(id: string) {
        const { error } = await supabase.from('tickets').delete().eq('id', id);
        if (error) throw error;
    }
};

export const CompanyService = {
    async getAll() {
        const { data, error } = await supabase
            .from('companies')
            .select('*, employees:company_employees(*), sedes:company_sedes(*)');
        if (error) {
            console.error("CompanyService.getAll error:", error);
            throw error;
        }
        return data || [];
    },

    async create(company: any) {
        // Sanitize coordinate values
        if (company.lat === '') company.lat = null;
        if (company.lng === '') company.lng = null;

        const { data, error } = await supabase.from('companies').insert([company]).select();
        if (error) {
            console.error("CompanyService.create error:", error);
            throw error;
        }
        return data ? data[0] : null;
    },

    async update(id: string, updates: any) {
        if (updates.lat === '') updates.lat = null;
        if (updates.lng === '') updates.lng = null;

        const { data, error } = await supabase.from('companies').update(updates).eq('id', id).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async delete(id: string) {
        const { error } = await supabase.from('companies').delete().eq('id', id);
        if (error) throw error;
    },

    async addEmployee(employee: any) {
        const { data, error } = await supabase.from('company_employees').insert([employee]).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async deleteEmployee(id: string) {
        const { error } = await supabase.from('company_employees').delete().eq('id', id);
        if (error) throw error;
    },

    async addSede(sede: any) {
        if (sede.lat === '') sede.lat = null;
        if (sede.lng === '') sede.lng = null;

        const { data, error } = await supabase.from('company_sedes').insert([sede]).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async deleteSede(id: string) {
        const { error } = await supabase.from('company_sedes').delete().eq('id', id);
        if (error) throw error;
    }
};


export const InventoryService = {
    async getAll() {
        const { data, error } = await supabase.from('inventory').select('*, company:companies(name)');
        if (error) throw error;
        return data || [];
    },

    async create(asset: any) {
        const { data, error } = await supabase.from('inventory').insert([asset]).select();
        if (error) {
            console.error("InventoryService.create error:", error);
            throw error;
        }
        return data ? data[0] : null;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('inventory').update(updates).eq('id', id).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async delete(id: string) {
        const { error } = await supabase.from('inventory').delete().eq('id', id);
        if (error) throw error;
    }
};


export const StaffService = {
    async getAll() {
        const { data, error } = await supabase.from('staff').select('*');
        if (error) throw error;
        return data || [];
    },

    async create(staff: any) {
        const { data, error } = await supabase.from('staff').insert([staff]).select();
        if (error) {
            console.error("StaffService.create error:", error);
            throw error;
        }
        return data ? data[0] : null;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('staff').update(updates).eq('id', id).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async delete(id: string) {
        const { error } = await supabase.from('staff').delete().eq('id', id);
        if (error) throw error;
    }
};


export const KnowledgeBaseService = {
    async getAll() {
        const { data, error } = await supabase
            .from('knowledge_base')
            .select('*')
            .order('pinned', { ascending: false })
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async create(article: any) {
        const { data, error } = await supabase.from('knowledge_base').insert([article]).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('knowledge_base').update(updates).eq('id', id).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async delete(id: string) {
        const { error } = await supabase.from('knowledge_base').delete().eq('id', id);
        if (error) throw error;
    }
};


export const ServiceReportService = {
    async getAll() {
        const { data, error } = await supabase
            .from('service_reports')
            .select('*, company:companies(name), technician:staff(first_name, last_name)');
        if (error) throw error;
        return data || [];
    },

    async create(report: any) {
        const { data, error } = await supabase.from('service_reports').insert([report]).select();
        if (error) throw error;
        return data ? data[0] : null;
    }
};


export const UserService = {
    async getAll() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
            console.error("UserService.getAll error:", error);
            throw error;
        }
        return data || [];
    },

    async create(user: any) {
        if (!supabase) throw new Error("Supabase is missing");

        const { data, error } = await supabase.from('profiles').insert([user]).select();
        if (error) {
            console.error("UserService.create error:", error);
            throw error;
        }
        return data ? data[0] : null;
    },

    async update(id: string, updates: any) {
        if (!supabase) throw new Error("Supabase is missing");
        const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async delete(id: string) {
        if (!supabase) return;
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
    },

    async login(username: string, password: string) {
        if (!supabase) return null;
        const { data, error } = await supabase.from('profiles')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error) {
            console.error("UserService.login error:", error);
        }

        if (!error && data) return data;

        // Emergency backdoor so user is never fully locked out
        if (username.toLowerCase() === 'admin' && password === '123') {
            return { id: 'emergency-1', username: 'admin', role: 'Administrador', assigned_to: 'Admin Central', type: 'Personal', status: 'Activo', allowed_modules: ['Dashboard', 'Tickets', 'Clientes', 'Inventario', 'Staff', 'Usuarios', 'Reportes'] };
        }
        return null;
    }
};


export const PasswordRequestService = {
    async create(username: string) {
        const { data, error } = await supabase.from('password_requests').insert([{ username }]).select();
        if (error) throw error;
        return data ? data[0] : null;
    },
    async getAll() {
        const { data, error } = await supabase.from('password_requests').select('*');
        if (error) throw error;
        return data || [];
    },
    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('password_requests').update(updates).eq('id', id).select();
        if (error) throw error;
        return data ? data[0] : null;
    },
    async delete(id: string) {
        const { error } = await supabase.from('password_requests').delete().eq('id', id);
        if (error) throw error;
    }
};


export const VisitService = {
    async getAll() {
        const { data, error } = await supabase.from('visits').select('*, staff:staff(*), company:companies(*), sede:company_sedes(*)');
        if (error) throw error;
        return data || [];
    },
    async create(visit: any) {
        const { data, error } = await supabase.from('visits').insert([visit]).select();
        if (error) throw error;
        return data ? data[0] : null;
    },
    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('visits').update(updates).eq('id', id).select();
        if (error) throw error;
        return data ? data[0] : null;
    },
    async delete(id: string) {
        const { error } = await supabase.from('visits').delete().eq('id', id);
        if (error) throw error;
    }
};
