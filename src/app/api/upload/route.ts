import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createRouteHandlerAdminClient } from "@/lib/supabase/route-handler";

/**
 * POST /api/upload
 * Uploads a file to Supabase Storage using the service-role key (bypasses RLS).
 * Expects multipart/form-data with:
 *   - file: the raw file
 *   - bucket: storage bucket name (default: "documents")
 *   - path: storage path (e.g. "development-works/{workId}/photo.jpg")
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "documents";
    const path = formData.get("path") as string | null;

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

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(sanitizedPath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(`Supabase storage upload error [Bucket: ${bucket}, Path: ${sanitizedPath}]:`, uploadError);
      return NextResponse.json(
        { error: "Upload failed", detail: uploadError.message, code: (uploadError as any).status },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(sanitizedPath);

    return NextResponse.json({ publicUrl, path: sanitizedPath }, { status: 200 });
  } catch (err: any) {
    console.error("Upload route error:", err);
    return NextResponse.json({ 
      error: "Internal server error", 
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    }, { status: 500 });
  }
}
