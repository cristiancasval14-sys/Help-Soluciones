-- Ejecuta este comando en el editor SQL de Supabase
-- Esto permitirá que cuandos borres un Ticket, todo su historial de reportes asociados se borre sin bloquear el sistema.

ALTER TABLE public.service_reports 
DROP CONSTRAINT IF EXISTS service_reports_ticket_id_fkey,
ADD CONSTRAINT service_reports_ticket_id_fkey 
FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;
