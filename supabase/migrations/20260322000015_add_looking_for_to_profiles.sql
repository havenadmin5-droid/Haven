-- Add "looking_for" column to profiles
-- Helps users indicate what kind of connections they're seeking

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS looking_for TEXT[] DEFAULT '{}';

-- Add index for filtering by looking_for
CREATE INDEX IF NOT EXISTS idx_profiles_looking_for ON profiles USING GIN (looking_for);
