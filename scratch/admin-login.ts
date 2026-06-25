import { createClient } from "@supabase/supabase-js";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE environment variables in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log("Usage: npx ts-node scratch/admin-login.ts <email>");
    console.log("Example: npx ts-node scratch/admin-login.ts mp@smp.com");
    return;
  }

  console.log(`🔗 Generating secure login link for: ${email}...`);

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: email,
    options: {
      redirectTo: "http://localhost:3000/api/auth/callback", // Default local dev callback
    },
  });

  if (error) {
    console.error("❌ Error generating link:", error.message);
    process.exit(1);
  }

  console.log("\n✅ SUCCESS! Use the link below to log in instantly (bypassing rate limits):");
  console.log("-------------------------------------------------------------------------");
  console.log(data.properties.action_link);
  console.log("-------------------------------------------------------------------------");
  console.log("\nNote: This link works even if password login is rate-limited.");
}

main().catch(console.error);
