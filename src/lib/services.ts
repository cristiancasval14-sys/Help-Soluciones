import { supabase, Ticket as DBTicket, Company as DBCompany, Staff as DBStaff } from './supabase';


const sanitize = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    const clean = { ...obj };
    Object.keys(clean).forEach(k => {
        if (clean[k] === '') clean[k] = null;
    });
    return clean;
};

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
            .update(sanitize(updates))
            .eq('id', id)
            .select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async create(ticket: any) {
        const { data, error } = await supabase
            .from('tickets')
            .insert([sanitize(ticket)])
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

        const { data, error } = await supabase.from('companies').insert([sanitize(company)]).select();
        if (error) {
            console.error("CompanyService.create error:", error);
            throw error;
        }
        return data ? data[0] : null;
    },

    async update(id: string, updates: any) {
        if (updates.lat === '') updates.lat = null;
        if (updates.lng === '') updates.lng = null;

        const { data, error } = await supabase.from('companies').update(sanitize(updates)).eq('id', id).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async delete(id: string) {
        // First delete all dependent records across all modules
        await supabase.from('company_employees').delete().eq('company_id', id);
        await supabase.from('company_sedes').delete().eq('company_id', id);
        await supabase.from('tickets').delete().eq('company_id', id);
        await supabase.from('inventory').delete().eq('company_id', id);
        await supabase.from('service_reports').delete().eq('company_id', id);
        await supabase.from('visits').delete().eq('company_id', id);
        
        // Then delete the company
        const { error } = await supabase.from('companies').delete().eq('id', id);
        if (error) {
            console.error("Error deleting company:", error);
            throw error;
        }
    },

    async addEmployee(employee: any) {
        const { data, error } = await supabase.from('company_employees').insert([sanitize(employee)]).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async deleteEmployee(id: string) {
        const { error } = await supabase.from('company_employees').delete().eq('id', id);
        if (error) throw error;
    },

    async updateEmployee(id: string, updates: any) {
        const { data, error } = await supabase.from('company_employees').update(sanitize(updates)).eq('id', id).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async addSede(sede: any) {
        if (sede.lat === '') sede.lat = null;
        if (sede.lng === '') sede.lng = null;

        const { data, error } = await supabase.from('company_sedes').insert([sanitize(sede)]).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async updateSede(id: string, updates: any) {
        if (updates.lat === '') updates.lat = null;
        if (updates.lng === '') updates.lng = null;

        const { data, error } = await supabase.from('company_sedes').update(sanitize(updates)).eq('id', id).select();
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
        const { data, error } = await supabase.from('inventory').select('*, company:companies(name), employee:company_employees(name)');
        if (error) throw error;
        return data || [];
    },

    async create(asset: any) {
        const { data, error } = await supabase.from('inventory').insert([sanitize(asset)]).select();
        if (error) {
            console.error("InventoryService.create error:", error);
            throw error;
        }
        return data ? data[0] : null;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('inventory').update(sanitize(updates)).eq('id', id).select();
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
        const { data, error } = await supabase.from('staff').insert([sanitize(staff)]).select();
        if (error) {
            console.error("StaffService.create error:", error);
            throw error;
        }
        return data ? data[0] : null;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('staff').update(sanitize(updates)).eq('id', id).select();
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
        const { data, error } = await supabase.from('knowledge_base').insert([sanitize(article)]).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('knowledge_base').update(sanitize(updates)).eq('id', id).select();
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
            .select(`
                *,
                company:companies(id, name),
                employee:company_employees(id, name),
                sede:company_sedes(id, name),
                inventory:inventory(id, equipment_id, brand, model)
            `)
            .order('created_at', { ascending: false });
        if (error) {
            // Fallback: if joins fail, just get raw data
            console.warn('ServiceReportService join failed, falling back to select(*)', error);
            const { data: raw, error: rawError } = await supabase
                .from('service_reports')
                .select('*')
                .order('created_at', { ascending: false });
            if (rawError) throw rawError;
            return raw || [];
        }
        return data || [];
    },

    async create(report: any) {
        const { data, error } = await supabase.from('service_reports').insert([sanitize(report)]).select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async getNextId(companyId: string) {
        if (!companyId) return 1;
        const { data, error } = await supabase
            .from('service_reports')
            .select('report_id')
            .eq('company_id', companyId);
        
        if (error || !data || data.length === 0) return 1;

        const maxNum = data.reduce((max, r) => {
            // Ignorar los formatos antiguos que tenían prefijo (ej. REP-1698)
            // Solo considerar los nuevos reportes que son estrictamente numéricos (ej. "01", "02")
            if (r.report_id && /^\d+$/.test(r.report_id)) {
                const num = parseInt(r.report_id, 10);
                return num > max ? num : max;
            }
            return max;
        }, 0);

        return maxNum + 1;
    },

    async delete(id: string) {
        const { error } = await supabase.from('service_reports').delete().eq('id', id);
        if (error) throw error;
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

        const { data, error } = await supabase.from('profiles').insert([sanitize(user)]).select();
        if (error) {
            console.error("UserService.create error:", error);
            throw error;
        }
        return data ? data[0] : null;
    },

    async update(id: string, updates: any) {
        if (!supabase) throw new Error("Supabase is missing");
        const { data, error } = await supabase.from('profiles').update(sanitize(updates)).eq('id', id).select();
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
        const { data, error } = await supabase.from('password_requests').insert([sanitize({ username })]).select();
        if (error) throw error;
        return data ? data[0] : null;
    },
    async getAll() {
        const { data, error } = await supabase.from('password_requests').select('*');
        if (error) throw error;
        return data || [];
    },
    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('password_requests').update(sanitize(updates)).eq('id', id).select();
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
        const { data, error } = await supabase.from('visits').select('*, company:companies(*), sede:company_sedes(*)');
        if (error) throw error;
        return data || [];
    },
    async create(visit: any) {
        const { data, error } = await supabase.from('visits').insert([sanitize(visit)]).select();
        if (error) throw error;
        return data ? data[0] : null;
    },
    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('visits').update(sanitize(updates)).eq('id', id).select();
        if (error) throw error;
        return data ? data[0] : null;
    },
    async delete(id: string) {
        const { error } = await supabase.from('visits').delete().eq('id', id);
        if (error) throw error;
    }
};
