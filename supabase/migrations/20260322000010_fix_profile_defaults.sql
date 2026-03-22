-- Fix profile creation issue
-- The city and profession columns are NOT NULL but the auth trigger doesn't provide them
-- Adding defaults so profile creation works on signup

-- Add default values for required enum columns
ALTER TABLE profiles ALTER COLUMN city SET DEFAULT 'Other'::city_enum;
ALTER TABLE profiles ALTER COLUMN profession SET DEFAULT 'Other'::profession_enum;

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, city, profession)
  VALUES (
    NEW.id,
    NEW.email,
    'user_' || substr(NEW.id::text, 1, 8),
    'Other'::city_enum,
    'Other'::profession_enum
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail auth
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
