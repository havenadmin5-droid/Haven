-- Fix RLS infinite recursion in profiles table
-- The original policies queried the profiles table within SELECT/UPDATE policies,
-- causing infinite recursion. This fix uses SECURITY DEFINER functions to bypass RLS.

-- Helper function: Check if current user is admin (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  RETURN v_role IN ('admin', 'super_admin');
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

-- Fix UPDATE policy: Use helper function instead of subqueries
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

-- Fix admin SELECT policy: Use is_admin() helper
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Fix admin UPDATE policy: Use is_admin() helper
DROP POLICY IF EXISTS "Admins can update user status" ON profiles;
CREATE POLICY "Admins can update user status"
  ON profiles FOR UPDATE
  USING (is_admin());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_profile_field TO authenticated;
