import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = request.nextUrl.searchParams.get("status");
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const tours = await prisma.tourProgram.findMany({
      where,
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ data: tours });
  } catch (err) {
    console.error("Tours error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const tour = await prisma.tourProgram.create({
      data: {
        title: body.title,
        description: body.description || null,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        locations: body.locations || null,
        status: body.status || "PLANNED",
        createdBy: session.id,
      },
    });

    await logAudit(session.id, "CREATE", "tour_programs", tour.id);
    return NextResponse.json({ data: tour }, { status: 201 });
  } catch (err) {
    console.error("Create tour error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, ...updateData } = body;
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const tour = await prisma.tourProgram.update({ where: { id }, data: updateData });
    await logAudit(session.id, "UPDATE", "tour_programs", tour.id);
    return NextResponse.json({ data: tour });
  } catch (err) {
    console.error("Update tour error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
