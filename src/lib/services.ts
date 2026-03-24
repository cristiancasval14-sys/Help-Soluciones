import { supabase, Ticket, Company, Staff } from './supabase';

export const TicketService = {
    async getAll() {
        const { data, error } = await supabase
            .from('tickets')
            .select('*, company:companies(*), staff:staff(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Ticket[];
    },

    async getByFilter(filter: { role: string; assignedTo: string }) {
        let query = supabase
            .from('tickets')
            .select('*, company:companies(*), staff:staff(*)');

        if (filter.role === 'Técnico') {
            // Note: in our schema assigned_staff_id is a UUID, but the filter might be using names.
            // We should ideally filter by UUID.
            // query = query.eq('assigned_staff_id', filter.assignedTo);
        } else if (filter.role === 'Cliente') {
            // query = query.eq('company_id', filter.assignedTo);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data as Ticket[];
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
        return data[0];
    },

    async create(ticket: Partial<Ticket>) {
        const { data, error } = await supabase
            .from('tickets')
            .insert([ticket])
            .select();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('tickets')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

export const CompanyService = {
    async getAll() {
        const { data, error } = await supabase
            .from('companies')
            .select('*, employees:company_employees(*), sedes:company_sedes(*)');

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Company>) {
        const { data, error } = await supabase
            .from('companies')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data;
    },

    async create(company: Partial<Company>) {
        const { data, error } = await supabase
            .from('companies')
            .insert([company])
            .select();
        if (error) throw error;
        return data[0];
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Employees
    async addEmployee(employee: any) {
        const { data, error } = await supabase
            .from('company_employees')
            .insert([employee])
            .select();
        if (error) throw error;
        return data[0];
    },

    async deleteEmployee(id: string) {
        const { error } = await supabase
            .from('company_employees')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Sedes
    async addSede(sede: any) {
        const { data, error } = await supabase
            .from('company_sedes')
            .insert([sede])
            .select();
        if (error) throw error;
        return data[0];
    },

    async deleteSede(id: string) {
        const { error } = await supabase
            .from('company_sedes')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};

export const InventoryService = {
    async getAll() {
        const { data, error } = await supabase
            .from('inventory')
            .select('*, company:companies(name)');
        if (error) throw error;
        return data;
    },

    async create(asset: any) {
        const { data, error } = await supabase
            .from('inventory')
            .insert([asset])
            .select();
        if (error) throw error;
        return data[0];
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('inventory')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};

export const StaffService = {
    async getAll() {
        const { data, error } = await supabase
            .from('staff')
            .select('*');
        if (error) throw error;
        return data as Staff[];
    },

    async create(staff: any) {
        const { data, error } = await supabase
            .from('staff')
            .insert([staff])
            .select();
        if (error) throw error;
        return data[0];
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('staff')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('staff')
            .delete()
            .eq('id', id);
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
        return data;
    },

    async create(article: any) {
        const { data, error } = await supabase
            .from('knowledge_base')
            .insert([article])
            .select();
        if (error) throw error;
        return data[0];
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('knowledge_base')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('knowledge_base')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};

export const ServiceReportService = {
    async getAll() {
        const { data, error } = await supabase
            .from('service_reports')
            .select('*, company:companies(name), technician:staff(first_name, last_name)');
        if (error) throw error;
        return data;
    },

    async create(report: any) {
        const { data, error } = await supabase
            .from('service_reports')
            .insert([report])
            .select();
        if (error) throw error;
        return data[0];
    }
};

export const UserService = {
    async getAll() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*');
        if (error) throw error;
        return data;
    },

    async create(user: any) {
        const { data, error } = await supabase
            .from('profiles')
            .insert([user])
            .select();
        if (error) throw error;
        return data[0];
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async login(username: string, password: string) {
        // 1. First try Supabase
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', username)
                    .eq('password', password)
                    .single();

                if (!error && data) {
                    console.log("Logged in via Supabase.");
                    return data;
                }
            }
        } catch (e) {
            console.warn("Supabase login error, attempting fallback...", e);
        }

        // 2. Fallback to LocalStorage (Mock Data)
        if (typeof window !== 'undefined') {
            const usersJson = localStorage.getItem('help_soluciones_users');
            if (usersJson) {
                const users = JSON.parse(usersJson);
                const localUser = users.find((u: any) =>
                    u.username?.toLowerCase() === username?.toLowerCase() &&
                    u.password === password
                );

                if (localUser) {
                    console.info("Logged in using local mock data fallback from localStorage.");
                    return {
                        id: localUser.id || '1',
                        username: localUser.username,
                        role: localUser.role || 'Administrador',
                        assigned_to: localUser.assignedTo || 'Admin Central',
                        type: localUser.type || 'Personal',
                        status: localUser.status || 'Activo',
                        allowed_modules: localUser.allowedModules || []
                    };
                }
            }
        }

        // 3. Absolute Hardcoded Fallback for Emergency Access
        if (username.toLowerCase() === 'admin' && password === '123') {
            console.info("Logged in via hardcoded emergency fallback.");
            return {
                id: 'emergency-1',
                username: 'admin',
                role: 'Administrador',
                assigned_to: 'Admin Central',
                type: 'Personal',
                status: 'Activo',
                allowed_modules: ['Dashboard', 'Tickets', 'Clientes', 'Inventario', 'Staff', 'Usuarios', 'Reportes']
            };
        }

        return null;
    }
};

export const PasswordRequestService = {
    async create(username: string) {
        const { data, error } = await supabase
            .from('password_requests')
            .insert([{ username }])
            .select();
        if (error) throw error;
        return data[0];
    },
    async getAll() {
        const { data, error } = await supabase
            .from('password_requests')
            .select('*');
        if (error) throw error;
        return data;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('password_requests')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('password_requests')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};

export const VisitService = {
    async getAll() {
        const { data, error } = await supabase
            .from('visits')
            .select('*, staff:staff(*), company:companies(*), sede:company_sedes(*)');
        if (error) throw error;
        return data;
    },

    async create(visit: any) {
        const { data, error } = await supabase
            .from('visits')
            .insert([visit])
            .select();
        if (error) throw error;
        return data[0];
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('visits')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('visits')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
