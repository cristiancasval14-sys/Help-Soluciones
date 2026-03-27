-- 1. Ve a tu panel de Supabase (app.supabase.com)
-- 2. Entra en el menú "SQL Editor" de la barra lateral izquierda
-- 3. Crea una "New query"
-- 4. Pega todo el siguiente código y presiona RUN:

-- IMPORTANTE: Este script habilita el borrado en cascada. 
-- Al eliminar una empresa, se borrarán automáticamente sus empleados, sedes, tickets, etc.

-- 1. Reparar FK de Empleados
ALTER TABLE public.company_employees 
DROP CONSTRAINT IF EXISTS company_employees_company_id_fkey,
ADD CONSTRAINT company_employees_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Reparar FK de Sedes
ALTER TABLE public.company_sedes 
DROP CONSTRAINT IF EXISTS company_sedes_company_id_fkey,
ADD CONSTRAINT company_sedes_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- 3. Reparar FK de Tickets
ALTER TABLE public.tickets 
DROP CONSTRAINT IF EXISTS tickets_company_id_fkey,
ADD CONSTRAINT tickets_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- 4. Reparar FK de Inventario
ALTER TABLE public.inventory 
DROP CONSTRAINT IF EXISTS inventory_company_id_fkey,
ADD CONSTRAINT inventory_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- 5. Reparar FK de Reportes de Servicio
ALTER TABLE public.service_reports 
DROP CONSTRAINT IF EXISTS service_reports_company_id_fkey,
ADD CONSTRAINT service_reports_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- 6. Reparar FK de Visitas
ALTER TABLE public.visits 
DROP CONSTRAINT IF EXISTS visits_company_id_fkey,
ADD CONSTRAINT visits_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- 7. Reparar FK de Sedes en Visitas (opcional si se borra la sede)
ALTER TABLE public.visits 
DROP CONSTRAINT IF EXISTS visits_sede_id_fkey,
ADD CONSTRAINT visits_sede_id_fkey 
FOREIGN KEY (sede_id) REFERENCES public.company_sedes(id) ON DELETE CASCADE;
