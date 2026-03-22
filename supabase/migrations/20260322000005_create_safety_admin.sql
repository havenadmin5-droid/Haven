-- Phase 6: Safety & Admin Tables
-- Reports, Blocks, Audit Log, and supporting functions

-- ============================================================================
-- ENUMS (with IF NOT EXISTS workaround)
-- ============================================================================

-- Report reason types
DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM (
    'harassment',
    'spam',
    'inappropriate',
    'doxxing',
    'hate_speech',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Report status
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM (
    'pending',
    'reviewing',
    'resolved',
    'dismissed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Content types that can be reported
DO $$ BEGIN
  CREATE TYPE reportable_content_type AS ENUM (
    'post',
    'comment',
    'message',
    'profile',
    'event'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Admin action types for audit log
DO $$ BEGIN
  CREATE TYPE admin_action AS ENUM (
    'ban_user',
    'unban_user',
    'verify_user',
    'unverify_user',
    'resolve_report',
    'dismiss_report',
    'delete_content',
    'restore_content',
    'feature_event',
    'unfeature_event',
    'suspend_anonymous',
    'restore_anonymous',
    'delete_community',
    'warn_user'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Audit target types
DO $$ BEGIN
  CREATE TYPE audit_target_type AS ENUM (
    'user',
    'post',
    'comment',
    'event',
    'community',
    'report',
    'message',
    'job'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  -- Cannot block yourself
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_content_id UUID,
  reported_content_type reportable_content_type,
  reason report_reason NOT NULL,
  details TEXT CHECK (LENGTH(details) <= 500),
  status report_status NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  -- Must report either a user or content
  CONSTRAINT report_target CHECK (
    reported_user_id IS NOT NULL OR
    (reported_content_id IS NOT NULL AND reported_content_type IS NOT NULL)
  )
);

-- Audit log table (immutable - no UPDATE or DELETE)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action admin_action NOT NULL,
  target_type audit_target_type NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Blocks indexes
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON blocks(blocker_id);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status) WHERE status IN ('pending', 'reviewing');
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user A has blocked user B (or vice versa)
CREATE OR REPLACE FUNCTION is_blocked(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if a user is eligible for anonymous mode
CREATE OR REPLACE FUNCTION check_anonymous_eligibility(p_user_id UUID)
RETURNS TABLE (
  eligible BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_profile RECORD;
  v_account_age INTEGER;
  v_unresolved_reports INTEGER;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'User not found';
    RETURN;
  END IF;

  -- Calculate account age in days
  v_account_age := EXTRACT(DAY FROM (NOW() - v_profile.created_at));

  -- Check account age (14 days minimum)
  IF v_account_age < 14 THEN
    RETURN QUERY SELECT FALSE, 'Account must be at least 14 days old';
    RETURN;
  END IF;

  -- Check trust score (minimum 20)
  IF COALESCE(v_profile.trust_score, 0) < 20 THEN
    RETURN QUERY SELECT FALSE, 'Trust score must be at least 20';
    RETURN;
  END IF;

  -- Check if anonymous mode was suspended
  IF v_profile.anon_suspended = TRUE THEN
    RETURN QUERY SELECT FALSE, 'Anonymous mode has been suspended for this account';
    RETURN;
  END IF;

  -- Check for unresolved reports against this user
  SELECT COUNT(*) INTO v_unresolved_reports
  FROM reports
  WHERE reported_user_id = p_user_id
    AND status IN ('pending', 'reviewing');

  IF v_unresolved_reports > 0 THEN
    RETURN QUERY SELECT FALSE, 'Cannot enable anonymous mode while reports are pending';
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to handle the 3-strike system for anonymous users
CREATE OR REPLACE FUNCTION process_anonymous_report(p_reported_user_id UUID)
RETURNS TABLE (
  strike_count INTEGER,
  action_taken TEXT
) AS $$
DECLARE
  v_profile RECORD;
  v_distinct_reporters INTEGER;
BEGIN
  -- Get the user's profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_reported_user_id;

  IF NOT FOUND OR v_profile.is_anonymous = FALSE THEN
    RETURN QUERY SELECT 0, 'User not in anonymous mode';
    RETURN;
  END IF;

  -- Count distinct reporters for this user (while they were anonymous)
  SELECT COUNT(DISTINCT reporter_id) INTO v_distinct_reporters
  FROM reports
  WHERE reported_user_id = p_reported_user_id
    AND created_at > (
      SELECT COALESCE(
        (SELECT MAX(created_at) FROM audit_log
         WHERE target_id = p_reported_user_id
         AND action IN ('restore_anonymous', 'suspend_anonymous')),
        v_profile.created_at
      )
    );

  IF v_distinct_reporters >= 3 THEN
    -- Third strike from different reporters - suspend anonymous mode
    UPDATE profiles
    SET is_anonymous = FALSE,
        anon_suspended = TRUE,
        anonymous_alias = NULL
    WHERE id = p_reported_user_id;

    RETURN QUERY SELECT v_distinct_reporters, 'anonymous_suspended';
  ELSIF v_distinct_reporters = 2 THEN
    -- Second strike - reduce trust score
    UPDATE profiles
    SET trust_score = GREATEST(0, COALESCE(trust_score, 0) - 10)
    WHERE id = p_reported_user_id;

    RETURN QUERY SELECT v_distinct_reporters, 'trust_score_reduced';
  ELSE
    -- First strike - warning only
    RETURN QUERY SELECT v_distinct_reporters, 'warning';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_actor_id UUID,
  p_action admin_action,
  p_target_type audit_target_type,
  p_target_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_log (actor_id, action, target_type, target_id, details)
  VALUES (p_actor_id, p_action, p_target_type, p_target_id, p_details)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Blocks policies
-- Users can see their own blocks (both as blocker and blocked)
DROP POLICY IF EXISTS "Users can view their blocks" ON blocks;
CREATE POLICY "Users can view their blocks"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can create blocks
DROP POLICY IF EXISTS "Users can create blocks" ON blocks;
CREATE POLICY "Users can create blocks"
  ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can remove their blocks
DROP POLICY IF EXISTS "Users can remove their blocks" ON blocks;
CREATE POLICY "Users can remove their blocks"
  ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- Reports policies
-- Users can view their own reports (as reporter)
DROP POLICY IF EXISTS "Users can view reports they filed" ON reports;
CREATE POLICY "Users can view reports they filed"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins can view all reports
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create reports
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id
    -- Cannot report yourself
    AND (reported_user_id IS NULL OR reported_user_id != auth.uid())
  );

-- Only admins can update reports (to resolve them)
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit log policies
-- Only admins can view audit log
DROP POLICY IF EXISTS "Admins can view audit log" ON audit_log;
CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert into audit log (via function)
DROP POLICY IF EXISTS "Admins can insert audit log" ON audit_log;
CREATE POLICY "Admins can insert audit log"
  ON audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Prevent any updates or deletes on audit log (immutable)
-- No UPDATE or DELETE policies = no updates or deletes allowed

-- ============================================================================
-- ADD COLUMNS TO PROFILES IF NOT EXISTS
-- ============================================================================

-- Add trust_score column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trust_score'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trust_score INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add anon_suspended column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'anon_suspended'
  ) THEN
    ALTER TABLE profiles ADD COLUMN anon_suspended BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Add is_banned column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Add ban_reason column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ban_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ban_reason TEXT;
  END IF;
END $$;

-- ============================================================================
-- TRUST SCORE TRIGGERS
-- ============================================================================

-- Increment trust score for various positive actions
CREATE OR REPLACE FUNCTION increment_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Add 1 point for posting
  IF TG_TABLE_NAME = 'posts' THEN
    UPDATE profiles SET trust_score = COALESCE(trust_score, 0) + 1
    WHERE id = NEW.author_id;
  -- Add 2 points for joining a community
  ELSIF TG_TABLE_NAME = 'community_members' THEN
    UPDATE profiles SET trust_score = COALESCE(trust_score, 0) + 2
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trust score triggers
DROP TRIGGER IF EXISTS on_post_trust_score ON posts;
CREATE TRIGGER on_post_trust_score
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION increment_trust_score();

DROP TRIGGER IF EXISTS on_community_join_trust_score ON community_members;
CREATE TRIGGER on_community_join_trust_score
  AFTER INSERT ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION increment_trust_score();

-- Daily trust score increment (to be called by a cron job)
CREATE OR REPLACE FUNCTION daily_trust_score_increment()
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE profiles
  SET trust_score = COALESCE(trust_score, 0) + 1
  WHERE is_banned = FALSE
    AND created_at < NOW() - INTERVAL '1 day';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON TYPE report_reason TO authenticated;
GRANT USAGE ON TYPE report_status TO authenticated;
GRANT USAGE ON TYPE reportable_content_type TO authenticated;
GRANT USAGE ON TYPE admin_action TO authenticated;
GRANT USAGE ON TYPE audit_target_type TO authenticated;

GRANT SELECT, INSERT, DELETE ON blocks TO authenticated;
GRANT SELECT, INSERT ON reports TO authenticated;
GRANT UPDATE ON reports TO authenticated;
GRANT SELECT, INSERT ON audit_log TO authenticated;

GRANT EXECUTE ON FUNCTION is_blocked TO authenticated;
GRANT EXECUTE ON FUNCTION check_anonymous_eligibility TO authenticated;
GRANT EXECUTE ON FUNCTION process_anonymous_report TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
