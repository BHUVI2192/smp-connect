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

    const projects = await prisma.mpladsProject.findMany({
      where,
      include: { work: { include: { media: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: projects });
  } catch (err) {
    console.error("MPLADS error:", err);
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

    // Create the development work first, then link MPLADS project
    const work = await prisma.developmentWork.create({
      data: {
        title: body.title,
        description: body.description || null,
        sector: body.sector || "OTHER",
        status: "PROPOSED",
        budget: body.sanctionAmt ? parseFloat(body.sanctionAmt) : null,
        location: body.location || null,
        districtId: body.districtId ? parseInt(body.districtId) : null,
        fundSource: "MPLADS",
        createdBy: session.id,
      },
    });

    const project = await prisma.mpladsProject.create({
      data: {
        workId: work.id,
        schemeCode: body.schemeCode || null,
        sanctionAmt: body.sanctionAmt ? parseFloat(body.sanctionAmt) : null,
        releasedAmt: body.releasedAmt ? parseFloat(body.releasedAmt) : null,
        utilizedAmt: body.utilizedAmt ? parseFloat(body.utilizedAmt) : null,
        status: body.status || "RECOMMENDED",
        sanctionDate: body.sanctionDate ? new Date(body.sanctionDate) : null,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : null,
        createdBy: session.id,
      },
    });

    await logAudit(session.id, "CREATE", "mplads_projects", project.id);
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (err) {
    console.error("Create MPLADS error:", err);
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

    if (updateData.sanctionAmt) updateData.sanctionAmt = parseFloat(updateData.sanctionAmt);
    if (updateData.releasedAmt) updateData.releasedAmt = parseFloat(updateData.releasedAmt);
    if (updateData.utilizedAmt) updateData.utilizedAmt = parseFloat(updateData.utilizedAmt);
    if (updateData.sanctionDate) updateData.sanctionDate = new Date(updateData.sanctionDate);
    if (updateData.releaseDate) updateData.releaseDate = new Date(updateData.releaseDate);

    const project = await prisma.mpladsProject.update({ where: { id }, data: updateData });
    await logAudit(session.id, "UPDATE", "mplads_projects", project.id);
    return NextResponse.json({ data: project });
  } catch (err) {
    console.error("Update MPLADS error:", err);
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

    // Find the mplads project to get the linked workId
    const project = await prisma.mpladsProject.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Delete MPLADS project first (FK constraint), then the linked dev work
    await prisma.mpladsProject.delete({ where: { id } });
    if (project.workId) {
      await prisma.developmentWork.delete({ where: { id: project.workId } });
    }

    await logAudit(session.id, "DELETE", "mplads_projects", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete MPLADS error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
