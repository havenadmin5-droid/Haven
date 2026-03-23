-- Set REPLICA IDENTITY FULL for realtime tables
-- This is required for filtered realtime subscriptions to work properly

-- Messages table needs FULL replica identity for conversation_id filter
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Conversation members also needs it for user_id filter
ALTER TABLE conversation_members REPLICA IDENTITY FULL;

-- Grant realtime permissions to authenticated users
GRANT SELECT ON messages TO authenticated;
GRANT SELECT ON conversation_members TO authenticated;
