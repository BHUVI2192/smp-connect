import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sector = request.nextUrl.searchParams.get("sector");
    const status = request.nextUrl.searchParams.get("status");
    const lat = request.nextUrl.searchParams.get("lat");
    const lng = request.nextUrl.searchParams.get("lng");
    const radius = request.nextUrl.searchParams.get("radius");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize") || "20");

    const where: Record<string, unknown> = {};
    if (sector) where.sector = sector;
    if (status) where.status = status;

    const [works, total] = await Promise.all([
      prisma.developmentWork.findMany({
        where,
        include: {
          media: true,
          mpladsProject: true,
          state: true,
          district: true,
          taluk: true,
          panchayat: true,
          village: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.developmentWork.count({ where }),
    ]);

    let filteredWorks = works;
    if (lat && lng && radius) {
      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      filteredWorks = works.filter((w) => {
        if (!w.latitude || !w.longitude) return false;
        const R = 6371;
        const dLat = ((w.latitude - centerLat) * Math.PI) / 180;
        const dLon = ((w.longitude - centerLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((centerLat * Math.PI) / 180) *
            Math.cos((w.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c <= radiusKm;
      });
    }

    return NextResponse.json({
      data: filteredWorks,
      total: lat ? filteredWorks.length : total,
      page,
      pageSize,
      totalPages: Math.ceil((lat ? filteredWorks.length : total) / pageSize),
    });
  } catch (err) {
    console.error("Development works error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "STAFF" && session.role !== "MP") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const work = await prisma.developmentWork.create({
      data: {
        title: body.title,
        description: body.description || null,
        sector: body.sector,
        status: body.status || "PROPOSED",
        budget: body.budget ? parseFloat(body.budget) : null,
        location: body.location || null,
        stateId: body.stateId ? parseInt(body.stateId) : null,
        districtId: body.districtId ? parseInt(body.districtId) : null,
        talukId: body.talukId ? parseInt(body.talukId) : null,
        panchayatId: body.panchayatId ? parseInt(body.panchayatId) : null,
        villageId: body.villageId ? parseInt(body.villageId) : null,
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        contractor: body.contractor || null,
        fundSource: body.fundSource || null,
        remarks: body.remarks || null,
        createdBy: session.id,
      },
    });

    await logAudit(session.id, "CREATE", "development_works", work.id);
    return NextResponse.json({ data: work }, { status: 201 });
  } catch (err) {
    console.error("Create work error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "STAFF" && session.role !== "MP") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (updateData.budget) updateData.budget = parseFloat(updateData.budget);
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);

    // Ensure numeric IDs are parsed
    if (updateData.stateId) updateData.stateId = parseInt(updateData.stateId);
    if (updateData.districtId) updateData.districtId = parseInt(updateData.districtId);
    if (updateData.talukId) updateData.talukId = parseInt(updateData.talukId);
    if (updateData.panchayatId) updateData.panchayatId = parseInt(updateData.panchayatId);
    if (updateData.villageId) updateData.villageId = parseInt(updateData.villageId);

    const work = await prisma.developmentWork.update({
      where: { id },
      data: updateData,
    });

    await logAudit(session.id, "UPDATE", "development_works", work.id);
    return NextResponse.json({ data: work });
  } catch (err) {
    console.error("Update work error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "STAFF" && session.role !== "MP") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.developmentWork.delete({ where: { id } });
    await logAudit(session.id, "DELETE", "development_works", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete work error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
