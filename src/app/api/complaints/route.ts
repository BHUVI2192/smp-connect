import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = request.nextUrl.searchParams.get("status");
    const priority = request.nextUrl.searchParams.get("priority");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize") || "20");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.complaint.count({ where }),
    ]);

    return NextResponse.json({
      data: complaints,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("Complaints error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const complaint = await prisma.complaint.create({
      data: {
        subject: body.subject,
        description: body.description,
        complainantName: body.complainantName,
        complainantPhone: body.complainantPhone || null,
        complainantEmail: body.complainantEmail || null,
        category: body.category || null,
        priority: body.priority || "MEDIUM",
        status: "RECEIVED",
        districtId: body.districtId ? parseInt(body.districtId) : null,
        talukId: body.talukId ? parseInt(body.talukId) : null,
        location: body.location || null,
        createdBy: session.id,
      },
    });

    await logAudit(session.id, "CREATE", "complaints", complaint.id);
    return NextResponse.json({ data: complaint }, { status: 201 });
  } catch (err) {
    console.error("Create complaint error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, ...updateData } = body;

    if (updateData.resolvedAt) updateData.resolvedAt = new Date(updateData.resolvedAt);

    const complaint = await prisma.complaint.update({
      where: { id },
      data: updateData,
    });

    await logAudit(session.id, "UPDATE", "complaints", complaint.id, { changes: updateData });
    return NextResponse.json({ data: complaint });
  } catch (err) {
    console.error("Update complaint error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
