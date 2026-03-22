-- Phase 5: Chat & Realtime Migration
-- Create conversations, conversation_members, messages tables with RLS

-- ============================================
-- ENUMS
-- ============================================

-- Conversation type enum
CREATE TYPE conversation_type AS ENUM ('dm', 'group');

-- Conversation member role enum
CREATE TYPE conversation_role AS ENUM ('member', 'admin');

-- DM request status
CREATE TYPE dm_request_status AS ENUM ('pending', 'accepted', 'declined');

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type conversation_type NOT NULL,
  name TEXT CHECK (char_length(name) <= 100),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX idx_conversations_community_id ON conversations(community_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- ============================================
-- CONVERSATION_MEMBERS TABLE
-- ============================================

CREATE TABLE conversation_members (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role conversation_role NOT NULL DEFAULT 'member',
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- For DM acceptance flow
  dm_status dm_request_status DEFAULT 'accepted',
  PRIMARY KEY (conversation_id, user_id)
);

-- Indexes for conversation members
CREATE INDEX idx_conversation_members_user_id ON conversation_members(user_id);
CREATE INDEX idx_conversation_members_dm_status ON conversation_members(dm_status);

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT CHECK (char_length(content) <= 4000),
  image_url TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- ============================================
-- ANONYMOUS MESSAGE TRACKING
-- ============================================

CREATE TABLE anonymous_message_counts (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  message_count INTEGER NOT NULL DEFAULT 0,
  reset_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update conversation.updated_at when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Reset anonymous message count daily
CREATE OR REPLACE FUNCTION check_anonymous_message_limit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_reset_date DATE;
BEGIN
  -- Get current count
  SELECT message_count, reset_date INTO v_count, v_reset_date
  FROM anonymous_message_counts
  WHERE user_id = p_user_id;

  -- If no record or date is old, reset
  IF v_count IS NULL OR v_reset_date < CURRENT_DATE THEN
    INSERT INTO anonymous_message_counts (user_id, message_count, reset_date)
    VALUES (p_user_id, 0, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE
    SET message_count = 0, reset_date = CURRENT_DATE;
    RETURN 20; -- Full limit available
  END IF;

  RETURN 20 - v_count; -- Remaining messages
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment anonymous message count
CREATE OR REPLACE FUNCTION increment_anonymous_message_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO anonymous_message_counts (user_id, message_count, reset_date)
  VALUES (p_user_id, 1, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
  SET message_count = anonymous_message_counts.message_count + 1,
      reset_date = CASE
        WHEN anonymous_message_counts.reset_date < CURRENT_DATE THEN CURRENT_DATE
        ELSE anonymous_message_counts.reset_date
      END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get or create DM conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_dm(p_user1 UUID, p_user2 UUID)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Check if DM already exists
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = p_user1
  JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = p_user2
  WHERE c.type = 'dm';

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Create new DM conversation
  INSERT INTO conversations (type)
  VALUES ('dm')
  RETURNING id INTO v_conversation_id;

  -- Add both users (initiator is accepted, recipient is pending)
  INSERT INTO conversation_members (conversation_id, user_id, dm_status)
  VALUES
    (v_conversation_id, p_user1, 'accepted'),
    (v_conversation_id, p_user2, 'pending');

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- ============================================

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

-- ============================================
-- RLS POLICIES - CONVERSATIONS
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they're a member of (uses helper to avoid recursion)
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (is_conversation_member(id));

-- Users can create conversations
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update their group conversations (uses helper to avoid recursion)
DROP POLICY IF EXISTS "Admins can update group conversations" ON conversations;
CREATE POLICY "Admins can update group conversations"
ON conversations FOR UPDATE
USING (type = 'group' AND is_conversation_admin(id));

-- ============================================
-- RLS POLICIES - CONVERSATION_MEMBERS
-- ============================================

ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of conversations they're in (uses helper to avoid recursion)
DROP POLICY IF EXISTS "Users can view conversation members" ON conversation_members;
CREATE POLICY "Users can view conversation members"
ON conversation_members FOR SELECT
USING (is_conversation_member(conversation_id));

-- Users can be added to conversations (uses helper for admin check)
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

-- Users can update their own membership (mute, last_read_at, dm_status)
DROP POLICY IF EXISTS "Users can update own membership" ON conversation_members;
CREATE POLICY "Users can update own membership"
ON conversation_members FOR UPDATE
USING (user_id = auth.uid());

-- Users can leave conversations
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_members;
CREATE POLICY "Users can leave conversations"
ON conversation_members FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES - MESSAGES
-- ============================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their conversations (uses helper to avoid recursion)
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  is_conversation_member(conversation_id)
  AND NOT is_blocked(auth.uid(), sender_id)
);

-- Users can send messages to conversations they're in (uses helper to avoid recursion)
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

-- ============================================
-- RLS POLICIES - ANONYMOUS MESSAGE COUNTS
-- ============================================

ALTER TABLE anonymous_message_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own message count"
ON anonymous_message_counts FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own message count"
ON anonymous_message_counts FOR ALL
USING (user_id = auth.uid());

-- ============================================
-- ENABLE REALTIME
-- ============================================

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- STORAGE BUCKET FOR CHAT IMAGES
-- ============================================

-- Note: Create via Supabase Dashboard or API:
-- Bucket: chat-images
-- Public: false (requires auth)
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- Max file size: 5MB

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_members TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON anonymous_message_counts TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_dm TO authenticated;
GRANT EXECUTE ON FUNCTION check_anonymous_message_limit TO authenticated;
GRANT EXECUTE ON FUNCTION increment_anonymous_message_count TO authenticated;
