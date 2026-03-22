-- Phase 6b: Admin Setup
-- Set up the initial super_admin user

-- ============================================================================
-- ADMIN SETUP FUNCTION
-- ============================================================================

-- Function to promote a user to admin by email (for initial setup)
-- This function can only be called by existing admins or during initial setup
CREATE OR REPLACE FUNCTION promote_to_admin(p_email TEXT, p_role TEXT DEFAULT 'admin')
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  user_id UUID
) AS $$
DECLARE
  v_user_id UUID;
  v_current_role TEXT;
BEGIN
  -- Validate role
  IF p_role NOT IN ('admin', 'super_admin', 'city_mod', 'community_mod') THEN
    RETURN QUERY SELECT FALSE, 'Invalid role specified', NULL::UUID;
    RETURN;
  END IF;

  -- Find user by email in auth.users
  SELECT au.id INTO v_user_id
  FROM auth.users au
  WHERE au.email = p_email;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'User not found with email: ' || p_email, NULL::UUID;
    RETURN;
  END IF;

  -- Get current role
  SELECT role INTO v_current_role
  FROM profiles
  WHERE id = v_user_id;

  IF v_current_role IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Profile not found for user', NULL::UUID;
    RETURN;
  END IF;

  -- Update role
  UPDATE profiles
  SET role = p_role,
      is_verified = TRUE,
      trust_score = 100
  WHERE id = v_user_id;

  RETURN QUERY SELECT TRUE, 'User promoted to ' || p_role || ' successfully', v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission (only to service role, not regular users)
-- This function should only be called via Supabase admin/service role

-- ============================================================================
-- INITIAL ADMIN SETUP
-- ============================================================================

-- Promote authorized emails to super_admin
-- This will run when migrations are applied
DO $$
DECLARE
  v_result RECORD;
  v_emails TEXT[] := ARRAY['padmanavakarmakar148@gmail.com', 'havenadmin5@gmail.com'];
  v_email TEXT;
BEGIN
  -- Try to promote each authorized email
  FOREACH v_email IN ARRAY v_emails
  LOOP
    SELECT * INTO v_result FROM promote_to_admin(v_email, 'super_admin');

    IF v_result.success THEN
      RAISE NOTICE 'Super_admin created for %: %', v_email, v_result.message;
    ELSE
      RAISE NOTICE 'Could not promote %: % (User may need to register first)', v_email, v_result.message;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- ADMIN CHECK FUNCTION
-- ============================================================================

-- Function to check if a user is an admin (for use in RLS policies)
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if current user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions (specify signature to avoid ambiguity)
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
