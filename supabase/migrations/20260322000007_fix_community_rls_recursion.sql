-- Fix RLS infinite recursion in community_members and related tables
-- Creates SECURITY DEFINER helper functions to bypass RLS when checking membership

-- ============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- ============================================================================

-- Check if user is a member of a community
CREATE OR REPLACE FUNCTION is_community_member(community_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = community_uuid
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$;

-- Check if user is admin/moderator of a community
CREATE OR REPLACE FUNCTION is_community_admin(community_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = community_uuid
    AND user_id = auth.uid()
    AND role IN ('admin', 'moderator')
  );
$$;

-- Check if a community is accessible to current user (public or user is member)
CREATE OR REPLACE FUNCTION is_community_accessible(community_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM communities
    WHERE id = community_uuid
    AND (NOT is_private OR is_community_member(community_uuid))
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_community_member TO authenticated;
GRANT EXECUTE ON FUNCTION is_community_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_community_accessible TO authenticated;

-- ============================================================================
-- FIX COMMUNITY_MEMBERS POLICIES
-- ============================================================================

-- View members of accessible communities (fixed: no self-reference)
DROP POLICY IF EXISTS "View members of accessible communities" ON community_members;
CREATE POLICY "View members of accessible communities"
  ON community_members FOR SELECT
  USING (is_community_accessible(community_id));

-- Join public communities (no change needed - doesn't self-reference)
DROP POLICY IF EXISTS "Join public communities" ON community_members;
CREATE POLICY "Join public communities"
  ON community_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (SELECT 1 FROM communities WHERE id = community_id AND NOT is_private)
      OR status = 'pending'
    )
  );

-- Leave communities (no change needed)
DROP POLICY IF EXISTS "Leave communities" ON community_members;
CREATE POLICY "Leave communities"
  ON community_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage members (fixed: use helper function)
DROP POLICY IF EXISTS "Admins can manage members" ON community_members;
CREATE POLICY "Admins can manage members"
  ON community_members FOR ALL
  TO authenticated
  USING (is_community_admin(community_id));

-- Service role bypass
DROP POLICY IF EXISTS "Service role full access to community_members" ON community_members;
CREATE POLICY "Service role full access to community_members"
  ON community_members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FIX COMMUNITIES POLICIES (also had recursive references)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view public communities" ON communities;
CREATE POLICY "Anyone can view public communities"
  ON communities FOR SELECT
  USING (NOT is_private OR is_community_member(id));

-- ============================================================================
-- FIX POSTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "View posts in accessible communities" ON posts;
CREATE POLICY "View posts in accessible communities"
  ON posts FOR SELECT
  USING (
    NOT is_hidden
    AND (
      community_id IS NULL
      OR is_community_accessible(community_id)
    )
    AND NOT is_blocked(auth.uid(), author_id)
  );

DROP POLICY IF EXISTS "Create posts in accessible communities" ON posts;
CREATE POLICY "Create posts in accessible communities"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND (
      community_id IS NULL
      OR is_community_member(community_id)
    )
  );

-- ============================================================================
-- FIX COMMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "View comments on visible posts" ON comments;
CREATE POLICY "View comments on visible posts"
  ON comments FOR SELECT
  USING (
    NOT is_hidden
    AND EXISTS (SELECT 1 FROM posts WHERE id = post_id AND NOT is_hidden)
    AND NOT is_blocked(auth.uid(), author_id)
  );
