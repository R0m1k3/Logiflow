-- Migration script for production environment
-- This script ensures all tables and constraints are properly configured

-- Ensure correct database encoding
ALTER DATABASE logiflow_db SET timezone TO 'UTC';

-- Fix any permission issues that might cause connectivity problems
GRANT ALL PRIVILEGES ON DATABASE logiflow_db TO logiflow_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO logiflow_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO logiflow_admin;

-- Ensure connection limits are appropriate
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '128MB';

-- Refresh configuration
SELECT pg_reload_conf();

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Production migration completed successfully at %', NOW();
END $$;