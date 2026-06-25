import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  console.log("=== SIGNUP API CALLED ===");

  try {
    const body = await request.json();
    const { email, password, fullName, phone, role = "CITIZEN" } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, and full name are required" },
        { status: 400 }
      );
    }

    // Check env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase Service Key or URL");
      return NextResponse.json(
        { error: "Server misconfigured: Missing environment variables" },
        { status: 500 }
      );
    }

    // Create Supabase Admin client to bypass email confirmation if needed
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Create User in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for citizens for smooth UX
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      console.error(">>> AUTH SIGNUP ERROR:", authError.message);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create authentication account" },
        { status: 500 }
      );
    }

    // 2. Create Profile in Database
    try {
      const profile = await prisma.profile.create({
        data: {
          authId: authData.user.id,
          email: email.toLowerCase(),
          fullName,
          phone,
          role: role as any,
        },
      });

      console.log("Profile created successfully for:", email);

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: profile.id,
          action: "SIGNUP",
          entity: "profile",
          details: { email, role, phone },
        },
      }).catch(err => console.error("Audit log failed:", err));

      return NextResponse.json({
        success: true,
        message: "Registration successful",
        data: {
          email: profile.email,
          fullName: profile.fullName,
        }
      });
    } catch (prismaError: any) {
      console.error(">>> PRISMA SIGNUP ERROR:", prismaError.message);
      
      // Cleanup: Delete auth user if profile creation fails? 
      // safer to leave it and handle it manually or throw error
      return NextResponse.json(
        { error: "Profile creation failed. Email might already be registered." },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error(">>> UNCAUGHT SIGNUP ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
