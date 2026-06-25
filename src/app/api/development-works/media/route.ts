import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

// POST — save a media record after client has uploaded the file to Supabase storage
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "STAFF" && session.role !== "MP") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { workId, fileUrl, fileType, fileName, fileSize, phase, caption } = body;

    if (!workId || !fileUrl) {
      return NextResponse.json({ error: "workId and fileUrl are required" }, { status: 400 });
    }

    const media = await prisma.developmentWorkMedia.create({
      data: {
        workId,
        fileUrl,
        fileType: fileType || "image/jpeg",
        fileName: fileName || "photo",
        fileSize: fileSize ? parseInt(fileSize) : null,
        caption: caption || null,
        phase: phase || "DURING",
        uploaded_by: session.id,
      },
    });

    await logAudit(session.id, "CREATE", "development_work_media", media.id);
    return NextResponse.json({ data: media }, { status: 201 });
  } catch (err) {
    console.error("Media record error:", err);
    return NextResponse.json({ error: "Failed to save media record", detail: String(err) }, { status: 500 });
  }
}

// DELETE — remove media record by id
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "STAFF" && session.role !== "MP") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.developmentWorkMedia.delete({ where: { id } });
    await logAudit(session.id, "DELETE", "development_work_media", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Media delete error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
