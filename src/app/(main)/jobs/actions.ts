"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import type { ActionResult, JobWithPoster, JobType, City } from "@/lib/types";

/**
 * Create a new job posting
 */
export async function createJob(formData: FormData): Promise<ActionResult & { job?: JobWithPoster }> {
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

  // Anonymous users cannot post jobs
  if (profile.is_anonymous) {
    return { success: false, error: "Anonymous users cannot post jobs. Please disable anonymous mode first." };
  }

  const title = formData.get("title") as string;
  const company = formData.get("company") as string;
  const description = formData.get("description") as string;
  const city = formData.get("city") as City;
  const jobType = formData.get("job_type") as JobType;
  const isRemote = formData.get("is_remote") === "true";
  const salaryRange = formData.get("salary_range") as string | null;
  const tagsString = formData.get("tags") as string | null;
  const applyUrl = formData.get("apply_url") as string | null;
  const applyEmail = formData.get("apply_email") as string | null;

  // Parse tags
  const tags = tagsString
    ? tagsString.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5)
    : [];

  // Validate required fields
  if (!title?.trim()) {
    return { success: false, error: "Title is required" };
  }
  if (title.length > 120) {
    return { success: false, error: "Title must be 120 characters or less" };
  }
  if (!company?.trim()) {
    return { success: false, error: "Company is required" };
  }
  if (company.length > 100) {
    return { success: false, error: "Company must be 100 characters or less" };
  }
  if (!description?.trim()) {
    return { success: false, error: "Description is required" };
  }
  if (description.length > 3000) {
    return { success: false, error: "Description must be 3000 characters or less" };
  }
  if (!city) {
    return { success: false, error: "City is required" };
  }
  if (!jobType) {
    return { success: false, error: "Job type is required" };
  }

  // Validate apply method
  if (applyUrl && applyEmail) {
    return { success: false, error: "Please provide either an apply URL or email, not both" };
  }

  const serviceClient = createServiceClient();

  // Create job
  const { data: job, error } = await serviceClient
    .from("jobs")
    .insert({
      posted_by: user.id,
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      city,
      job_type: jobType,
      is_remote: isRemote,
      salary_range: salaryRange?.trim() || null,
      tags,
      apply_url: applyUrl?.trim() || null,
      apply_email: applyEmail?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Create job error:", error);
    return { success: false, error: "Failed to create job posting" };
  }

  // Build response with poster info
  const jobWithPoster: JobWithPoster = {
    ...job,
    poster: {
      id: user.id,
      username: profile.username,
      avatar_emoji: profile.avatar_emoji,
      avatar_url: profile.avatar_url,
      show_photo: profile.show_photo,
      is_anonymous: false,
      is_verified: profile.is_verified,
    },
    is_saved: false,
  };

  revalidatePath("/jobs");

  return { success: true, job: jobWithPoster };
}

/**
 * Toggle save/unsave a job
 */
export async function toggleSaveJob(jobId: string): Promise<ActionResult & { saved?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  // Check if already saved
  const { data: existingSave } = await serviceClient
    .from("job_saves")
    .select("*")
    .eq("job_id", jobId)
    .eq("user_id", user.id)
    .single();

  if (existingSave) {
    // Unsave
    const { error } = await serviceClient
      .from("job_saves")
      .delete()
      .eq("job_id", jobId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Unsave job error:", error);
      return { success: false, error: "Failed to unsave job" };
    }

    return { success: true, saved: false };
  } else {
    // Save
    const { error } = await serviceClient
      .from("job_saves")
      .insert({
        job_id: jobId,
        user_id: user.id,
      });

    if (error) {
      console.error("Save job error:", error);
      return { success: false, error: "Failed to save job" };
    }

    return { success: true, saved: true };
  }
}

/**
 * Deactivate a job (mark as filled/expired)
 */
export async function deactivateJob(jobId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify ownership
  const { data: job } = await supabase
    .from("jobs")
    .select("posted_by")
    .eq("id", jobId)
    .single();

  if (!job) {
    return { success: false, error: "Job not found" };
  }

  if (job.posted_by !== user.id) {
    return { success: false, error: "You can only deactivate your own jobs" };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("jobs")
    .update({ is_active: false })
    .eq("id", jobId);

  if (error) {
    console.error("Deactivate job error:", error);
    return { success: false, error: "Failed to deactivate job" };
  }

  revalidatePath("/jobs");
  return { success: true };
}

/**
 * Delete a job posting
 */
export async function deleteJob(jobId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify ownership
  const { data: job } = await supabase
    .from("jobs")
    .select("posted_by")
    .eq("id", jobId)
    .single();

  if (!job) {
    return { success: false, error: "Job not found" };
  }

  if (job.posted_by !== user.id) {
    return { success: false, error: "You can only delete your own jobs" };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("jobs")
    .delete()
    .eq("id", jobId);

  if (error) {
    console.error("Delete job error:", error);
    return { success: false, error: "Failed to delete job" };
  }

  revalidatePath("/jobs");
  return { success: true };
}
