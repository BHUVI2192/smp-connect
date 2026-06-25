import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dateParam = request.nextUrl.searchParams.get("date");
    const where: Record<string, unknown> = {};

    if (dateParam) {
      const date = new Date(dateParam);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.entryDate = { gte: date, lt: nextDay };
    }

    const entries = await prisma.dayBookEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: entries });
  } catch (err) {
    console.error("Day book error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const entry = await prisma.dayBookEntry.create({
      data: {
        title: body.title,
        content: body.content || null,
        entryDate: new Date(body.entryDate || new Date()),
        mediaUrls: body.mediaUrls || null,
        voiceUrl: body.voiceUrl || null,
        createdBy: session.id,
      },
    });

    await logAudit(session.id, "CREATE", "day_book_entries", entry.id);
    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (err) {
    console.error("Create day book error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, ...updateData } = body;

    // Get current entry to check its values
    const currentEntry = await prisma.dayBookEntry.findUnique({ where: { id } });
    if (!currentEntry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    // Handle forwarding to Staff
    if (updateData.isForwarded && updateData.forwardedTo === "STAFF" && !currentEntry.isForwarded) {
      await prisma.planTodayEvent.create({
        data: {
          title: currentEntry.title,
          description: currentEntry.content || "",
          eventDate: currentEntry.entryDate,
          paVoiceUrl: currentEntry.voiceUrl,
          paMediaUrls: currentEntry.mediaUrls as any,
          isFinalized: true,
          status: "CONFIRMED",
          createdBy: currentEntry.createdBy,
        },
      });
    }

    const entry = await prisma.dayBookEntry.update({ where: { id }, data: updateData });
    await logAudit(session.id, "UPDATE", "day_book_entries", entry.id);
    return NextResponse.json({ data: entry });
  } catch (err) {
    console.error("Update day book error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
