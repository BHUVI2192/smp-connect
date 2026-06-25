import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Find contacts with upcoming birthdays or anniversaries (within 7 days)
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { birthday: { not: null } },
          { anniversary: { not: null } },
        ],
      },
      include: {
        greetingLogs: {
          orderBy: { sentAt: "desc" },
          take: 1,
        },
      },
    });

    const upcoming = contacts
      .map((contact) => {
        const reminders: Array<{ contact: typeof contact; occasion: string; date: Date; daysUntil: number }> = [];

        if (contact.birthday) {
          const bday = new Date(contact.birthday);
          const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
          if (thisYear < today) thisYear.setFullYear(thisYear.getFullYear() + 1);
          const daysUntil = Math.ceil((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 7) {
            reminders.push({ contact, occasion: "Birthday", date: thisYear, daysUntil });
          }
        }

        if (contact.anniversary) {
          const anniv = new Date(contact.anniversary);
          const thisYear = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate());
          if (thisYear < today) thisYear.setFullYear(thisYear.getFullYear() + 1);
          const daysUntil = Math.ceil((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 7) {
            reminders.push({ contact, occasion: "Anniversary", date: thisYear, daysUntil });
          }
        }

        return reminders;
      })
      .flat()
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return NextResponse.json({ data: upcoming });
  } catch (err) {
    console.error("Greetings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const log = await prisma.greetingLog.create({
      data: {
        contactId: body.contactId,
        occasion: body.occasion,
        message: body.message || null,
        sentVia: body.sentVia || "manual",
        sentBy: session.id,
      },
    });

    return NextResponse.json({ data: log }, { status: 201 });
  } catch (err) {
    console.error("Create greeting log error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
