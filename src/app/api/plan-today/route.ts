import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dateParam = request.nextUrl.searchParams.get("date");
    const status = request.nextUrl.searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (dateParam) {
      const date = new Date(dateParam);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.eventDate = { gte: date, lt: nextDay };
    }
    if (status) where.status = status;

    if (session.role === "STAFF") {
      where.isFinalized = true;
    }

    const events = await prisma.planTodayEvent.findMany({
      where,
      orderBy: [{ eventDate: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ data: events });
  } catch (err) {
    console.error("Plan today error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role === "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const event = await prisma.planTodayEvent.create({
      data: {
        title: body.title,
        description: body.description || null,
        eventDate: new Date(body.eventDate),
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        location: body.location || null,
        status: body.status || "DRAFT",
        notes: body.notes || null,
        createdBy: session.id,
        // New PA briefing fields
        paVoiceUrl: body.paVoiceUrl || null,
        paMediaUrls: body.paMediaUrls || null,
      },
    });

    await logAudit(session.id, "CREATE", "plan_today_events", event.id);
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (err) {
    console.error("Create event error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role === "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (updateData.eventDate) updateData.eventDate = new Date(updateData.eventDate);

    const event = await prisma.planTodayEvent.update({
      where: { id },
      data: updateData,
    });

    await logAudit(session.id, "UPDATE", "plan_today_events", event.id);
    return NextResponse.json({ data: event });
  } catch (err) {
    console.error("Update event error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role === "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.planTodayEvent.delete({ where: { id } });
    await logAudit(session.id, "DELETE", "plan_today_events", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete event error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
