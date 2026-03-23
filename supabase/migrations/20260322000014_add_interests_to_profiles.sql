-- Add interests column to profiles for hobbies and interests tags
-- Users can select from predefined interests or add custom ones

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Add index for searching by interests
CREATE INDEX IF NOT EXISTS idx_profiles_interests ON profiles USING GIN (interests);

-- Update the search_vector to include interests
-- This allows full-text search on interests too
DROP TRIGGER IF EXISTS profiles_search_vector_update ON profiles;

CREATE OR REPLACE FUNCTION update_profiles_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.real_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.skills, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.interests, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.profession, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_search_vector_update
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_search_vector();

-- Note: Existing profiles will get their search_vector updated on next manual update
-- We don't force reindex here to avoid issues with existing data
