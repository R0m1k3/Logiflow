-- Migration: Add SAV (Service Après-Vente) tables
-- Created: 2025-08-08
-- Description: Creates tables for SAV ticket management system

-- Create SAV tickets table
CREATE TABLE IF NOT EXISTS sav_tickets (
  id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  product_gencode VARCHAR(255) NOT NULL,
  product_reference VARCHAR(255),
  product_designation VARCHAR(500) NOT NULL,
  problem_type VARCHAR(100) NOT NULL,
  problem_description TEXT NOT NULL,
  resolution_description TEXT,
  status VARCHAR(50) DEFAULT 'nouveau' NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP
);

-- Create SAV ticket history table
CREATE TABLE IF NOT EXISTS sav_ticket_history (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES sav_tickets(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sav_tickets_group_id ON sav_tickets(group_id);
CREATE INDEX IF NOT EXISTS idx_sav_tickets_supplier_id ON sav_tickets(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sav_tickets_status ON sav_tickets(status);
CREATE INDEX IF NOT EXISTS idx_sav_tickets_created_at ON sav_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_sav_tickets_ticket_number ON sav_tickets(ticket_number);

CREATE INDEX IF NOT EXISTS idx_sav_ticket_history_ticket_id ON sav_ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sav_ticket_history_created_at ON sav_ticket_history(created_at);

-- Add constraints
ALTER TABLE sav_tickets 
ADD CONSTRAINT chk_sav_tickets_status 
CHECK (status IN ('nouveau', 'en_cours', 'resolu', 'ferme'));

ALTER TABLE sav_ticket_history 
ADD CONSTRAINT chk_sav_history_action 
CHECK (action IN ('created', 'updated', 'status_changed', 'resolved', 'closed'));

-- Insert comments for documentation
COMMENT ON TABLE sav_tickets IS 'SAV (Service Après-Vente) tickets for managing customer service issues with suppliers';
COMMENT ON TABLE sav_ticket_history IS 'History log of changes made to SAV tickets';

COMMENT ON COLUMN sav_tickets.ticket_number IS 'Auto-generated unique ticket identifier (format: SAV20250808-001)';
COMMENT ON COLUMN sav_tickets.problem_type IS 'Type of problem: defaut_produit, erreur_livraison, produit_manquant, quantite_incorrecte, emballage_endommage, autre';
COMMENT ON COLUMN sav_tickets.status IS 'Ticket status: nouveau, en_cours, resolu, ferme';
COMMENT ON COLUMN sav_tickets.created_by IS 'ID of the user who created the ticket';
COMMENT ON COLUMN sav_tickets.resolved_at IS 'Timestamp when ticket was marked as resolved';
COMMENT ON COLUMN sav_tickets.closed_at IS 'Timestamp when ticket was closed';

COMMENT ON COLUMN sav_ticket_history.action IS 'Type of action: created, updated, status_changed, resolved, closed';
COMMENT ON COLUMN sav_ticket_history.description IS 'Description of the change made';
COMMENT ON COLUMN sav_ticket_history.created_by IS 'ID of the user who made the change';