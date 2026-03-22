-- Fix RLS infinite recursion in chat tables (conversations, conversation_members, messages)
-- Creates SECURITY DEFINER helper functions to bypass RLS when checking membership

-- ============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- ============================================================================

-- Check if user is a member of a conversation
CREATE OR REPLACE FUNCTION is_conversation_member(conversation_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = conversation_uuid
    AND user_id = auth.uid()
  );
$$;

-- Check if user is admin of a conversation
CREATE OR REPLACE FUNCTION is_conversation_admin(conversation_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = conversation_uuid
    AND user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_conversation_member TO authenticated;
GRANT EXECUTE ON FUNCTION is_conversation_admin TO authenticated;

-- ============================================================================
-- FIX CONVERSATIONS POLICIES
-- ============================================================================

-- Users can view conversations they're members of (uses helper)
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (is_conversation_member(id));

-- Users can create conversations
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update their group conversations (uses helper)
DROP POLICY IF EXISTS "Admins can update group conversations" ON conversations;
CREATE POLICY "Admins can update group conversations"
ON conversations FOR UPDATE
USING (type = 'group' AND is_conversation_admin(id));

-- ============================================================================
-- FIX CONVERSATION_MEMBERS POLICIES
-- ============================================================================

-- Users can view members of conversations they're in (uses helper)
DROP POLICY IF EXISTS "Users can view conversation members" ON conversation_members;
CREATE POLICY "Users can view conversation members"
ON conversation_members FOR SELECT
USING (is_conversation_member(conversation_id));

-- Users can join conversations (simplified - uses helper for admin check)
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_members;
CREATE POLICY "Users can join conversations"
ON conversation_members FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid() -- Adding self
    OR is_conversation_admin(conversation_id) -- Admin adding others
  )
);

-- Users can update their own membership
DROP POLICY IF EXISTS "Users can update own membership" ON conversation_members;
CREATE POLICY "Users can update own membership"
ON conversation_members FOR UPDATE
USING (user_id = auth.uid());

-- Users can leave conversations
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_members;
CREATE POLICY "Users can leave conversations"
ON conversation_members FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- FIX MESSAGES POLICIES
-- ============================================================================

-- Users can view messages in their conversations (uses helper)
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  is_conversation_member(conversation_id)
  AND NOT is_blocked(auth.uid(), sender_id)
);

-- Users can send messages to conversations they're in (uses helper)
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND is_conversation_member(conversation_id)
);

-- Users can delete their own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
USING (sender_id = auth.uid());
