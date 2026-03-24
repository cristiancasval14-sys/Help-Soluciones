-- 1. Ve a tu panel de Supabase (app.supabase.com)
-- 2. Entra en el menú "SQL Editor" de la barra lateral izquierda
-- 3. Crea una "New query"
-- 4. Pega todo el siguiente código y presiona RUN:

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_sedes DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;

-- Esto deshabilitará temporalmente las barreras de seguridad (RLS) que están
-- bloqueando las consultas de la aplicación y de los usuarios que intentan loguearse.
