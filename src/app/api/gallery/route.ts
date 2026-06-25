import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const albums = await prisma.photoGalleryAlbum.findMany({
      include: { photos: { take: 4, orderBy: { sortOrder: "asc" } }, _count: { select: { photos: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: albums });
  } catch (err) {
    console.error("Gallery error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const album = await prisma.photoGalleryAlbum.create({
      data: {
        title: body.title,
        description: body.description || null,
        coverUrl: body.coverUrl || null,
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        createdBy: session.id,
      },
    });

    try {
      await logAudit(session.id, "CREATE", "photo_gallery_albums", album.id);
    } catch (auditErr) {
      console.error("Audit log failed for gallery:", auditErr);
    }

    return NextResponse.json({ data: album }, { status: 201 });
  } catch (err) {
    console.error("Create album error:", err);
    return NextResponse.json({ error: "Internal server error", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
