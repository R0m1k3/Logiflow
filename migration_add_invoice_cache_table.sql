-- Migration: Add invoice verification cache table for performance optimization
-- Date: 2025-07-28
-- Description: Creates cache table to optimize invoice verification queries on large databases

-- Create invoice verification cache table
CREATE TABLE IF NOT EXISTS invoice_verification_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    delivery_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    invoice_reference VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255),
    exists BOOLEAN NOT NULL,
    match_type VARCHAR(50) DEFAULT 'UNKNOWN',
    is_valid BOOLEAN DEFAULT TRUE,
    cache_hit BOOLEAN DEFAULT FALSE,
    api_call_time INTEGER DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_invoice_cache_key ON invoice_verification_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_invoice_cache_group_invoice ON invoice_verification_cache(group_id, invoice_reference);
CREATE INDEX IF NOT EXISTS idx_invoice_cache_expires_at ON invoice_verification_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_invoice_cache_delivery_id ON invoice_verification_cache(delivery_id);

-- Grant permissions (if needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON invoice_verification_cache TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE invoice_verification_cache_id_seq TO your_app_user;

-- Migration completed successfully
SELECT 'Invoice verification cache table and indexes created successfully' as status;