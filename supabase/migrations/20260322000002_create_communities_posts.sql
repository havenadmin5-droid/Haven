-- Phase 3: Communities, Posts, Reactions, Comments
-- This migration creates the core community and feed tables

-- ============================================
-- COMMUNITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  tag TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '🌈',
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Community tags enum for validation
DO $$ BEGIN
  ALTER TABLE communities ADD CONSTRAINT valid_community_tag
    CHECK (tag IN (
      'Social', 'Support', 'Professional', 'Art', 'Tech',
      'Wellness', 'Music', 'Books', 'Gaming', 'Sports',
      'Travel', 'Food', 'Fashion', 'Film', 'Other'
    ));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_communities_tag ON communities(tag);
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON communities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communities_member_count ON communities(member_count DESC);

-- ============================================
-- COMMUNITY MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

-- Role and status constraints
DO $$ BEGIN
  ALTER TABLE community_members ADD CONSTRAINT valid_member_role
    CHECK (role IN ('member', 'moderator', 'admin'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE community_members ADD CONSTRAINT valid_member_status
    CHECK (status IN ('active', 'pending', 'banned'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_status ON community_members(status);

-- ============================================
-- POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  reaction_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content length constraint
DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT post_content_length CHECK (char_length(content) <= 2000);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT post_images_max CHECK (cardinality(image_urls) <= 4);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_not_hidden ON posts(created_at DESC) WHERE NOT is_hidden;

-- ============================================
-- POST REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS post_reactions (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id, reaction_type)
);

-- Reaction type must be 0-9 (10 sticker types)
DO $$ BEGIN
  ALTER TABLE post_reactions ADD CONSTRAINT valid_reaction_type
    CHECK (reaction_type >= 0 AND reaction_type <= 9);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);

-- ============================================
-- COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content length constraint
DO $$ BEGIN
  ALTER TABLE comments ADD CONSTRAINT comment_content_length CHECK (char_length(content) <= 1000);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- ============================================
-- TRIGGERS FOR DENORMALIZED COUNTERS
-- ============================================

-- Member count trigger
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE communities SET member_count = member_count - 1 WHERE id = OLD.community_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
    ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE communities SET member_count = member_count - 1 WHERE id = NEW.community_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_community_member_count ON community_members;
CREATE TRIGGER trg_update_community_member_count
AFTER INSERT OR UPDATE OR DELETE ON community_members
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Reaction count trigger
CREATE OR REPLACE FUNCTION update_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET reaction_count = reaction_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_post_reaction_count ON post_reactions;
CREATE TRIGGER trg_update_post_reaction_count
AFTER INSERT OR DELETE ON post_reactions
FOR EACH ROW EXECUTE FUNCTION update_post_reaction_count();

-- Comment count trigger
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NOT NEW.is_hidden THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND NOT OLD.is_hidden THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_hidden AND NOT NEW.is_hidden THEN
      UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF NOT OLD.is_hidden AND NEW.is_hidden THEN
      UPDATE posts SET comment_count = comment_count - 1 WHERE id = NEW.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_post_comment_count ON comments;
CREATE TRIGGER trg_update_post_comment_count
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- ============================================

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

-- Check if a community is accessible to current user
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

-- COMMUNITIES POLICIES
-- Anyone can view public communities (uses helper to avoid recursion)
DROP POLICY IF EXISTS "Anyone can view public communities" ON communities;
CREATE POLICY "Anyone can view public communities"
  ON communities FOR SELECT
  USING (NOT is_private OR is_community_member(id));

-- Authenticated users can create communities
DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;
CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Community admins can update
DROP POLICY IF EXISTS "Community admins can update" ON communities;
CREATE POLICY "Community admins can update"
  ON communities FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = communities.id
    AND user_id = auth.uid()
    AND role = 'admin'
  ));

-- Service role bypass
DROP POLICY IF EXISTS "Service role full access to communities" ON communities;
CREATE POLICY "Service role full access to communities"
  ON communities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- COMMUNITY_MEMBERS POLICIES
-- View members of accessible communities (uses helper to avoid recursion)
DROP POLICY IF EXISTS "View members of accessible communities" ON community_members;
CREATE POLICY "View members of accessible communities"
  ON community_members FOR SELECT
  USING (is_community_accessible(community_id));

-- Join public communities
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

-- Leave communities
DROP POLICY IF EXISTS "Leave communities" ON community_members;
CREATE POLICY "Leave communities"
  ON community_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage members (uses helper to avoid recursion)
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

-- POSTS POLICIES
-- View non-hidden posts in accessible communities or global feed (uses helper to avoid recursion)
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

-- Authors can view their own hidden posts
DROP POLICY IF EXISTS "Authors can view own posts" ON posts;
CREATE POLICY "Authors can view own posts"
  ON posts FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

-- Create posts in accessible communities (uses helper to avoid recursion)
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

-- Authors can update their own posts
DROP POLICY IF EXISTS "Authors can update own posts" ON posts;
CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- Authors can delete their own posts
DROP POLICY IF EXISTS "Authors can delete own posts" ON posts;
CREATE POLICY "Authors can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Service role bypass
DROP POLICY IF EXISTS "Service role full access to posts" ON posts;
CREATE POLICY "Service role full access to posts"
  ON posts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- POST_REACTIONS POLICIES
-- View reactions on visible posts
DROP POLICY IF EXISTS "View reactions on visible posts" ON post_reactions;
CREATE POLICY "View reactions on visible posts"
  ON post_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM posts WHERE id = post_id AND NOT is_hidden
  ));

-- Add reactions to visible posts
DROP POLICY IF EXISTS "Add reactions to visible posts" ON post_reactions;
CREATE POLICY "Add reactions to visible posts"
  ON post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM posts WHERE id = post_id AND NOT is_hidden)
  );

-- Remove own reactions
DROP POLICY IF EXISTS "Remove own reactions" ON post_reactions;
CREATE POLICY "Remove own reactions"
  ON post_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role bypass
DROP POLICY IF EXISTS "Service role full access to post_reactions" ON post_reactions;
CREATE POLICY "Service role full access to post_reactions"
  ON post_reactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- COMMENTS POLICIES
-- View non-hidden comments on visible posts
DROP POLICY IF EXISTS "View comments on visible posts" ON comments;
CREATE POLICY "View comments on visible posts"
  ON comments FOR SELECT
  USING (
    NOT is_hidden
    AND EXISTS (SELECT 1 FROM posts WHERE id = post_id AND NOT is_hidden)
    -- Filter out blocked users (uses stub function until blocks table exists)
    AND NOT is_blocked(auth.uid(), comments.author_id)
  );

-- Authors can view their own hidden comments
DROP POLICY IF EXISTS "Authors can view own comments" ON comments;
CREATE POLICY "Authors can view own comments"
  ON comments FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

-- Create comments on visible posts
DROP POLICY IF EXISTS "Create comments on visible posts" ON comments;
CREATE POLICY "Create comments on visible posts"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (SELECT 1 FROM posts WHERE id = post_id AND NOT is_hidden)
  );

-- Authors can update their own comments
DROP POLICY IF EXISTS "Authors can update own comments" ON comments;
CREATE POLICY "Authors can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- Authors can delete their own comments
DROP POLICY IF EXISTS "Authors can delete own comments" ON comments;
CREATE POLICY "Authors can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Service role bypass
DROP POLICY IF EXISTS "Service role full access to comments" ON comments;
CREATE POLICY "Service role full access to comments"
  ON comments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- CREATE STORAGE BUCKET FOR POST IMAGES
-- ============================================
-- Note: Storage buckets are created via API, not SQL
-- Run this via Supabase Dashboard or API:
-- Bucket name: post-images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
