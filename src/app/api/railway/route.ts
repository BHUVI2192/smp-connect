import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const search = request.nextUrl.searchParams.get("search");
    const status = request.nextUrl.searchParams.get("status");

    if (request.nextUrl.searchParams.get("type") === "trains") {
      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { trainNo: { contains: search, mode: "insensitive" } },
          { trainName: { contains: search, mode: "insensitive" } },
        ];
      }
      const trains = await prisma.trainMaster.findMany({ where, take: 20, orderBy: { trainNo: "asc" } });
      return NextResponse.json({ data: trains });
    }

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const requests = await prisma.railwayEqRequest.findMany({
      where,
      include: { train: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: requests });
  } catch (err) {
    console.error("Railway error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const eqRequest = await prisma.railwayEqRequest.create({
      data: {
        trainId: parseInt(body.trainId),
        passengerName: body.passengerName,
        passengerAge: body.passengerAge ? parseInt(body.passengerAge) : null,
        passengerGender: body.passengerGender || null,
        fromStation: body.fromStation,
        toStation: body.toStation,
        travelDate: new Date(body.travelDate),
        coachPreference: body.coachPreference || null,
        pnrNo: body.pnrNo || null,
        remarks: body.remarks || null,
        status: "DRAFT",
        signatureUrl: body.signatureUrl || null,
        createdBy: session.id,
      },
    });

    await logAudit(session.id, "CREATE", "railway_eq_requests", eqRequest.id);
    return NextResponse.json({ data: eqRequest }, { status: 201 });
  } catch (err) {
    console.error("Create railway EQ error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, ...updateData } = body;
    if (updateData.travelDate) updateData.travelDate = new Date(updateData.travelDate);

    const eqRequest = await prisma.railwayEqRequest.update({ where: { id }, data: updateData });
    await logAudit(session.id, "UPDATE", "railway_eq_requests", eqRequest.id);
    return NextResponse.json({ data: eqRequest });
  } catch (err) {
    console.error("Update railway EQ error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
