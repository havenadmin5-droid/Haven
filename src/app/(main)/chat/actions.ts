"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import type { ActionResult, MessageWithSender } from "@/lib/types";

/**
 * Start or get existing DM conversation with another user.
 *
 * Flow:
 * 1. Validate user is authenticated and not anonymous
 * 2. Check if blocked
 * 3. Check if other user exists
 * 4. Find or create DM conversation
 * 5. Return conversation ID
 */
export async function startDM(
  otherUserId: string
): Promise<ActionResult & { conversationId?: string; isNew?: boolean }> {
  // Validate input
  if (!otherUserId) {
    return { success: false, error: "Invalid user ID" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Can't message yourself
  if (user.id === otherUserId) {
    return { success: false, error: "You can't message yourself" };
  }

  const serviceClient = createServiceClient();

  // Check if current user is anonymous
  const { data: myProfile } = await serviceClient
    .from("profiles")
    .select("is_anonymous, is_banned")
    .eq("id", user.id)
    .single();

  if (myProfile?.is_anonymous) {
    return { success: false, error: "Disable anonymous mode to send messages" };
  }

  if (myProfile?.is_banned) {
    return { success: false, error: "Your account is restricted" };
  }

  // Check if other user exists and is not banned
  const { data: otherProfile, error: profileError } = await serviceClient
    .from("profiles")
    .select("id, is_banned, deleted_at")
    .eq("id", otherUserId)
    .single();

  if (profileError || !otherProfile) {
    return { success: false, error: "User not found" };
  }

  if (otherProfile.is_banned || otherProfile.deleted_at) {
    return { success: false, error: "This user is not available" };
  }

  // Check if either user has blocked the other
  const { data: blocked } = await serviceClient.rpc("is_blocked", {
    user_a: user.id,
    user_b: otherUserId,
  });

  if (blocked) {
    return { success: false, error: "Cannot message this user" };
  }

  // Find existing DM between these two users
  // First, get all DM conversation IDs where current user is a member
  const { data: myConvos } = await serviceClient
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", user.id);

  const myConvoIds = myConvos?.map(c => c.conversation_id) ?? [];

  if (myConvoIds.length > 0) {
    // Find conversations where other user is also a member AND it's a DM
    const { data: sharedConvos } = await serviceClient
      .from("conversation_members")
      .select(`
        conversation_id,
        conversations!inner (id, type)
      `)
      .eq("user_id", otherUserId)
      .in("conversation_id", myConvoIds);

    // Find the DM conversation (type = 'dm')
    const existingDM = sharedConvos?.find(
      (c: { conversations: { type: string } }) => c.conversations?.type === "dm"
    );

    if (existingDM) {
      return { success: true, conversationId: existingDM.conversation_id, isNew: false };
    }
  }

  // Create new DM conversation
  const { data: newConvo, error: convoError } = await serviceClient
    .from("conversations")
    .insert({ type: "dm" })
    .select("id")
    .single();

  if (convoError || !newConvo) {
    console.error("Create conversation error:", convoError);
    return { success: false, error: "Failed to start conversation" };
  }

  // Add both users - initiator is accepted, recipient is pending
  const { error: membersError } = await serviceClient
    .from("conversation_members")
    .insert([
      { conversation_id: newConvo.id, user_id: user.id, dm_status: "accepted" },
      { conversation_id: newConvo.id, user_id: otherUserId, dm_status: "pending" },
    ]);

  if (membersError) {
    console.error("Add members error:", membersError);
    // Clean up the conversation we just created
    await serviceClient.from("conversations").delete().eq("id", newConvo.id);
    return { success: false, error: "Failed to start conversation" };
  }

  revalidatePath("/chat");
  return { success: true, conversationId: newConvo.id, isNew: true };
}

/**
 * Accept a DM request
 */
export async function acceptDM(conversationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("conversation_members")
    .update({ dm_status: "accepted" })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Accept DM error:", error);
    return { success: false, error: "Failed to accept message request" };
  }

  revalidatePath("/chat");
  return { success: true };
}

/**
 * Decline a DM request
 */
export async function declineDM(conversationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  // Update status to declined
  const { error } = await serviceClient
    .from("conversation_members")
    .update({ dm_status: "declined" })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Decline DM error:", error);
    return { success: false, error: "Failed to decline message request" };
  }

  revalidatePath("/chat");
  return { success: true };
}

/**
 * Send a message
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  imageUrl?: string
): Promise<ActionResult & { message?: MessageWithSender }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate content
  if (!content?.trim() && !imageUrl) {
    return { success: false, error: "Message cannot be empty" };
  }

  if (content && content.length > 4000) {
    return { success: false, error: "Message too long (max 4000 characters)" };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_anonymous, username, avatar_emoji, avatar_url, show_photo, anonymous_alias")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { success: false, error: "Profile not found" };
  }

  const serviceClient = createServiceClient();

  // Check if user is a member of this conversation
  const { data: membership } = await serviceClient
    .from("conversation_members")
    .select("dm_status")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { success: false, error: "You are not a member of this conversation" };
  }

  // For DMs, check if both parties have accepted
  const { data: conversation } = await serviceClient
    .from("conversations")
    .select("type")
    .eq("id", conversationId)
    .single();

  if (conversation?.type === "dm") {
    // Check if recipient has accepted (for new messages from initiator)
    const { data: _otherMember } = await serviceClient
      .from("conversation_members")
      .select("dm_status")
      .eq("conversation_id", conversationId)
      .neq("user_id", user.id)
      .single();

    // Initiator can send even if pending, but check if they're the initiator
    if (membership.dm_status === "pending") {
      return { success: false, error: "Please accept the message request first" };
    }
  }

  // Check anonymous message limit
  if (profile.is_anonymous) {
    const { data: remaining } = await serviceClient.rpc("check_anonymous_message_limit", {
      p_user_id: user.id,
    });

    if (remaining !== null && remaining <= 0) {
      return {
        success: false,
        error: "Daily message limit reached (20 messages while anonymous)",
      };
    }

    // Increment count
    await serviceClient.rpc("increment_anonymous_message_count", {
      p_user_id: user.id,
    });
  }

  // Send message
  const { data: message, error } = await serviceClient
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content?.trim() || null,
      image_url: imageUrl || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Send message error:", error);
    return { success: false, error: "Failed to send message" };
  }

  // Build response with sender info
  const messageWithSender: MessageWithSender = {
    ...message,
    sender: {
      id: user.id,
      username: profile.username,
      avatar_emoji: profile.avatar_emoji,
      avatar_url: profile.avatar_url,
      show_photo: profile.show_photo,
      is_anonymous: profile.is_anonymous,
      anonymous_alias: profile.anonymous_alias,
    },
  };

  return { success: true, message: messageWithSender };
}

/**
 * Mark conversation as read
 */
export async function markConversationRead(conversationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Mark read error:", error);
    return { success: false, error: "Failed to mark as read" };
  }

  return { success: true };
}

/**
 * Toggle mute for a conversation
 */
export async function toggleMuteConversation(
  conversationId: string
): Promise<ActionResult & { muted?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  // Get current mute status
  const { data: membership } = await serviceClient
    .from("conversation_members")
    .select("is_muted")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { success: false, error: "Not a member of this conversation" };
  }

  const newMuted = !membership.is_muted;

  const { error } = await serviceClient
    .from("conversation_members")
    .update({ is_muted: newMuted })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Toggle mute error:", error);
    return { success: false, error: "Failed to update mute status" };
  }

  return { success: true, muted: newMuted };
}

/**
 * Create a group chat
 */
export async function createGroupChat(
  name: string,
  memberIds: string[]
): Promise<ActionResult & { conversationId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!name?.trim()) {
    return { success: false, error: "Group name is required" };
  }

  if (name.length > 100) {
    return { success: false, error: "Group name too long (max 100 characters)" };
  }

  if (memberIds.length === 0) {
    return { success: false, error: "Please add at least one member" };
  }

  const serviceClient = createServiceClient();

  // Create group conversation
  const { data: convo, error: convoError } = await serviceClient
    .from("conversations")
    .insert({
      type: "group",
      name: name.trim(),
    })
    .select("id")
    .single();

  if (convoError || !convo) {
    console.error("Create group error:", convoError);
    return { success: false, error: "Failed to create group" };
  }

  // Add creator as admin
  const members = [
    { conversation_id: convo.id, user_id: user.id, role: "admin", dm_status: "accepted" },
    ...memberIds.map((id) => ({
      conversation_id: convo.id,
      user_id: id,
      role: "member",
      dm_status: "accepted",
    })),
  ];

  const { error: membersError } = await serviceClient
    .from("conversation_members")
    .insert(members);

  if (membersError) {
    console.error("Add group members error:", membersError);
    return { success: false, error: "Failed to add members" };
  }

  // Send system message
  await serviceClient.from("messages").insert({
    conversation_id: convo.id,
    sender_id: user.id,
    content: "created this group",
    is_system: true,
  });

  revalidatePath("/chat");
  return { success: true, conversationId: convo.id };
}

/**
 * Leave a group chat
 */
export async function leaveGroupChat(conversationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  // Verify it's a group chat
  const { data: convo } = await serviceClient
    .from("conversations")
    .select("type")
    .eq("id", conversationId)
    .single();

  if (convo?.type !== "group") {
    return { success: false, error: "Cannot leave a DM" };
  }

  // Remove membership
  const { error } = await serviceClient
    .from("conversation_members")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Leave group error:", error);
    return { success: false, error: "Failed to leave group" };
  }

  // Send system message
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  await serviceClient.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: `${profile?.username ?? "Someone"} left the group`,
    is_system: true,
  });

  revalidatePath("/chat");
  return { success: true };
}

/**
 * Get a user's profile for chat context.
 * Uses service client to bypass RLS for reliable fetching.
 */
export async function getChatProfile(
  userId: string
): Promise<{ success: boolean; profile?: { id: string; username: string; avatar_emoji: string; avatar_url: string | null; show_photo: boolean; is_anonymous: boolean; anonymous_alias: string | null }; error?: string }> {
  if (!userId) {
    return { success: false, error: "Invalid user ID" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from("profiles")
    .select("id, username, avatar_emoji, avatar_url, show_photo, is_anonymous, anonymous_alias, deleted_at, is_banned")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { success: false, error: "User not found" };
  }

  if (data.deleted_at || data.is_banned) {
    return { success: false, error: "User not available" };
  }

  return {
    success: true,
    profile: {
      id: data.id,
      username: data.username,
      avatar_emoji: data.avatar_emoji,
      avatar_url: data.avatar_url,
      show_photo: data.show_photo,
      is_anonymous: data.is_anonymous,
      anonymous_alias: data.anonymous_alias,
    },
  };
}

/**
 * Load all conversations for the current user.
 * Includes other participant info, last message, and unread count.
 */
export async function loadConversations(): Promise<{
  success: boolean;
  conversations?: Array<{
    id: string;
    type: "dm" | "group";
    name: string | null;
    dm_status: string;
    other_dm_status?: string;
    is_muted: boolean;
    last_read_at: string | null;
    other_user?: {
      id: string;
      username: string;
      avatar_emoji: string;
      avatar_url: string | null;
      show_photo: boolean;
      is_anonymous: boolean;
      anonymous_alias: string | null;
    };
    last_message?: {
      content: string | null;
      created_at: string;
      sender_id: string;
      is_system: boolean;
    };
    unread_count: number;
  }>;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  // Get all conversations where user is a member
  const { data: memberships, error: membershipError } = await serviceClient
    .from("conversation_members")
    .select(`
      conversation_id,
      dm_status,
      is_muted,
      last_read_at,
      conversations (
        id,
        type,
        name,
        updated_at
      )
    `)
    .eq("user_id", user.id)
    .neq("dm_status", "declined");

  if (membershipError) {
    console.error("Load conversations error:", membershipError);
    return { success: false, error: "Failed to load conversations" };
  }

  if (!memberships || memberships.length === 0) {
    return { success: true, conversations: [] };
  }

  const conversationIds = memberships.map(m => m.conversation_id);

  // Get all members for these conversations (to find other users in DMs)
  const { data: allMembers } = await serviceClient
    .from("conversation_members")
    .select("conversation_id, user_id, dm_status")
    .in("conversation_id", conversationIds);

  // Get profiles for other members
  const otherUserIds = [...new Set(
    allMembers?.filter(m => m.user_id !== user.id).map(m => m.user_id) ?? []
  )];

  const { data: profiles } = await serviceClient
    .from("profiles")
    .select("id, username, avatar_emoji, avatar_url, show_photo, is_anonymous, anonymous_alias")
    .in("id", otherUserIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);

  // Get last message for each conversation
  const { data: lastMessages } = await serviceClient
    .from("messages")
    .select("conversation_id, content, created_at, sender_id, is_system")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  // Group last messages by conversation (take first one = most recent)
  const lastMessageMap = new Map<string, typeof lastMessages extends (infer T)[] ? T : never>();
  lastMessages?.forEach(msg => {
    if (!lastMessageMap.has(msg.conversation_id)) {
      lastMessageMap.set(msg.conversation_id, msg);
    }
  });

  // Build conversation list
  const conversations = memberships.map(membership => {
    const convo = membership.conversations as { id: string; type: "dm" | "group"; name: string | null; updated_at: string };

    // For DMs, find the other user
    let otherUser;
    let otherDmStatus: string | undefined;
    if (convo.type === "dm") {
      const otherMember = allMembers?.find(
        m => m.conversation_id === membership.conversation_id && m.user_id !== user.id
      );
      if (otherMember) {
        otherUser = profileMap.get(otherMember.user_id);
        otherDmStatus = otherMember.dm_status;
      }
    }

    const lastMessage = lastMessageMap.get(membership.conversation_id);

    // Calculate unread count
    let unreadCount = 0;
    if (membership.last_read_at && lastMessages) {
      unreadCount = lastMessages.filter(
        m => m.conversation_id === membership.conversation_id &&
             m.created_at > membership.last_read_at! &&
             m.sender_id !== user.id
      ).length;
    } else if (!membership.last_read_at && lastMessages) {
      unreadCount = lastMessages.filter(
        m => m.conversation_id === membership.conversation_id &&
             m.sender_id !== user.id
      ).length;
    }

    return {
      id: convo.id,
      type: convo.type,
      name: convo.name,
      dm_status: membership.dm_status,
      other_dm_status: otherDmStatus,
      is_muted: membership.is_muted,
      last_read_at: membership.last_read_at,
      other_user: otherUser ? {
        id: otherUser.id,
        username: otherUser.username,
        avatar_emoji: otherUser.avatar_emoji,
        avatar_url: otherUser.avatar_url,
        show_photo: otherUser.show_photo,
        is_anonymous: otherUser.is_anonymous,
        anonymous_alias: otherUser.anonymous_alias,
      } : undefined,
      last_message: lastMessage ? {
        content: lastMessage.content,
        created_at: lastMessage.created_at,
        sender_id: lastMessage.sender_id,
        is_system: lastMessage.is_system,
      } : undefined,
      unread_count: unreadCount,
    };
  });

  // Sort by last message time (most recent first)
  conversations.sort((a, b) => {
    const aTime = a.last_message?.created_at ?? "0";
    const bTime = b.last_message?.created_at ?? "0";
    return bTime.localeCompare(aTime);
  });

  return { success: true, conversations };
}

/**
 * Get pending message requests count for badge display
 */
export async function getPendingRequestsCount(): Promise<{ success: boolean; count?: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  const { count, error } = await serviceClient
    .from("conversation_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("dm_status", "pending");

  if (error) {
    console.error("Get pending requests error:", error);
    return { success: false, error: "Failed to get pending requests" };
  }

  return { success: true, count: count ?? 0 };
}
