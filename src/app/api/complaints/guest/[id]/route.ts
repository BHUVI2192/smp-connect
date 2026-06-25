import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/complaints/guest/[id]
 * Publicly accessible status check for a complaint.
 * Minimal data exposed for privacy.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        category: true,
        createdAt: true,
        resolution: true,
        // Don't expose private complainant info (Phone, Email, etc.)
      },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    return NextResponse.json(complaint);
  } catch (err: any) {
    console.error("Guest complaint fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
