import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = request.nextUrl.searchParams.get("status");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize") || "20");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [letters, total] = await Promise.all([
      prisma.letter.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.letter.count({ where }),
    ]);

    return NextResponse.json({ data: letters, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    console.error("Letters error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const letter = await prisma.letter.create({
      data: {
        subject: body.subject,
        body: body.body,
        recipientName: body.recipientName,
        recipientDesignation: body.recipientDesignation || null,
        recipientAddress: body.recipientAddress || null,
        letterDate: new Date(body.letterDate),
        referenceNo: body.referenceNo || null,
        status: body.status || "DRAFT",
        createdBy: session.id,
      },
    });

    await logAudit(session.id, "CREATE", "letters", letter.id);
    return NextResponse.json({ data: letter }, { status: 201 });
  } catch (err) {
    console.error("Create letter error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, ...updateData } = body;
    if (updateData.letterDate) updateData.letterDate = new Date(updateData.letterDate);

    const letter = await prisma.letter.update({ where: { id }, data: updateData });
    await logAudit(session.id, "UPDATE", "letters", letter.id);
    return NextResponse.json({ data: letter });
  } catch (err) {
    console.error("Update letter error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.letter.delete({ where: { id } });
    await logAudit(session.id, "DELETE", "letters", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete letter error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
