-- Add ticket_id column to service_reports if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_reports' AND column_name='ticket_id') THEN
        ALTER TABLE service_reports ADD COLUMN ticket_id TEXT;
    END IF;
END $$;
