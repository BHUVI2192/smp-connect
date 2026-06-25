import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const category = request.nextUrl.searchParams.get("category");
    const search = request.nextUrl.searchParams.get("search");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize") || "20");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { organization: { contains: search, mode: "insensitive" } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          state: true,
          district: true,
          taluk: true,
          panchayat: true,
          village: true,
        },
        orderBy: { fullName: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({ data: contacts, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    console.error("Contacts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const contact = await prisma.contact.create({
      data: {
        fullName: body.fullName,
        phone: body.phone || null,
        email: body.email || null,
        designation: body.designation || null,
        organization: body.organization || null,
        category: body.category || null,
        stateId: body.stateId ? parseInt(body.stateId) : null,
        districtId: body.districtId ? parseInt(body.districtId) : null,
        talukId: body.talukId ? parseInt(body.talukId) : null,
        panchayatId: body.panchayatId ? parseInt(body.panchayatId) : null,
        villageId: body.villageId ? parseInt(body.villageId) : null,
        address: body.address || null,
        birthday: body.birthday ? new Date(body.birthday) : null,
        anniversary: body.anniversary ? new Date(body.anniversary) : null,
        notes: body.notes || null,
        createdBy: session.id,
      },
    });

    await logAudit(session.id, "CREATE", "contacts", contact.id);
    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (err) {
    console.error("Create contact error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, ...updateData } = body;
    if (updateData.birthday) updateData.birthday = new Date(updateData.birthday);
    if (updateData.anniversary) updateData.anniversary = new Date(updateData.anniversary);
    
    // Ensure numeric IDs are parsed
    if (updateData.stateId) updateData.stateId = parseInt(updateData.stateId);
    if (updateData.districtId) updateData.districtId = parseInt(updateData.districtId);
    if (updateData.talukId) updateData.talukId = parseInt(updateData.talukId);
    if (updateData.panchayatId) updateData.panchayatId = parseInt(updateData.panchayatId);
    if (updateData.villageId) updateData.villageId = parseInt(updateData.villageId);

    const contact = await prisma.contact.update({ where: { id }, data: updateData });
    await logAudit(session.id, "UPDATE", "contacts", contact.id);
    return NextResponse.json({ data: contact });
  } catch (err) {
    console.error("Update contact error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.contact.delete({ where: { id } });
    await logAudit(session.id, "DELETE", "contacts", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete contact error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
