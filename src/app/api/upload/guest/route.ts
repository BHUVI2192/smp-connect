import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerAdminClient } from "@/lib/supabase/route-handler";

/**
 * POST /api/upload/guest
 * Anonymous upload specifically for citizen complaints.
 * Restricted to "complaints" bucket.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const path = formData.get("path") as string | null;
    
    // Safety: Enforce "images" bucket specifically for guest uploads
    const bucket = "images";

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!path) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    // Sanitize path: replace spaces with hyphens and remove special characters from filename
    const sanitizedPath = path
      .split("/")
      .map((part, index, arr) => 
        index === arr.length - 1 
          ? part.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "")
          : part
      )
      .join("/");

    // Convert File -> ArrayBuffer -> Buffer so Supabase can upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = createRouteHandlerAdminClient();

    // Verify if bucket exists, if not, attempt to create it
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error("Supabase listBuckets error:", listError);
      return NextResponse.json({ error: "Storage configuration error", detail: listError.message }, { status: 500 });
    }

    const bucketExists = buckets.find(b => b.name === bucket);
    if (!bucketExists) {
      console.log(`Bucket "${bucket}" not found, attempting to create...`);
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      if (createError) {
        console.error("Supabase createBucket error:", createError);
        return NextResponse.json({ error: "Bucket creation failed", detail: createError.message }, { status: 500 });
      }
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(`guest/${sanitizedPath}`, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(`Supabase guest upload error [Bucket: ${bucket}, Path: guest/${sanitizedPath}]:`, uploadError);
      return NextResponse.json(
        { error: "Upload failed", detail: uploadError.message },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(`guest/${sanitizedPath}`);

    return NextResponse.json({ publicUrl, path: `guest/${sanitizedPath}` }, { status: 200 });
  } catch (err: any) {
    console.error("Guest upload route error:", err);
    return NextResponse.json({ 
      error: "Internal server error", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
