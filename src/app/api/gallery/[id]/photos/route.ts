import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: albumId } = params;
    const body = await request.json();
    const { photos } = body; // Array of objects { url, caption }

    if (!photos || !Array.isArray(photos)) {
      return NextResponse.json({ error: "Photos array is required" }, { status: 400 });
    }

    // Get current max sort order
    const lastPhoto = await prisma.photoGalleryPhoto.findFirst({
      where: { albumId },
      orderBy: { sortOrder: "desc" },
    });
    let currentSortOrder = lastPhoto ? lastPhoto.sortOrder + 1 : 0;

    const createdPhotos = await prisma.$transaction(
      photos.map((p: any) =>
        prisma.photoGalleryPhoto.create({
          data: {
            albumId,
            fileUrl: p.url,
            caption: p.caption || null,
            sortOrder: currentSortOrder++,
          },
        })
      )
    );

    // Update album cover if it doesn't have one
    const album = await prisma.photoGalleryAlbum.findUnique({
      where: { id: albumId },
      select: { coverUrl: true },
    });

    if (album && !album.coverUrl && createdPhotos.length > 0) {
      await prisma.photoGalleryAlbum.update({
        where: { id: albumId },
        data: { coverUrl: createdPhotos[0].fileUrl },
      });
    }

    await logAudit(session.id, "ADD_PHOTOS", "photo_gallery_albums", albumId, {
      count: createdPhotos.length,
    });

    return NextResponse.json({ data: createdPhotos }, { status: 201 });
  } catch (err) {
    console.error("Add photos error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { photoIds } = await request.json();
    if (!photoIds || !Array.isArray(photoIds)) {
      return NextResponse.json({ error: "Photo IDs array is required" }, { status: 400 });
    }

    await prisma.photoGalleryPhoto.deleteMany({
      where: {
        id: { in: photoIds },
        albumId: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete photos error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
