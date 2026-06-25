import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/complaints/track?id=MP-XXXXXX
 * Public endpoint to track a complaint by its reference number.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referenceNo = searchParams.get("id");

    if (!referenceNo) {
      return NextResponse.json(
        { error: "Reference ID is required" },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.findUnique({
      where: { referenceNo: referenceNo },
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
        category: true,
        description: true,
        resolution: true,
        complainantName: true,
        complainantPhone: true,
        complainantEmail: true,
        location: true,
        attachments: true,
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "No complaint found with this Reference ID" },
        { status: 404 }
      );
    }

    return NextResponse.json(complaint);
  } catch (err: any) {
    console.error("Complaint track error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
