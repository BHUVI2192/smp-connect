import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalComplaints,
      pendingComplaints,
      resolvedComplaints,
      totalWorks,
      completedWorks,
      inProgressWorks,
      totalLetters,
      pendingLetters,
      todayEvents,
      totalContacts,
      totalMplads,
      mpladsStats,
      recentComplaints,
      complaintsByStatus,
      worksBySector,
    ] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: { in: ["RECEIVED", "VERIFIED", "IN_REVIEW"] } } }),
      prisma.complaint.count({ where: { status: "RESOLVED" } }),
      prisma.developmentWork.count(),
      prisma.developmentWork.count({ where: { status: "COMPLETED" } }),
      prisma.developmentWork.count({ where: { status: "IN_PROGRESS" } }),
      prisma.letter.count(),
      prisma.letter.count({ where: { status: { in: ["DRAFT", "PENDING_REVIEW"] } } }),
      prisma.planTodayEvent.count({ where: { eventDate: { gte: today, lt: tomorrow } } }),
      prisma.contact.count(),
      prisma.mpladsProject.count(),
      prisma.mpladsProject.aggregate({
        _sum: { sanctionAmt: true, releasedAmt: true, utilizedAmt: true },
      }),
      prisma.complaint.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, subject: true, status: true, priority: true, createdAt: true, complainantName: true },
      }),
      prisma.complaint.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.developmentWork.groupBy({
        by: ["sector"],
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      data: {
        complaints: { total: totalComplaints, pending: pendingComplaints, resolved: resolvedComplaints },
        works: { total: totalWorks, completed: completedWorks, inProgress: inProgressWorks },
        letters: { total: totalLetters, pending: pendingLetters },
        todayEvents,
        totalContacts,
        mplads: {
          total: totalMplads,
          sanctioned: mpladsStats._sum.sanctionAmt || 0,
          released: mpladsStats._sum.releasedAmt || 0,
          utilized: mpladsStats._sum.utilizedAmt || 0,
        },
        recentComplaints,
        complaintsByStatus: complaintsByStatus.map((c) => ({ status: c.status, count: c._count.id })),
        worksBySector: worksBySector.map((w) => ({ sector: w.sector, count: w._count.id })),
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
