"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { ActionResult } from "@/lib/types";
import sharp from "sharp";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadAvatar(formData: FormData): Promise<ActionResult & { url?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const file = formData.get("file") as File | null;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Invalid file type. Please upload a JPEG, PNG, or WebP image." };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File too large. Maximum size is 5MB." };
  }

  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image with sharp - strips EXIF data and converts to WebP
    const processedImage = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF (then strip)
      .resize(400, 400, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Generate unique filename
    const filename = `${user.id}/${Date.now()}.webp`;

    // Use service client to upload (bypasses RLS for storage)
    const serviceClient = createServiceClient();

    // Delete old avatar if exists
    const { data: existingFiles } = await serviceClient
      .storage
      .from("avatars")
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f: { name: string }) => `${user.id}/${f.name}`);
      await serviceClient.storage.from("avatars").remove(filesToDelete);
    }

    // Upload new avatar
    const { error: uploadError } = await serviceClient
      .storage
      .from("avatars")
      .upload(filename, processedImage, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { success: false, error: "Failed to upload image" };
    }

    // Get public URL
    const { data: { publicUrl } } = serviceClient
      .storage
      .from("avatars")
      .getPublicUrl(filename);

    // Update profile with new avatar URL
    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return { success: false, error: "Failed to update profile" };
    }

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Image processing error:", error);
    return { success: false, error: "Failed to process image" };
  }
}

export async function removeAvatar(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  // Delete all files in user's folder
  const { data: files } = await serviceClient
    .storage
    .from("avatars")
    .list(user.id);

  if (files && files.length > 0) {
    const filesToDelete = files.map((f: { name: string }) => `${user.id}/${f.name}`);
    await serviceClient.storage.from("avatars").remove(filesToDelete);
  }

  // Update profile to remove avatar URL
  const { error } = await serviceClient
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Failed to update profile" };
  }

  return { success: true };
}
