-- Add evidence_photo column to service_reports if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_reports' AND column_name='evidence_photo') THEN
        ALTER TABLE service_reports ADD COLUMN evidence_photo TEXT;
    END IF;
END $$;
