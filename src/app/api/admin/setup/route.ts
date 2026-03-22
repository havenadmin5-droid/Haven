import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// List of emails that should be super_admin
const SUPER_ADMIN_EMAILS = ["padmanavakarmakar148@gmail.com"];

/**
 * POST /api/admin/setup
 *
 * One-time admin setup endpoint.
 * This endpoint checks if the requesting user's email is in the allowed list
 * and promotes them to super_admin if no super_admin exists yet.
 *
 * Security: Only works if no super_admin exists OR user is already super_admin
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if email is in allowed list
    if (!SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json(
        { error: "This email is not authorized for admin setup" },
        { status: 403 }
      );
    }

    const serviceClient = createServiceClient();

    // Check if super_admin already exists
    const { data: existingAdmin } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("role", "super_admin")
      .limit(1);

    if (existingAdmin && existingAdmin.length > 0) {
      // Check if the requesting user is already the admin
      const { data: authUsers } = await serviceClient.auth.admin.listUsers();
      const adminUser = authUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (adminUser && existingAdmin[0]?.id === adminUser.id) {
        return NextResponse.json({
          success: true,
          message: "You are already a super_admin",
          alreadyAdmin: true,
        });
      }

      return NextResponse.json(
        { error: "A super_admin already exists" },
        { status: 409 }
      );
    }

    // Find user by email
    const { data: authUsers } = await serviceClient.auth.admin.listUsers();
    const targetUser = authUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found. Please register first." },
        { status: 404 }
      );
    }

    // Check if profile exists
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("id", targetUser.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found. Please complete registration." },
        { status: 404 }
      );
    }

    // Promote to super_admin
    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({
        role: "super_admin",
        is_verified: true,
        trust_score: 100,
      })
      .eq("id", targetUser.id);

    if (updateError) {
      console.error("Failed to promote user:", updateError);
      return NextResponse.json(
        { error: "Failed to promote user to admin" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully promoted to super_admin",
      userId: targetUser.id,
    });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
