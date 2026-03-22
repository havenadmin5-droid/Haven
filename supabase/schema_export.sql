-- ============================================================================
-- HAVEN DATABASE SCHEMA - COMPLETE EXPORT
-- ============================================================================
-- Run this file in your new Supabase project (Mumbai region) to set up the schema
--
-- INSTRUCTIONS:
-- 1. Create a new Supabase project in ap-south-1 (Mumbai)
-- 2. Go to SQL Editor in the Dashboard
-- 3. Paste this entire file and run it
-- 4. Create storage buckets (see end of file)
-- 5. Update your .env.local with new credentials
-- ============================================================================

-- ============================================================================
-- PHASE 0: EXTENSIONS & HELPER FUNCTIONS
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stub is_blocked function (will be replaced later)
CREATE OR REPLACE FUNCTION is_blocked(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_blocked TO authenticated;
GRANT EXECUTE ON FUNCTION is_blocked TO anon;

-- ============================================================================
-- PHASE 1: PROFILES TABLE
-- ============================================================================

-- Create enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('member', 'city_mod', 'community_mod', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE city_enum AS ENUM (
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Kochi',
    'Goa', 'Indore', 'Coimbatore', 'Nagpur', 'Vadodara', 'Surat',
    'Thiruvananthapuram', 'Bhopal', 'Visakhapatnam', 'Mysore', 'Other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE profession_enum AS ENUM (
    'Software Engineer', 'Designer', 'Product Manager', 'Data Scientist',
    'Doctor', 'Lawyer', 'Therapist', 'Counselor', 'Teacher', 'Professor',
    'Writer', 'Artist', 'Musician', 'Photographer', 'Filmmaker',
    'Marketing', 'Finance', 'HR', 'Entrepreneur', 'Consultant',
    'Social Worker', 'NGO Worker', 'Activist', 'Healthcare Worker',
    'Student', 'Researcher', 'Journalist', 'Content Creator', 'Other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '🌈',
  avatar_url TEXT,
  show_photo BOOLEAN NOT NULL DEFAULT FALSE,
  real_name TEXT,
  show_real_name BOOLEAN NOT NULL DEFAULT FALSE,
  email TEXT NOT NULL,
  pronouns TEXT,
  city city_enum NOT NULL,
  profession profession_enum NOT NULL,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  anonymous_alias TEXT,
  anon_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  anon_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  trust_score INTEGER NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  role user_role NOT NULL DEFAULT 'member',
  theme_pref theme_preference NOT NULL DEFAULT 'light',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 280),
  CONSTRAINT skills_limit CHECK (array_length(skills, 1) IS NULL OR array_length(skills, 1) <= 10),
  CONSTRAINT pronouns_length CHECK (char_length(pronouns) <= 50)
);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_profession ON profiles(profession);
CREATE INDEX IF NOT EXISTS idx_profiles_verified_avail ON profiles(is_verified DESC, is_available DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles(LOWER(username));

-- Full-text search
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN search_vector tsvector;
EXCEPTION WHEN duplicate_column THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING GIN (search_vector);

-- Search vector trigger
CREATE OR REPLACE FUNCTION update_profiles_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.profession::text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.skills, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_search_vector ON profiles;
CREATE TRIGGER profiles_search_vector
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_search_vector();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Anonymous alias functions
CREATE OR REPLACE FUNCTION generate_anonymous_alias()
RETURNS TEXT AS $$
BEGIN
  RETURN 'haven_user_' || substr(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_anonymous_alias()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.anonymous_alias IS NULL THEN
    NEW.anonymous_alias = generate_anonymous_alias();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_set_anonymous_alias ON profiles;
CREATE TRIGGER profiles_set_anonymous_alias
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_anonymous_alias();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, city, profession)
  VALUES (
    NEW.id,
    NEW.email,
    'user_' || substr(NEW.id::text, 1, 8),
    'Other',
    'Other'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  RETURN v_role IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_profile_field(field_name text)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  EXECUTE format('SELECT %I::text FROM profiles WHERE id = $1', field_name)
  INTO result USING auth.uid();
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_profile_field TO authenticated;

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view public profile fields" ON profiles;
CREATE POLICY "Users can view public profile fields"
  ON profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND id != auth.uid()
    AND deleted_at IS NULL
    AND is_banned = FALSE
    AND NOT is_blocked(auth.uid(), id)
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role::text = get_my_profile_field('role')
    AND is_verified::text = get_my_profile_field('is_verified')
    AND trust_score::text = get_my_profile_field('trust_score')
    AND is_banned::text = get_my_profile_field('is_banned')
    AND anon_unlocked::text = get_my_profile_field('anon_unlocked')
    AND anon_suspended::text = get_my_profile_field('anon_suspended')
  );

DROP POLICY IF EXISTS "No direct inserts" ON profiles;
CREATE POLICY "No direct inserts"
  ON profiles FOR INSERT WITH CHECK (FALSE);

DROP POLICY IF EXISTS "No direct deletes" ON profiles;
CREATE POLICY "No direct deletes"
  ON profiles FOR DELETE USING (FALSE);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can update user status" ON profiles;
CREATE POLICY "Admins can update user status"
  ON profiles FOR UPDATE USING (is_admin());

-- Public profiles view
CREATE OR REPLACE VIEW public_profiles AS
SELECT
  id,
  CASE WHEN is_anonymous THEN anonymous_alias ELSE username END as display_name,
  CASE WHEN is_anonymous THEN NULL WHEN show_photo THEN avatar_url ELSE NULL END as display_avatar,
  avatar_emoji,
  CASE WHEN show_real_name AND NOT is_anonymous THEN real_name ELSE NULL END as display_real_name,
  CASE WHEN is_anonymous THEN NULL ELSE city END as display_city,
  profession, bio, skills, is_verified, is_available, pronouns, created_at
FROM profiles
WHERE deleted_at IS NULL AND is_banned = FALSE;

-- ============================================================================
-- PHASE 2: COMMUNITIES & POSTS
-- ============================================================================

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

DO $$ BEGIN
  ALTER TABLE communities ADD CONSTRAINT valid_community_tag
    CHECK (tag IN ('Social', 'Support', 'Professional', 'Art', 'Tech',
      'Wellness', 'Music', 'Books', 'Gaming', 'Sports',
      'Travel', 'Food', 'Fashion', 'Film', 'Other'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_communities_tag ON communities(tag);
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON communities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communities_member_count ON communities(member_count DESC);

CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

DO $$ BEGIN
  ALTER TABLE community_members ADD CONSTRAINT valid_member_role CHECK (role IN ('member', 'moderator', 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE community_members ADD CONSTRAINT valid_member_status CHECK (status IN ('active', 'pending', 'banned'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_status ON community_members(status);

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

DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT post_content_length CHECK (char_length(content) <= 2000);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT post_images_max CHECK (cardinality(image_urls) <= 4);
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_not_hidden ON posts(created_at DESC) WHERE NOT is_hidden;

CREATE TABLE IF NOT EXISTS post_reactions (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id, reaction_type)
);

DO $$ BEGIN
  ALTER TABLE post_reactions ADD CONSTRAINT valid_reaction_type CHECK (reaction_type >= 0 AND reaction_type <= 9);
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);

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

DO $$ BEGIN
  ALTER TABLE comments ADD CONSTRAINT comment_content_length CHECK (char_length(content) <= 1000);
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Counter triggers
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

-- Community helper functions (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_community_member(community_uuid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = community_uuid AND user_id = auth.uid() AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION is_community_admin(community_uuid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = community_uuid AND user_id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$;

CREATE OR REPLACE FUNCTION is_community_accessible(community_uuid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM communities
    WHERE id = community_uuid AND (NOT is_private OR is_community_member(community_uuid))
  );
$$;

GRANT EXECUTE ON FUNCTION is_community_member TO authenticated;
GRANT EXECUTE ON FUNCTION is_community_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_community_accessible TO authenticated;

-- Communities RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public communities" ON communities;
CREATE POLICY "Anyone can view public communities"
  ON communities FOR SELECT USING (NOT is_private OR is_community_member(id));

DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;
CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Community admins can update" ON communities;
CREATE POLICY "Community admins can update"
  ON communities FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM community_members WHERE community_id = communities.id AND user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Service role full access to communities" ON communities;
CREATE POLICY "Service role full access to communities"
  ON communities FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "View members of accessible communities" ON community_members;
CREATE POLICY "View members of accessible communities"
  ON community_members FOR SELECT USING (is_community_accessible(community_id));

DROP POLICY IF EXISTS "Join public communities" ON community_members;
CREATE POLICY "Join public communities"
  ON community_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (EXISTS (SELECT 1 FROM communities WHERE id = community_id AND NOT is_private) OR status = 'pending'));

DROP POLICY IF EXISTS "Leave communities" ON community_members;
CREATE POLICY "Leave communities"
  ON community_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage members" ON community_members;
CREATE POLICY "Admins can manage members"
  ON community_members FOR ALL TO authenticated USING (is_community_admin(community_id));

DROP POLICY IF EXISTS "Service role full access to community_members" ON community_members;
CREATE POLICY "Service role full access to community_members"
  ON community_members FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "View posts in accessible communities" ON posts;
CREATE POLICY "View posts in accessible communities"
  ON posts FOR SELECT
  USING (NOT is_hidden AND (community_id IS NULL OR is_community_accessible(community_id)) AND NOT is_blocked(auth.uid(), author_id));

DROP POLICY IF EXISTS "Authors can view own posts" ON posts;
CREATE POLICY "Authors can view own posts"
  ON posts FOR SELECT TO authenticated USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Create posts in accessible communities" ON posts;
CREATE POLICY "Create posts in accessible communities"
  ON posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND (community_id IS NULL OR is_community_member(community_id)));

DROP POLICY IF EXISTS "Authors can update own posts" ON posts;
CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE TO authenticated USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete own posts" ON posts;
CREATE POLICY "Authors can delete own posts"
  ON posts FOR DELETE TO authenticated USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to posts" ON posts;
CREATE POLICY "Service role full access to posts"
  ON posts FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "View reactions on visible posts" ON post_reactions;
CREATE POLICY "View reactions on visible posts"
  ON post_reactions FOR SELECT USING (EXISTS (SELECT 1 FROM posts WHERE id = post_id AND NOT is_hidden));

DROP POLICY IF EXISTS "Add reactions to visible posts" ON post_reactions;
CREATE POLICY "Add reactions to visible posts"
  ON post_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM posts WHERE id = post_id AND NOT is_hidden));

DROP POLICY IF EXISTS "Remove own reactions" ON post_reactions;
CREATE POLICY "Remove own reactions"
  ON post_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to post_reactions" ON post_reactions;
CREATE POLICY "Service role full access to post_reactions"
  ON post_reactions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "View comments on visible posts" ON comments;
CREATE POLICY "View comments on visible posts"
  ON comments FOR SELECT
  USING (NOT is_hidden AND EXISTS (SELECT 1 FROM posts WHERE id = post_id AND NOT is_hidden) AND NOT is_blocked(auth.uid(), author_id));

DROP POLICY IF EXISTS "Authors can view own comments" ON comments;
CREATE POLICY "Authors can view own comments"
  ON comments FOR SELECT TO authenticated USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Create comments on visible posts" ON comments;
CREATE POLICY "Create comments on visible posts"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM posts WHERE id = post_id AND NOT is_hidden));

DROP POLICY IF EXISTS "Authors can update own comments" ON comments;
CREATE POLICY "Authors can update own comments"
  ON comments FOR UPDATE TO authenticated USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete own comments" ON comments;
CREATE POLICY "Authors can delete own comments"
  ON comments FOR DELETE TO authenticated USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to comments" ON comments;
CREATE POLICY "Service role full access to comments"
  ON comments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- PHASE 3: JOBS & EVENTS
-- ============================================================================

CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'freelance', 'internship', 'contract');
CREATE TYPE event_category AS ENUM ('art', 'music', 'tech', 'wellness', 'dance', 'books', 'fitness', 'social', 'support', 'workshop');
CREATE TYPE rsvp_status AS ENUM ('going', 'maybe', 'waitlisted');

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 120),
  company TEXT NOT NULL CHECK (char_length(company) <= 100),
  description TEXT NOT NULL CHECK (char_length(description) <= 3000),
  city TEXT NOT NULL,
  job_type job_type NOT NULL DEFAULT 'full_time',
  is_remote BOOLEAN NOT NULL DEFAULT FALSE,
  salary_range TEXT,
  tags TEXT[] DEFAULT '{}',
  apply_url TEXT,
  apply_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX idx_jobs_city ON jobs(city);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_jobs_expires_at ON jobs(expires_at);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

CREATE TABLE job_saves (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, job_id)
);

CREATE INDEX idx_job_saves_user_id ON job_saves(user_id);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 120),
  description TEXT NOT NULL CHECK (char_length(description) <= 2000),
  city TEXT NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  end_time TIME,
  category event_category NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  attendee_count INTEGER NOT NULL DEFAULT 0,
  cover_url TEXT,
  emoji TEXT DEFAULT '🎉',
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule TEXT,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_host_id ON events(host_id);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_is_private ON events(is_private);
CREATE INDEX idx_events_community_id ON events(community_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

CREATE TABLE event_rsvps (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL DEFAULT 'going',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX idx_event_rsvps_status ON event_rsvps(status);

-- Event attendee count triggers
CREATE OR REPLACE FUNCTION increment_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'going' THEN
    UPDATE events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_increment_attendee_count
AFTER INSERT ON event_rsvps FOR EACH ROW EXECUTE FUNCTION increment_attendee_count();

CREATE OR REPLACE FUNCTION decrement_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'going' THEN
    UPDATE events SET attendee_count = GREATEST(0, attendee_count - 1) WHERE id = OLD.event_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_decrement_attendee_count
AFTER DELETE ON event_rsvps FOR EACH ROW EXECUTE FUNCTION decrement_attendee_count();

CREATE OR REPLACE FUNCTION update_attendee_count_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'going' AND NEW.status != 'going' THEN
    UPDATE events SET attendee_count = GREATEST(0, attendee_count - 1) WHERE id = NEW.event_id;
  ELSIF OLD.status != 'going' AND NEW.status = 'going' THEN
    UPDATE events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_attendee_count
AFTER UPDATE ON event_rsvps FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_attendee_count_on_status_change();

CREATE OR REPLACE FUNCTION expire_old_jobs()
RETURNS void AS $$
BEGIN
  UPDATE jobs SET is_active = FALSE
  WHERE is_active = TRUE AND expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION promote_from_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  v_capacity INTEGER;
  v_attendee_count INTEGER;
  v_waitlist_user UUID;
BEGIN
  SELECT capacity, attendee_count INTO v_capacity, v_attendee_count FROM events WHERE id = OLD.event_id;
  IF v_capacity IS NOT NULL AND v_attendee_count < v_capacity THEN
    SELECT user_id INTO v_waitlist_user FROM event_rsvps
    WHERE event_id = OLD.event_id AND status = 'waitlisted' ORDER BY created_at ASC LIMIT 1;
    IF v_waitlist_user IS NOT NULL THEN
      UPDATE event_rsvps SET status = 'going' WHERE event_id = OLD.event_id AND user_id = v_waitlist_user;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_promote_from_waitlist
AFTER DELETE ON event_rsvps FOR EACH ROW WHEN (OLD.status = 'going')
EXECUTE FUNCTION promote_from_waitlist();

-- Jobs & Events RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active jobs" ON jobs FOR SELECT
USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()) AND NOT is_blocked(auth.uid(), posted_by));

CREATE POLICY "Users can view own jobs" ON jobs FOR SELECT USING (auth.uid() = posted_by);

CREATE POLICY "Authenticated users can create jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Users can update own jobs" ON jobs FOR UPDATE USING (auth.uid() = posted_by);

CREATE POLICY "Users can delete own jobs" ON jobs FOR DELETE USING (auth.uid() = posted_by);

CREATE POLICY "Users can view own saved jobs" ON job_saves FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs" ON job_saves FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave jobs" ON job_saves FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public events" ON events FOR SELECT USING (NOT is_blocked(auth.uid(), host_id));

CREATE POLICY "Users can view own events" ON events FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "Authenticated users can create events" ON events FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update own events" ON events FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Users can delete own events" ON events FOR DELETE USING (auth.uid() = host_id);

CREATE POLICY "Users can view relevant RSVPs" ON event_rsvps FOR SELECT
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid()));

CREATE POLICY "Users can RSVP to events" ON event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RSVP" ON event_rsvps FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel RSVP" ON event_rsvps FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON jobs TO authenticated;
GRANT ALL ON job_saves TO authenticated;
GRANT ALL ON events TO authenticated;
GRANT ALL ON event_rsvps TO authenticated;
GRANT SELECT ON jobs TO anon;
GRANT SELECT ON events TO anon;

-- ============================================================================
-- PHASE 4: CHAT & REALTIME
-- ============================================================================

CREATE TYPE conversation_type AS ENUM ('dm', 'group');
CREATE TYPE conversation_role AS ENUM ('member', 'admin');
CREATE TYPE dm_request_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type conversation_type NOT NULL,
  name TEXT CHECK (char_length(name) <= 100),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_community_id ON conversations(community_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

CREATE TABLE conversation_members (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role conversation_role NOT NULL DEFAULT 'member',
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dm_status dm_request_status DEFAULT 'accepted',
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_conversation_members_user_id ON conversation_members(user_id);
CREATE INDEX idx_conversation_members_dm_status ON conversation_members(dm_status);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT CHECK (char_length(content) <= 4000),
  image_url TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

CREATE TABLE anonymous_message_counts (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  message_count INTEGER NOT NULL DEFAULT 0,
  reset_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Chat triggers and functions
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

CREATE OR REPLACE FUNCTION check_anonymous_message_limit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_reset_date DATE;
BEGIN
  SELECT message_count, reset_date INTO v_count, v_reset_date FROM anonymous_message_counts WHERE user_id = p_user_id;
  IF v_count IS NULL OR v_reset_date < CURRENT_DATE THEN
    INSERT INTO anonymous_message_counts (user_id, message_count, reset_date) VALUES (p_user_id, 0, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET message_count = 0, reset_date = CURRENT_DATE;
    RETURN 20;
  END IF;
  RETURN 20 - v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_anonymous_message_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO anonymous_message_counts (user_id, message_count, reset_date) VALUES (p_user_id, 1, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
  SET message_count = anonymous_message_counts.message_count + 1,
      reset_date = CASE WHEN anonymous_message_counts.reset_date < CURRENT_DATE THEN CURRENT_DATE ELSE anonymous_message_counts.reset_date END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_or_create_dm(p_user1 UUID, p_user2 UUID)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  SELECT c.id INTO v_conversation_id FROM conversations c
  JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = p_user1
  JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = p_user2
  WHERE c.type = 'dm';
  IF v_conversation_id IS NOT NULL THEN RETURN v_conversation_id; END IF;
  INSERT INTO conversations (type) VALUES ('dm') RETURNING id INTO v_conversation_id;
  INSERT INTO conversation_members (conversation_id, user_id, dm_status) VALUES
    (v_conversation_id, p_user1, 'accepted'), (v_conversation_id, p_user2, 'pending');
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Chat helper functions
CREATE OR REPLACE FUNCTION is_conversation_member(conversation_uuid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversation_uuid AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION is_conversation_admin(conversation_uuid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversation_uuid AND user_id = auth.uid() AND role = 'admin');
$$;

GRANT EXECUTE ON FUNCTION is_conversation_member TO authenticated;
GRANT EXECUTE ON FUNCTION is_conversation_admin TO authenticated;

-- Chat RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_message_counts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (is_conversation_member(id));

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update group conversations" ON conversations;
CREATE POLICY "Admins can update group conversations" ON conversations FOR UPDATE USING (type = 'group' AND is_conversation_admin(id));

DROP POLICY IF EXISTS "Users can view conversation members" ON conversation_members;
CREATE POLICY "Users can view conversation members" ON conversation_members FOR SELECT USING (is_conversation_member(conversation_id));

DROP POLICY IF EXISTS "Users can join conversations" ON conversation_members;
CREATE POLICY "Users can join conversations" ON conversation_members FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR is_conversation_admin(conversation_id)));

DROP POLICY IF EXISTS "Users can update own membership" ON conversation_members;
CREATE POLICY "Users can update own membership" ON conversation_members FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_members;
CREATE POLICY "Users can leave conversations" ON conversation_members FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT
USING (is_conversation_member(conversation_id) AND NOT is_blocked(auth.uid(), sender_id));

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages FOR INSERT
WITH CHECK (sender_id = auth.uid() AND is_conversation_member(conversation_id));

DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (sender_id = auth.uid());

CREATE POLICY "Users can view own message count" ON anonymous_message_counts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own message count" ON anonymous_message_counts FOR ALL USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_members TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON anonymous_message_counts TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_dm TO authenticated;
GRANT EXECUTE ON FUNCTION check_anonymous_message_limit TO authenticated;
GRANT EXECUTE ON FUNCTION increment_anonymous_message_count TO authenticated;

-- ============================================================================
-- PHASE 5: SAFETY & ADMIN
-- ============================================================================

DO $$ BEGIN CREATE TYPE report_reason AS ENUM ('harassment', 'spam', 'inappropriate', 'doxxing', 'hate_speech', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE reportable_content_type AS ENUM ('post', 'comment', 'message', 'profile', 'event');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE admin_action AS ENUM ('ban_user', 'unban_user', 'verify_user', 'unverify_user', 'resolve_report', 'dismiss_report', 'delete_content', 'restore_content', 'feature_event', 'unfeature_event', 'suspend_anonymous', 'restore_anonymous', 'delete_community', 'warn_user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE audit_target_type AS ENUM ('user', 'post', 'comment', 'event', 'community', 'report', 'message', 'job');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

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
  CONSTRAINT report_target CHECK (reported_user_id IS NOT NULL OR (reported_content_id IS NOT NULL AND reported_content_type IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action admin_action NOT NULL,
  target_type audit_target_type NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status) WHERE status IN ('pending', 'reviewing');
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Real is_blocked function (replaces stub)
CREATE OR REPLACE FUNCTION is_blocked(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b) OR (blocker_id = user_b AND blocked_id = user_a)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION check_anonymous_eligibility(p_user_id UUID)
RETURNS TABLE (eligible BOOLEAN, reason TEXT) AS $$
DECLARE
  v_profile RECORD;
  v_account_age INTEGER;
  v_unresolved_reports INTEGER;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN QUERY SELECT FALSE, 'User not found'; RETURN; END IF;
  v_account_age := EXTRACT(DAY FROM (NOW() - v_profile.created_at));
  IF v_account_age < 14 THEN RETURN QUERY SELECT FALSE, 'Account must be at least 14 days old'; RETURN; END IF;
  IF COALESCE(v_profile.trust_score, 0) < 20 THEN RETURN QUERY SELECT FALSE, 'Trust score must be at least 20'; RETURN; END IF;
  IF v_profile.anon_suspended = TRUE THEN RETURN QUERY SELECT FALSE, 'Anonymous mode has been suspended for this account'; RETURN; END IF;
  SELECT COUNT(*) INTO v_unresolved_reports FROM reports WHERE reported_user_id = p_user_id AND status IN ('pending', 'reviewing');
  IF v_unresolved_reports > 0 THEN RETURN QUERY SELECT FALSE, 'Cannot enable anonymous mode while reports are pending'; RETURN; END IF;
  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION log_admin_action(p_actor_id UUID, p_action admin_action, p_target_type audit_target_type, p_target_id UUID, p_details JSONB DEFAULT NULL)
RETURNS UUID AS $$
DECLARE v_log_id UUID;
BEGIN
  INSERT INTO audit_log (actor_id, action, target_type, target_id, details) VALUES (p_actor_id, p_action, p_target_type, p_target_id, p_details) RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trust score triggers
CREATE OR REPLACE FUNCTION increment_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN
    UPDATE profiles SET trust_score = COALESCE(trust_score, 0) + 1 WHERE id = NEW.author_id;
  ELSIF TG_TABLE_NAME = 'community_members' THEN
    UPDATE profiles SET trust_score = COALESCE(trust_score, 0) + 2 WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_trust_score ON posts;
CREATE TRIGGER on_post_trust_score AFTER INSERT ON posts FOR EACH ROW EXECUTE FUNCTION increment_trust_score();

DROP TRIGGER IF EXISTS on_community_join_trust_score ON community_members;
CREATE TRIGGER on_community_join_trust_score AFTER INSERT ON community_members FOR EACH ROW EXECUTE FUNCTION increment_trust_score();

CREATE OR REPLACE FUNCTION daily_trust_score_increment()
RETURNS INTEGER AS $$
DECLARE v_updated INTEGER;
BEGIN
  UPDATE profiles SET trust_score = COALESCE(trust_score, 0) + 1 WHERE is_banned = FALSE AND created_at < NOW() - INTERVAL '1 day';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safety RLS
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their blocks" ON blocks;
CREATE POLICY "Users can view their blocks" ON blocks FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can create blocks" ON blocks;
CREATE POLICY "Users can create blocks" ON blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can remove their blocks" ON blocks;
CREATE POLICY "Users can remove their blocks" ON blocks FOR DELETE USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can view reports they filed" ON reports;
CREATE POLICY "Users can view reports they filed" ON reports FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
CREATE POLICY "Admins can view all reports" ON reports FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id AND (reported_user_id IS NULL OR reported_user_id != auth.uid()));

DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can view audit log" ON audit_log;
CREATE POLICY "Admins can view audit log" ON audit_log FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can insert audit log" ON audit_log;
CREATE POLICY "Admins can insert audit log" ON audit_log FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

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
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;

-- ============================================================================
-- STORAGE BUCKETS (Create via Supabase Dashboard)
-- ============================================================================
--
-- 1. avatars
--    - Public: true
--    - File size limit: 2MB
--    - Allowed MIME: image/jpeg, image/png, image/webp
--
-- 2. post-images
--    - Public: true
--    - File size limit: 5MB
--    - Allowed MIME: image/jpeg, image/png, image/webp, image/gif
--
-- 3. event-covers
--    - Public: true
--    - File size limit: 5MB
--    - Allowed MIME: image/jpeg, image/png, image/webp, image/gif
--
-- 4. chat-images
--    - Public: false (requires auth)
--    - File size limit: 5MB
--    - Allowed MIME: image/jpeg, image/png, image/webp, image/gif
--
-- ============================================================================

-- Done! Your Haven database schema is ready.
-- Don't forget to:
-- 1. Create the storage buckets listed above
-- 2. Update .env.local with new Supabase credentials
-- 3. Run `npx supabase gen types typescript` to regenerate types
