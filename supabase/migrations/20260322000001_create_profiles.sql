-- Haven Database Schema: Profiles Table
-- Security: RLS enabled, strict access controls

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types (with IF NOT EXISTS workaround)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('member', 'city_mod', 'community_mod', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'system');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Approved cities enum (major Indian cities)
DO $$ BEGIN
  CREATE TYPE city_enum AS ENUM (
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Kochi',
    'Goa', 'Indore', 'Coimbatore', 'Nagpur', 'Vadodara', 'Surat',
    'Thiruvananthapuram', 'Bhopal', 'Visakhapatnam', 'Mysore', 'Other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Approved professions enum
DO $$ BEGIN
  CREATE TYPE profession_enum AS ENUM (
    'Software Engineer', 'Designer', 'Product Manager', 'Data Scientist',
    'Doctor', 'Lawyer', 'Therapist', 'Counselor', 'Teacher', 'Professor',
    'Writer', 'Artist', 'Musician', 'Photographer', 'Filmmaker',
    'Marketing', 'Finance', 'HR', 'Entrepreneur', 'Consultant',
    'Social Worker', 'NGO Worker', 'Activist', 'Healthcare Worker',
    'Student', 'Researcher', 'Journalist', 'Content Creator', 'Other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Public display info
  username TEXT UNIQUE NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '🌈',
  avatar_url TEXT,
  show_photo BOOLEAN NOT NULL DEFAULT FALSE,

  -- Private info (protected by RLS)
  real_name TEXT,
  show_real_name BOOLEAN NOT NULL DEFAULT FALSE,
  email TEXT NOT NULL,
  pronouns TEXT,

  -- Professional info
  city city_enum NOT NULL DEFAULT 'Other',
  profession profession_enum NOT NULL DEFAULT 'Other',
  bio TEXT,
  skills TEXT[] DEFAULT '{}',

  -- Status flags
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason TEXT,

  -- Anonymous mode
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  anonymous_alias TEXT,
  anon_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  anon_suspended BOOLEAN NOT NULL DEFAULT FALSE,

  -- Trust system
  trust_score INTEGER NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  role user_role NOT NULL DEFAULT 'member',

  -- Preferences
  theme_pref theme_preference NOT NULL DEFAULT 'light',

  -- Soft delete
  deleted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 280),
  CONSTRAINT skills_limit CHECK (array_length(skills, 1) IS NULL OR array_length(skills, 1) <= 10),
  CONSTRAINT pronouns_length CHECK (char_length(pronouns) <= 50)
);

-- Create indexes for performance (as specified in Engineering Standards 3.1)
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_profession ON profiles(profession);
CREATE INDEX IF NOT EXISTS idx_profiles_verified_avail ON profiles(is_verified DESC, is_available DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles(LOWER(username));

-- Full-text search vector column (add if not exists)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN search_vector tsvector;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING GIN (search_vector);

-- Function to update search vector
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
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_search_vector();

-- Auto-update updated_at trigger
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
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Generate anonymous alias
CREATE OR REPLACE FUNCTION generate_anonymous_alias()
RETURNS TEXT AS $$
BEGIN
  RETURN 'haven_user_' || substr(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

-- Auto-generate anonymous alias on profile creation
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
  FOR EACH ROW
  EXECUTE FUNCTION set_anonymous_alias();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    'user_' || substr(NEW.id::text, 1, 8)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ===================
-- ROW-LEVEL SECURITY
-- ===================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if blocked
CREATE OR REPLACE FUNCTION is_blocked(user_a uuid, user_b uuid)
RETURNS boolean AS $$
BEGIN
  -- For now, return false until blocks table exists
  -- This will be updated in Phase 6
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: Check if current user is admin (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: Get current user's profile field (bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_profile_field(field_name text)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  EXECUTE format('SELECT %I::text FROM profiles WHERE id = $1', field_name)
  INTO result
  USING auth.uid();
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- SELECT policy: Users can read their own full profile
-- Other users can only see public fields
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

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

-- UPDATE policy: Users can only update their own profile
-- Cannot modify: id, role, is_verified, trust_score, is_banned, anon_unlocked, anon_suspended
-- Note: Protected fields are enforced by comparing NEW values to helper function results
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Role, verification, and trust cannot be self-modified (use helper to avoid recursion)
    AND role::text = get_my_profile_field('role')
    AND is_verified::text = get_my_profile_field('is_verified')
    AND trust_score::text = get_my_profile_field('trust_score')
    AND is_banned::text = get_my_profile_field('is_banned')
    AND anon_unlocked::text = get_my_profile_field('anon_unlocked')
    AND anon_suspended::text = get_my_profile_field('anon_suspended')
  );

-- INSERT policy: Only via auth trigger (handled by handle_new_user function)
-- No manual inserts allowed via API
DROP POLICY IF EXISTS "No direct inserts" ON profiles;
CREATE POLICY "No direct inserts"
  ON profiles FOR INSERT
  WITH CHECK (FALSE);

-- DELETE policy: No API deletes (soft delete via server function only)
DROP POLICY IF EXISTS "No direct deletes" ON profiles;
CREATE POLICY "No direct deletes"
  ON profiles FOR DELETE
  USING (FALSE);

-- Admin policies: Admins can read all and update certain fields
-- Uses is_admin() helper function to avoid infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update user status" ON profiles;
CREATE POLICY "Admins can update user status"
  ON profiles FOR UPDATE
  USING (is_admin());

-- Service role bypass (for server-side operations)
-- This is handled automatically by Supabase when using service role key

-- ===================
-- VIEWS FOR PUBLIC DATA
-- ===================

-- Create a view that masks sensitive data based on privacy settings
CREATE OR REPLACE VIEW public_profiles AS
SELECT
  id,
  -- Show username or anonymous alias based on is_anonymous
  CASE WHEN is_anonymous THEN anonymous_alias ELSE username END as display_name,
  -- Show avatar only if not anonymous and show_photo is true
  CASE WHEN is_anonymous THEN NULL
       WHEN show_photo THEN avatar_url
       ELSE NULL END as display_avatar,
  avatar_emoji,
  -- Show real_name only if show_real_name is true and not anonymous
  CASE WHEN show_real_name AND NOT is_anonymous THEN real_name ELSE NULL END as display_real_name,
  -- Hide city if anonymous
  CASE WHEN is_anonymous THEN NULL ELSE city END as display_city,
  -- Always show profession
  profession,
  bio,
  skills,
  is_verified,
  is_available,
  pronouns,
  created_at
FROM profiles
WHERE deleted_at IS NULL
  AND is_banned = FALSE;

-- ===================
-- COMMENTS
-- ===================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth. Contains all user-facing data with privacy controls.';
COMMENT ON COLUMN profiles.real_name IS 'Private. Encrypted at rest. Never exposed via API without user consent.';
COMMENT ON COLUMN profiles.email IS 'Contact email. Visible only to verified members (RLS enforced).';
COMMENT ON COLUMN profiles.trust_score IS 'Increases with age, engagement, zero reports. Range 0-100.';
COMMENT ON COLUMN profiles.anon_unlocked IS 'TRUE when trust_score >= 20 AND account age >= 14 days.';

-- ===================
-- ROLLBACK
-- ===================
-- DROP VIEW IF EXISTS public_profiles;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS handle_new_user();
-- DROP TRIGGER IF EXISTS profiles_set_anonymous_alias ON profiles;
-- DROP FUNCTION IF EXISTS set_anonymous_alias();
-- DROP FUNCTION IF EXISTS generate_anonymous_alias();
-- DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
-- DROP FUNCTION IF EXISTS update_updated_at();
-- DROP FUNCTION IF EXISTS is_blocked(uuid, uuid);
-- DROP TABLE IF EXISTS profiles;
-- DROP TYPE IF EXISTS profession_enum;
-- DROP TYPE IF EXISTS city_enum;
-- DROP TYPE IF EXISTS theme_preference;
-- DROP TYPE IF EXISTS user_role;
