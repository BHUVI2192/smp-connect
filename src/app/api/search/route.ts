import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { SearchResult } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");
    if (!q || q.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const searchTerm = `%${q}%`;
    const results: SearchResult[] = [];

    const [contacts, complaints, letters, works, speeches] = await Promise.all([
      prisma.contact.findMany({
        where: {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { organization: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, fullName: true, designation: true, organization: true },
      }),
      prisma.complaint.findMany({
        where: {
          OR: [
            { subject: { contains: q, mode: "insensitive" } },
            { complainantName: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, subject: true, complainantName: true, status: true },
      }),
      prisma.letter.findMany({
        where: {
          OR: [
            { subject: { contains: q, mode: "insensitive" } },
            { recipientName: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, subject: true, recipientName: true, status: true },
      }),
      prisma.developmentWork.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, title: true, sector: true, status: true },
      }),
      prisma.speechStorage.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, title: true, location: true, speechDate: true },
      }),
    ]);

    contacts.forEach((c) =>
      results.push({
        id: c.id,
        type: "contact",
        title: c.fullName,
        subtitle: [c.designation, c.organization].filter(Boolean).join(", ") || "Contact",
        link: "/staff/contacts",
      })
    );

    complaints.forEach((c) =>
      results.push({
        id: c.id,
        type: "complaint",
        title: c.subject,
        subtitle: `${c.complainantName} • ${c.status}`,
        link: "/pa/dispatch",
      })
    );

    letters.forEach((l) =>
      results.push({
        id: l.id,
        type: "letter",
        title: l.subject,
        subtitle: `To: ${l.recipientName} • ${l.status}`,
        link: "/pa/letters",
      })
    );

    works.forEach((w) =>
      results.push({
        id: w.id,
        type: "development_work",
        title: w.title,
        subtitle: `${w.sector} • ${w.status}`,
        link: "/pa/development-works",
      })
    );

    speeches.forEach((s) =>
      results.push({
        id: s.id,
        type: "speech",
        title: s.title,
        subtitle: s.location || "Speech",
        link: "/pa/speeches",
      })
    );

    return NextResponse.json({ data: results.slice(0, 15) });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ data: [] });
  }
}
