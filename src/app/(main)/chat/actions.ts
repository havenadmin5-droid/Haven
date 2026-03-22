"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import type { ActionResult, MessageWithSender } from "@/lib/types";

/**
 * Start or get existing DM conversation with another user
 */
export async function startDM(
  otherUserId: string
): Promise<ActionResult & { conversationId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user is anonymous
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_anonymous")
    .eq("id", user.id)
    .single();

  if (profile?.is_anonymous) {
    return { success: false, error: "Anonymous users cannot initiate DMs" };
  }

  // Check if blocked
  const { data: blocked } = await supabase.rpc("is_blocked", {
    user_a: user.id,
    user_b: otherUserId,
  });

  if (blocked) {
    return { success: false, error: "Cannot message this user" };
  }

  const serviceClient = createServiceClient();

  // Check if DM already exists
  const { data: existingConvo } = await serviceClient
    .from("conversations")
    .select(`
      id,
      conversation_members!inner (user_id)
    `)
    .eq("type", "dm")
    .contains("conversation_members.user_id", [user.id, otherUserId]);

  // Find conversation that has both users
  let conversationId: string | null = null;

  if (existingConvo && existingConvo.length > 0) {
    // Check each conversation to find one with exactly these two users
    for (const convo of existingConvo) {
      const { data: members } = await serviceClient
        .from("conversation_members")
        .select("user_id")
        .eq("conversation_id", convo.id);

      if (
        members &&
        members.length === 2 &&
        members.some((m) => m.user_id === user.id) &&
        members.some((m) => m.user_id === otherUserId)
      ) {
        conversationId = convo.id;
        break;
      }
    }
  }

  if (conversationId) {
    return { success: true, conversationId };
  }

  // Create new DM conversation
  const { data: newConvo, error: convoError } = await serviceClient
    .from("conversations")
    .insert({ type: "dm" })
    .select("id")
    .single();

  if (convoError || !newConvo) {
    console.error("Create conversation error:", convoError);
    return { success: false, error: "Failed to create conversation" };
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
    return { success: false, error: "Failed to create conversation" };
  }

  revalidatePath("/chat");
  return { success: true, conversationId: newConvo.id };
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
