const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkStorage() {
  console.log("Checking storage for URL:", supabaseUrl);
  
  // 1. List Buckets
  const { data: buckets, error: bError } = await supabase.storage.listBuckets();
  if (bError) {
    console.error("Error listing buckets:", bError);
  } else {
    console.log("Buckets found:", buckets.map(b => b.name).join(", "));
  }

  // 2. Check if 'documents' bucket exists
  const docsBucket = buckets?.find(b => b.name === 'documents');
  if (docsBucket) {
    console.log("'documents' bucket exists. Public:", docsBucket.public);
  } else {
    console.log("'documents' bucket DOES NOT exist.");
  }
}

checkStorage();
