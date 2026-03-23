-- Repair migration to ensure interests and looking_for columns exist
-- This handles the case where migration 14 failed midway

-- Add interests column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'interests'
  ) THEN
    ALTER TABLE profiles ADD COLUMN interests TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Add looking_for column if it doesn't exist (should already exist from migration 15)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'looking_for'
  ) THEN
    ALTER TABLE profiles ADD COLUMN looking_for TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_interests ON profiles USING GIN (interests);
CREATE INDEX IF NOT EXISTS idx_profiles_looking_for ON profiles USING GIN (looking_for);

-- Ensure existing profiles have empty arrays instead of NULL
UPDATE profiles SET interests = '{}' WHERE interests IS NULL;
UPDATE profiles SET looking_for = '{}' WHERE looking_for IS NULL;
