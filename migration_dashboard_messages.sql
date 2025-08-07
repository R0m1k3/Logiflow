-- Migration: Add dashboard_messages table for production
-- Date: August 2025
-- Description: Adds the dashboard messages system for internal store communications

-- Create dashboard_messages table
CREATE TABLE IF NOT EXISTS dashboard_messages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    store_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    created_by VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for dashboard_messages
CREATE INDEX IF NOT EXISTS idx_dashboard_messages_store_id ON dashboard_messages(store_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_messages_created_by ON dashboard_messages(created_by);
CREATE INDEX IF NOT EXISTS idx_dashboard_messages_created_at ON dashboard_messages(created_at DESC);

-- Add constraint for message type
ALTER TABLE dashboard_messages DROP CONSTRAINT IF EXISTS chk_dashboard_message_type;
ALTER TABLE dashboard_messages ADD CONSTRAINT chk_dashboard_message_type 
    CHECK (type IN ('info', 'warning', 'success', 'error'));

-- Success message
SELECT 'Dashboard messages table created successfully!' as result;