"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import type { ActionResult, ReportReason, ReportableContentType } from "@/lib/types";

interface ReportInput {
  reportedUserId?: string;
  reportedContentId?: string;
  reportedContentType?: ReportableContentType;
  reason: ReportReason;
  details?: string;
}

/**
 * Create a new report
 */
export async function createReport(input: ReportInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate that we have a target
  if (!input.reportedUserId && !input.reportedContentId) {
    return { success: false, error: "Must report a user or content" };
  }

  // Cannot report yourself
  if (input.reportedUserId === user.id) {
    return { success: false, error: "Cannot report yourself" };
  }

  // Validate details length
  if (input.details && input.details.length > 500) {
    return { success: false, error: "Details must be 500 characters or less" };
  }

  const serviceClient = createServiceClient();

  // Check if user has already reported this same target recently (prevent spam)
  const { data: existingReport } = await serviceClient
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq(input.reportedUserId ? "reported_user_id" : "reported_content_id",
        input.reportedUserId || input.reportedContentId)
    .eq("status", "pending")
    .single();

  if (existingReport) {
    return { success: false, error: "You have already reported this. Our team is reviewing it." };
  }

  // Create the report
  const { error } = await serviceClient.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: input.reportedUserId || null,
    reported_content_id: input.reportedContentId || null,
    reported_content_type: input.reportedContentType || null,
    reason: input.reason,
    details: input.details || null,
  });

  if (error) {
    console.error("Create report error:", error);
    return { success: false, error: "Failed to submit report" };
  }

  // If reporting an anonymous user, process the 3-strike system
  if (input.reportedUserId) {
    const { data: reportedProfile } = await serviceClient
      .from("profiles")
      .select("is_anonymous")
      .eq("id", input.reportedUserId)
      .single();

    if (reportedProfile?.is_anonymous) {
      await serviceClient.rpc("process_anonymous_report", {
        p_reported_user_id: input.reportedUserId,
      });
    }
  }

  return { success: true };
}

/**
 * Get reports for admin (pending first)
 */
export async function getReportsForAdmin(): Promise<{
  success: boolean;
  reports?: Array<{
    id: string;
    reporter: { username: string };
    reported_user?: { username: string; is_anonymous: boolean } | null;
    reported_content_type: ReportableContentType | null;
    reason: ReportReason;
    details: string | null;
    status: string;
    created_at: string;
  }>;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return { success: false, error: "Not authorized" };
  }

  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from("reports")
    .select(`
      id,
      reported_user_id,
      reported_content_id,
      reported_content_type,
      reason,
      details,
      status,
      created_at,
      reporter:profiles!reports_reporter_id_fkey (
        username
      ),
      reported_user:profiles!reports_reported_user_id_fkey (
        username,
        is_anonymous,
        anonymous_alias
      )
    `)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);

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
        reporter: reporter ?? { username: "Unknown" },
        reported_user: reportedUser,
        reported_content_type: r.reported_content_type,
        reason: r.reason as ReportReason,
        details: r.details,
        status: r.status,
        created_at: r.created_at,
      };
    }),
  };
}

/**
 * Resolve a report (admin only)
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

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return { success: false, error: "Not authorized" };
  }

  const serviceClient = createServiceClient();

  // Update the report
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

  // Log the admin action
  await serviceClient.rpc("log_admin_action", {
    p_actor_id: user.id,
    p_action: resolution === "resolved" ? "resolve_report" : "dismiss_report",
    p_target_type: "report",
    p_target_id: reportId,
    p_details: note ? { note } : null,
  });

  revalidatePath("/admin");
  return { success: true };
}
