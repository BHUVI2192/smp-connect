import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, documentation, attendees, mediaUrls, startTime, endTime, location } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    // Ensure they are correctly typed as JSON or undefined
    const cleanAttendees = Array.isArray(attendees) && attendees.length > 0 ? attendees : undefined;
    const cleanMediaUrls = Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls : undefined;

    // Update the event
    const event = await prisma.planTodayEvent.update({
      where: { id: eventId },
      data: {
        documentation,
        attendees: cleanAttendees,
        docMediaUrls: cleanMediaUrls,
        documentedAt: new Date(),
        documentedBy: session.id,
        status: "COMPLETED", // Automatically mark as completed when documented
        // Update logistical info if provided
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        location: location || undefined,
      },
    });

    await logAudit(session.id, "DOCUMENT", "plan_today_events", event.id);
    console.log("Documentation saved for event:", event.id);

    // Notify PA users - Wrapped in try/catch to prevent failing the whole request
    try {
      const paUsers = await prisma.profile.findMany({
        where: { role: "PA" },
        select: { id: true },
      });

      if (paUsers.length > 0) {
        await prisma.notification.createMany({
          data: paUsers.map((pa) => ({
            userId: pa.id,
            title: "Event Documented",
            message: `Staff ${session.fullName || 'member'} has documented the event: ${event.title}`,
            priority: "MEDIUM",
            link: `/pa/plan-today`, 
          })),
        });
        console.log(`Sent notifications to ${paUsers.length} PA users`);
      }
    } catch (notifErr) {
      console.error("Failed to send notifications:", notifErr);
      // Non-blocking error
    }

    return NextResponse.json({ data: event });
  } catch (err: any) {
    console.error("Documentation error detail:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    return NextResponse.json({ 
      error: "Internal server error", 
      details: err.message 
    }, { status: 500 });
  }
}
