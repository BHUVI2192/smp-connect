import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getRoleHome } from "@/lib/role-config";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      // Sync user profile in database
      const user = data.user;
      
      let profile = await prisma.profile.findUnique({
        where: { authId: user.id },
      });

      if (!profile) {
        // Fallback check by email (for OAuth users who might exist as CITIZEN from direct signup)
        profile = await prisma.profile.findUnique({
          where: { email: user.email! },
        });

        if (profile) {
          // Update profile with auth_id from Google/Supabase
          profile = await prisma.profile.update({
            where: { id: profile.id },
            data: { authId: user.id },
          });
        } else {
          // Create new CITIZEN profile if it doesn't exist
          profile = await prisma.profile.create({
            data: {
              authId: user.id,
              email: user.email!,
              fullName: user.user_metadata.full_name || user.email!.split("@")[0],
              role: "CITIZEN",
            },
          });
        }
      }

      // Redirect to the appropriate dashboard
      return NextResponse.redirect(`${origin}${getRoleHome(profile.role)}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
