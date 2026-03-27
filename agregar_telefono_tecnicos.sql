-- Ejecuta este comando en el editor SQL de tu panel de control de Supabase.
-- Sirve para agregar la columna del número de teléfono de contacto al personal técnico.

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS phone TEXT;
