-- SQL script to create SAV tables in production database
-- Run this if tables don't exist

-- Create SAV tickets table
CREATE TABLE IF NOT EXISTS sav_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL,
    product_gencode VARCHAR(50),
    product_reference VARCHAR(100),
    product_designation TEXT NOT NULL,
    problem_type VARCHAR(50) NOT NULL,
    problem_description TEXT NOT NULL,
    resolution_description TEXT,
    status VARCHAR(20) DEFAULT 'nouveau',
    group_id INTEGER NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create SAV ticket history table
CREATE TABLE IF NOT EXISTS sav_ticket_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES sav_tickets(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sav_tickets_group ON sav_tickets(group_id);
CREATE INDEX IF NOT EXISTS idx_sav_tickets_supplier ON sav_tickets(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sav_tickets_status ON sav_tickets(status);
CREATE INDEX IF NOT EXISTS idx_sav_tickets_created ON sav_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_sav_history_ticket ON sav_ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sav_history_created ON sav_ticket_history(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sav_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_sav_tickets_updated_at
    BEFORE UPDATE ON sav_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_sav_tickets_updated_at();

-- Insert some sample data for testing (optional)
INSERT INTO sav_tickets (
    ticket_number, supplier_id, product_gencode, product_reference, 
    product_designation, problem_type, problem_description, 
    status, group_id, created_by
) VALUES (
    'SAV20250808-001', 1, '1234567890123', 'REF-001',
    'Produit de test', 'defaut_produit', 'Description du problème de test',
    'nouveau', 1, 'admin'
) ON CONFLICT (ticket_number) DO NOTHING;

-- Verify tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('sav_tickets', 'sav_ticket_history')
ORDER BY table_name;