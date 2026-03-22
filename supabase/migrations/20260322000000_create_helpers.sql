-- Phase 0: Helper Functions
-- Define helper functions that will be used across migrations
-- These are stubs that get replaced with full implementations in later migrations

-- ============================================
-- IS_BLOCKED FUNCTION (STUB)
-- ============================================

-- Stub version that returns FALSE since blocks table doesn't exist yet
-- This will be replaced with the real implementation in the safety migration
CREATE OR REPLACE FUNCTION is_blocked(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Stub: No blocking implemented yet (blocks table created in Phase 6)
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_blocked TO authenticated;
GRANT EXECUTE ON FUNCTION is_blocked TO anon;
