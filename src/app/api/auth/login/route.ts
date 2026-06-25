import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import { getRoleHome } from "@/lib/role-config";

export async function POST(request: NextRequest) {
  console.log("=== LOGIN API CALLED ===");

  try {
    const body = await request.json();
    const { email, password } = body;
    console.log("Login attempt for:", email);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log("SUPABASE_URL exists:", !!supabaseUrl);
    console.log("SUPABASE_ANON_KEY exists:", !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Server misconfigured: Missing Supabase environment variables" },
        { status: 500 }
      );
    }

    // Create Supabase client directly (no cookies dependency)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("Supabase client created, attempting signIn...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(">>> SUPABASE AUTH ERROR:", error.message, error.status);
      return NextResponse.json(
        { error: `Authentication failed: ${error.message}` },
        { status: error.status || 401 }
      );
    }

    console.log("Auth success! User ID:", data.user?.id);

    if (!data.user) {
      console.error(">>> No user in response");
      return NextResponse.json(
        { error: "Authentication failed: No user returned" },
        { status: 401 }
      );
    }

    // Find profile in database
    let profile;
    try {
      console.log("Looking up profile by authId:", data.user.id);
      profile = await prisma.profile.findUnique({
        where: { authId: data.user.id },
      });
      console.log("Profile by authId:", profile ? "FOUND" : "NOT FOUND");
    } catch (dbError: any) {
      console.error(">>> DATABASE ERROR:", dbError.message);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Fallback: try by email
    if (!profile) {
      try {
        console.log("Trying fallback by email:", data.user.email);
        profile = await prisma.profile.findUnique({
          where: { email: data.user.email! },
        });
        console.log("Profile by email:", profile ? "FOUND" : "NOT FOUND");

        if (profile) {
          profile = await prisma.profile.update({
            where: { email: data.user.email! },
            data: { authId: data.user.id },
          });
          console.log("Fixed authId mapping");
        }
      } catch (e: any) {
        console.error(">>> Fallback error:", e.message);
      }
    }

    if (!profile) {
      console.error(">>> Profile not found for user:", data.user.email);
      return NextResponse.json(
        { error: "Profile not found. Official accounts only." },
        { status: 403 }
      );
    }

    // Role block for Citizens
    if (profile.role === "CITIZEN") {
      console.error(">>> Citizen login attempted but blocked:", profile.email);
      return NextResponse.json(
        { 
          error: "Citizen login is disabled. Please use the reporting form on the homepage to submit issues.",
          isCitizenBlock: true 
        },
        { status: 403 }
      );
    }

    console.log("Login successful:", profile.email, profile.role);

    // Audit log (non-blocking)
    prisma.auditLog
      .create({
        data: {
          userId: profile.id,
          action: "LOGIN",
          entity: "auth",
          details: { email: profile.email, role: profile.role },
        },
      })
      .catch(() => {});

    // Build response
    const response = NextResponse.json({
      success: true,
      redirect: getRoleHome(profile.role),
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        fullName: profile.fullName,
      },
    });

    // Set auth cookies
    if (data.session) {
      const projectRef = supabaseUrl.match(
        /https:\/\/([^.]+)\.supabase\.co/
      )?.[1];

      if (projectRef) {
        const tokenData = JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in,
          token_type: data.session.token_type,
          user: data.user,
        });

        const cookieBase = `sb-${projectRef}-auth-token`;
        const cookieOptions = {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax" as const,
          maxAge: 60 * 60 * 24 * 7,
        };

        const chunkSize = 3000;
        if (tokenData.length <= chunkSize) {
          response.cookies.set(cookieBase, tokenData, cookieOptions);
        } else {
          const chunks = Math.ceil(tokenData.length / chunkSize);
          for (let i = 0; i < chunks; i++) {
            response.cookies.set(
              `${cookieBase}.${i}`,
              tokenData.slice(i * chunkSize, (i + 1) * chunkSize),
              cookieOptions
            );
          }
        }
        console.log("Auth cookies set with prefix:", cookieBase);
      }
    }

    return response;
  } catch (err: any) {
    console.error(">>> UNCAUGHT LOGIN ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
