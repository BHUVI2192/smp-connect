/**
 * Uploads a file to Supabase Storage via the server-side /api/upload route
 * (which uses the service role key and bypasses RLS).
 *
 * @param file - The File object to upload
 * @param storagePath - Full storage path, e.g. "development-works/{workId}/photo.jpg"
 * @param bucket - Bucket name, default "documents"
 * @returns The public URL of the uploaded file, or throws on failure
 */
export async function uploadFileViaServer(
  file: File,
  storagePath: string,
  bucket = "documents"
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", storagePath);
  formData.append("bucket", bucket);

  const res = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Upload failed: ${res.status}`);
  }

  const data = await res.json();
  return data.publicUrl as string;
}

/**
 * Generates a unique storage path for a development work photo.
 */
export function makeMediaPath(workId: string, fileName: string): string {
  const ext = fileName.split(".").pop() || "jpg";
  const unique = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
  return `development-works/${workId}/${unique}.${ext}`;
}
