import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

export async function seedUsers(prisma: PrismaClient) {
  // We need to look up the actual auth user UUIDs from Supabase
  // because the SQL script creates them with specific UUIDs,
  // but some Supabase versions may assign different ones.

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.log(
      "   ⚠ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set."
    );
    console.log("   Creating profiles with placeholder auth IDs...");
    console.log(
      "   Auth IDs will auto-fix on first login."
    );
  }

  const users = [
    {
      email: "mp@smp.com",
      fullName: "Hon. Member of Parliament",
      role: "MP" as const,
      phone: "+91 9876543210",
      fallbackAuthId: "00000000-0000-0000-0000-000000000001",
    },
    {
      email: "pa@smp.com",
      fullName: "Personal Assistant",
      role: "PA" as const,
      phone: "+91 9876543211",
      fallbackAuthId: "00000000-0000-0000-0000-000000000002",
    },
    {
      email: "staff@smp.com",
      fullName: "Office Staff Member",
      role: "STAFF" as const,
      phone: "+91 9876543212",
      fallbackAuthId: "00000000-0000-0000-0000-000000000003",
    },
  ];

  // Try to look up actual auth UUIDs via Supabase admin API
  let authUsers: Record<string, string> = {};
  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data } = await supabase.auth.admin.listUsers();
      if (data?.users) {
        for (const u of data.users) {
          if (u.email) {
            authUsers[u.email] = u.id;
          }
        }
      }
      console.log(
        `   Found ${Object.keys(authUsers).length} auth users in Supabase`
      );
    } catch (err) {
      console.log("   Could not query auth users, using fallback IDs");
    }
  }

  for (const user of users) {
    const authId = authUsers[user.email] || user.fallbackAuthId;

    await prisma.profile.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        authId: authId,
      },
      create: {
        authId: authId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
      },
    });
  }

  console.log("   ✓ 3 user profiles created/updated");
}
