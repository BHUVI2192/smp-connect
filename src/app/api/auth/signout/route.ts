import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    await supabase.auth.signOut();
  } catch {
    // Ignore signout errors
  }

  // Clear all Supabase auth cookies
  const response = NextResponse.redirect(new URL("/login", request.url));

  // Get project ref for cookie name
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const projectRef = supabaseUrl.match(
    /https:\/\/([^.]+)\.supabase\.co/
  )?.[1];

  if (projectRef) {
    const cookieBase = `sb-${projectRef}-auth-token`;
    response.cookies.delete(cookieBase);
    // Also delete chunked cookies
    for (let i = 0; i < 5; i++) {
      response.cookies.delete(`${cookieBase}.${i}`);
    }
  }

  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");

  return response;
}
