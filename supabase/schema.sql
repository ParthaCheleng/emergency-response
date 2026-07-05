-- ============================================================
-- Emergency Response Commander AI
-- Supabase PostgreSQL Schema Migration
-- ============================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core crisis sessions table
CREATE TABLE IF NOT EXISTS crisis_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status          VARCHAR(20) NOT NULL DEFAULT 'IDLE',
    emergency_level VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    timeline        JSONB NOT NULL DEFAULT '[]'::jsonb,
    agent_chatter   JSONB NOT NULL DEFAULT '[]'::jsonb,
    action_plan     JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_updated    TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Enforce valid status values
    CONSTRAINT chk_status CHECK (status IN ('IDLE', 'PROCESSING', 'COMPLETE', 'ERROR')),
    -- Enforce valid emergency levels
    CONSTRAINT chk_emergency_level CHECK (emergency_level IN (
        'UNKNOWN', 'ADVISORY', 'WATCH', 'WARNING', 'CRITICAL', 'CATASTROPHIC'
    ))
);

-- Index for fast session lookups by recency
CREATE INDEX IF NOT EXISTS idx_crisis_sessions_updated
    ON crisis_sessions(last_updated DESC);

-- Index for filtering active/processing sessions
CREATE INDEX IF NOT EXISTS idx_crisis_sessions_status
    ON crisis_sessions(status);

-- Enable Realtime publication for this table
-- NOTE: You must ALSO enable Realtime in the Supabase Dashboard:
--   Database → Replication → Toggle ON for crisis_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE crisis_sessions;

-- Row Level Security (RLS)
-- Enable RLS on the table
ALTER TABLE crisis_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads (for the frontend realtime listener)
CREATE POLICY "Allow anonymous read access"
    ON crisis_sessions
    FOR SELECT
    TO anon
    USING (true);

-- Allow anonymous inserts (for session creation from frontend)
CREATE POLICY "Allow anonymous insert access"
    ON crisis_sessions
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow service role full access (for the backend)
CREATE POLICY "Allow service role full access"
    ON crisis_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
