"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import type { ActionResult, EventWithHost, EventCategory, City, RSVPStatus } from "@/lib/types";

/**
 * Create a new event
 */
export async function createEvent(
  formData: FormData
): Promise<ActionResult & { event?: EventWithHost }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_anonymous, is_banned, username, avatar_emoji, avatar_url, show_photo, is_verified")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { success: false, error: "Profile not found" };
  }

  if (profile.is_banned) {
    return { success: false, error: "Your account has been suspended" };
  }

  // Anonymous users cannot create events
  if (profile.is_anonymous) {
    return { success: false, error: "Anonymous users cannot create events. Please disable anonymous mode first." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const city = formData.get("city") as City;
  const venueName = formData.get("venue_name") as string | null;
  const venueAddress = formData.get("venue_address") as string | null;
  const eventDate = formData.get("event_date") as string;
  const eventTime = formData.get("event_time") as string;
  const endTime = formData.get("end_time") as string | null;
  const category = formData.get("category") as EventCategory;
  const isPrivate = formData.get("is_private") === "true";
  const capacityStr = formData.get("capacity") as string | null;
  const capacity = capacityStr ? parseInt(capacityStr, 10) : null;
  const coverUrl = formData.get("cover_url") as string | null;
  const emoji = formData.get("emoji") as string || "🎉";
  const communityId = formData.get("community_id") as string | null;

  // Validate required fields
  if (!title?.trim()) {
    return { success: false, error: "Title is required" };
  }
  if (title.length > 120) {
    return { success: false, error: "Title must be 120 characters or less" };
  }
  if (!description?.trim()) {
    return { success: false, error: "Description is required" };
  }
  if (description.length > 2000) {
    return { success: false, error: "Description must be 2000 characters or less" };
  }
  if (!city) {
    return { success: false, error: "City is required" };
  }
  if (!eventDate) {
    return { success: false, error: "Date is required" };
  }
  if (!eventTime) {
    return { success: false, error: "Time is required" };
  }
  if (!category) {
    return { success: false, error: "Category is required" };
  }

  // Validate capacity
  if (capacity !== null && (capacity < 1 || capacity > 10000)) {
    return { success: false, error: "Capacity must be between 1 and 10,000" };
  }

  const serviceClient = createServiceClient();

  // Create event
  const { data: event, error } = await serviceClient
    .from("events")
    .insert({
      host_id: user.id,
      title: title.trim(),
      description: description.trim(),
      city,
      venue_name: venueName?.trim() || null,
      venue_address: venueAddress?.trim() || null,
      event_date: eventDate,
      event_time: eventTime,
      end_time: endTime || null,
      category,
      is_private: isPrivate,
      capacity,
      cover_url: coverUrl,
      emoji,
      community_id: communityId || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Create event error:", error);
    return { success: false, error: "Failed to create event" };
  }

  // Build response with host info
  const eventWithHost: EventWithHost = {
    ...event,
    host: {
      id: user.id,
      username: profile.username,
      avatar_emoji: profile.avatar_emoji,
      avatar_url: profile.avatar_url,
      show_photo: profile.show_photo,
      is_anonymous: false,
      is_verified: profile.is_verified,
    },
    user_rsvp: null,
  };

  revalidatePath("/events");

  return { success: true, event: eventWithHost };
}

/**
 * RSVP to an event
 */
export async function rsvpToEvent(
  eventId: string,
  status: RSVPStatus = "going"
): Promise<ActionResult & { status?: RSVPStatus; waitlisted?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_anonymous")
    .eq("id", user.id)
    .single();

  // Get event details
  const { data: event } = await supabase
    .from("events")
    .select("id, is_private, capacity, attendee_count")
    .eq("id", eventId)
    .single();

  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // Anonymous users cannot RSVP to private events
  if (profile?.is_anonymous && event.is_private) {
    return { success: false, error: "Anonymous users cannot RSVP to private events" };
  }

  const serviceClient = createServiceClient();

  // Check if already RSVPed
  const { data: existingRsvp } = await serviceClient
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single();

  if (existingRsvp) {
    // Update existing RSVP
    if (status === existingRsvp.status) {
      // Same status, do nothing
      return { success: true, status };
    }

    const { error } = await serviceClient
      .from("event_rsvps")
      .update({ status })
      .eq("event_id", eventId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Update RSVP error:", error);
      return { success: false, error: "Failed to update RSVP" };
    }

    revalidatePath(`/events/${eventId}`);
    return { success: true, status };
  }

  // New RSVP - check capacity
  let finalStatus: RSVPStatus = status;
  let waitlisted = false;

  if (status === "going" && event.capacity !== null) {
    if (event.attendee_count >= event.capacity) {
      // Event is full, add to waitlist
      finalStatus = "waitlisted";
      waitlisted = true;
    }
  }

  const { error } = await serviceClient
    .from("event_rsvps")
    .insert({
      event_id: eventId,
      user_id: user.id,
      status: finalStatus,
    });

  if (error) {
    console.error("RSVP error:", error);
    return { success: false, error: "Failed to RSVP" };
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);

  return { success: true, status: finalStatus, waitlisted };
}

/**
 * Cancel RSVP
 */
export async function cancelRsvp(eventId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Cancel RSVP error:", error);
    return { success: false, error: "Failed to cancel RSVP" };
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);

  return { success: true };
}

/**
 * Delete an event (host only)
 */
export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify ownership
  const { data: event } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (!event) {
    return { success: false, error: "Event not found" };
  }

  if (event.host_id !== user.id) {
    return { success: false, error: "You can only delete your own events" };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("events")
    .delete()
    .eq("id", eventId);

  if (error) {
    console.error("Delete event error:", error);
    return { success: false, error: "Failed to delete event" };
  }

  revalidatePath("/events");
  return { success: true };
}
