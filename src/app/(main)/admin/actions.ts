"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import type { ActionResult, AdminAction, AuditTargetType } from "@/lib/types";

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" || profile?.role === "super_admin";
}

/**
 * Get dashboard stats
 */
export async function getDashboardStats(): Promise<{
  success: boolean;
  stats?: {
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalCommunities: number;
    pendingReports: number;
    bannedUsers: number;
  };
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  // Check admin role
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return { success: false, error: "Not authorized" };
  }

  // Fetch stats in parallel
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: totalPosts },
    { count: totalCommunities },
    { count: pendingReports },
    { count: bannedUsers },
  ] = await Promise.all([
    serviceClient.from("profiles").select("*", { count: "exact", head: true }),
    serviceClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("is_banned", false),
    serviceClient.from("posts").select("*", { count: "exact", head: true }),
    serviceClient.from("communities").select("*", { count: "exact", head: true }),
    serviceClient
      .from("reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "reviewing"]),
    serviceClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_banned", true),
  ]);

  return {
    success: true,
    stats: {
      totalUsers: totalUsers ?? 0,
      activeUsers: activeUsers ?? 0,
      totalPosts: totalPosts ?? 0,
      totalCommunities: totalCommunities ?? 0,
      pendingReports: pendingReports ?? 0,
      bannedUsers: bannedUsers ?? 0,
    },
  };
}

/**
 * Get pending reports
 */
export async function getPendingReports(): Promise<{
  success: boolean;
  reports?: Array<{
    id: string;
    reporter_username: string;
    reported_username: string | null;
    reported_content_type: string | null;
    reason: string;
    details: string | null;
    status: string;
    created_at: string;
  }>;
  error?: string;
}> {
  if (!(await isAdmin())) {
    return { success: false, error: "Not authorized" };
  }

  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from("reports")
    .select(`
      id,
      reported_content_type,
      reason,
      details,
      status,
      created_at,
      reporter:profiles!reports_reporter_id_fkey (username),
      reported_user:profiles!reports_reported_user_id_fkey (username, is_anonymous, anonymous_alias)
    `)
    .in("status", ["pending", "reviewing"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Get reports error:", error);
    return { success: false, error: "Failed to fetch reports" };
  }

  return {
    success: true,
    reports: (data ?? []).map((r) => {
      const reporter = Array.isArray(r.reporter) ? r.reporter[0] : r.reporter;
      const reportedUser = r.reported_user
        ? (Array.isArray(r.reported_user) ? r.reported_user[0] : r.reported_user)
        : null;

      return {
        id: r.id,
        reporter_username: reporter?.username ?? "Unknown",
        reported_username: reportedUser
          ? (reportedUser.is_anonymous ? reportedUser.anonymous_alias : reportedUser.username)
          : null,
        reported_content_type: r.reported_content_type,
        reason: r.reason,
        details: r.details,
        status: r.status,
        created_at: r.created_at,
      };
    }),
  };
}

/**
 * Resolve a report
 */
export async function resolveReport(
  reportId: string,
  resolution: "resolved" | "dismissed",
  note?: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin())) {
    return { success: false, error: "Not authorized" };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("reports")
    .update({
      status: resolution,
      resolved_by: user.id,
      resolution_note: note || null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    return { success: false, error: "Failed to resolve report" };
  }

  // Log admin action
  await logAdminAction(
    resolution === "resolved" ? "resolve_report" : "dismiss_report",
    "report",
    reportId,
    note ? { note } : undefined
  );

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Ban a user
 */
export async function banUser(
  userId: string,
  reason: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin())) {
    return { success: false, error: "Not authorized" };
  }

  if (userId === user.id) {
    return { success: false, error: "Cannot ban yourself" };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("profiles")
    .update({
      is_banned: true,
      ban_reason: reason,
    })
    .eq("id", userId);

  if (error) {
    return { success: false, error: "Failed to ban user" };
  }

  await logAdminAction("ban_user", "user", userId, { reason });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Unban a user
 */
export async function unbanUser(userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin())) {
    return { success: false, error: "Not authorized" };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("profiles")
    .update({
      is_banned: false,
      ban_reason: null,
    })
    .eq("id", userId);

  if (error) {
    return { success: false, error: "Failed to unban user" };
  }

  await logAdminAction("unban_user", "user", userId);

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Verify a user
 */
export async function verifyUser(userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin())) {
    return { success: false, error: "Not authorized" };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("profiles")
    .update({ is_verified: true })
    .eq("id", userId);

  if (error) {
    return { success: false, error: "Failed to verify user" };
  }

  await logAdminAction("verify_user", "user", userId);

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Suspend anonymous mode for a user
 */
export async function suspendAnonymous(userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin())) {
    return { success: false, error: "Not authorized" };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("profiles")
    .update({
      is_anonymous: false,
      anon_suspended: true,
      anonymous_alias: null,
    })
    .eq("id", userId);

  if (error) {
    return { success: false, error: "Failed to suspend anonymous mode" };
  }

  await logAdminAction("suspend_anonymous", "user", userId);

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Restore anonymous mode for a user
 */
export async function restoreAnonymous(userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin())) {
    return { success: false, error: "Not authorized" };
  }

  const serviceClient = createServiceClient();

  // Reset anon_suspended and trust score to 15 (below unlock threshold)
  const { error } = await serviceClient
    .from("profiles")
    .update({
      anon_suspended: false,
      trust_score: 15,
    })
    .eq("id", userId);

  if (error) {
    return { success: false, error: "Failed to restore anonymous mode" };
  }

  await logAdminAction("restore_anonymous", "user", userId);

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Delete content (post, comment, etc.)
 */
export async function deleteContent(
  contentType: "post" | "comment" | "event" | "job",
  contentId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin())) {
    return { success: false, error: "Not authorized" };
  }

  const serviceClient = createServiceClient();

  let error;

  switch (contentType) {
    case "post":
      ({ error } = await serviceClient.from("posts").delete().eq("id", contentId));
      break;
    case "comment":
      ({ error } = await serviceClient.from("comments").delete().eq("id", contentId));
      break;
    case "event":
      ({ error } = await serviceClient.from("events").delete().eq("id", contentId));
      break;
    case "job":
      ({ error } = await serviceClient.from("jobs").delete().eq("id", contentId));
      break;
  }

  if (error) {
    return { success: false, error: `Failed to delete ${contentType}` };
  }

  await logAdminAction("delete_content", contentType as AuditTargetType, contentId);

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Get audit log
 */
export async function getAuditLog(): Promise<{
  success: boolean;
  entries?: Array<{
    id: string;
    actor_username: string;
    action: AdminAction;
    target_type: AuditTargetType;
    target_id: string;
    details: Record<string, unknown> | null;
    created_at: string;
  }>;
  error?: string;
}> {
  if (!(await isAdmin())) {
    return { success: false, error: "Not authorized" };
  }

  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from("audit_log")
    .select(`
      id,
      action,
      target_type,
      target_id,
      details,
      created_at,
      actor:profiles!audit_log_actor_id_fkey (username)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Get audit log error:", error);
    return { success: false, error: "Failed to fetch audit log" };
  }

  return {
    success: true,
    entries: (data ?? []).map((e) => {
      const actor = Array.isArray(e.actor) ? e.actor[0] : e.actor;
      return {
        id: e.id,
        actor_username: actor?.username ?? "Unknown",
        action: e.action as AdminAction,
        target_type: e.target_type as AuditTargetType,
        target_id: e.target_id,
        details: e.details as Record<string, unknown> | null,
        created_at: e.created_at,
      };
    }),
  };
}

/**
 * Helper to log admin actions
 */
async function logAdminAction(
  action: AdminAction,
  targetType: AuditTargetType,
  targetId: string,
  details?: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const serviceClient = createServiceClient();

  await serviceClient.from("audit_log").insert({
    actor_id: user.id,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details || null,
  });
}

/**
 * Search users for admin
 */
export async function searchUsers(query: string): Promise<{
  success: boolean;
  users?: Array<{
    id: string;
    username: string;
    avatar_emoji: string;
    is_verified: boolean;
    is_banned: boolean;
    is_anonymous: boolean;
    anon_suspended: boolean;
    trust_score: number;
    created_at: string;
  }>;
  error?: string;
}> {
  if (!(await isAdmin())) {
    return { success: false, error: "Not authorized" };
  }

  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from("profiles")
    .select(`
      id,
      username,
      avatar_emoji,
      is_verified,
      is_banned,
      is_anonymous,
      anon_suspended,
      trust_score,
      created_at
    `)
    .ilike("username", `%${query}%`)
    .limit(20);

  if (error) {
    return { success: false, error: "Failed to search users" };
  }

  return { success: true, users: data ?? [] };
}
