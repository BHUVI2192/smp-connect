import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const album = await prisma.photoGalleryAlbum.findUnique({
      where: { id: params.id },
      include: {
        photos: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { photos: true },
        },
      },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json({ data: album });
  } catch (err) {
    console.error("Get album detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const album = await prisma.photoGalleryAlbum.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        coverUrl: body.coverUrl,
        eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
      },
    });

    return NextResponse.json({ data: album });
  } catch (err) {
    console.error("Update album error:", err);
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

    await prisma.photoGalleryAlbum.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete album error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
