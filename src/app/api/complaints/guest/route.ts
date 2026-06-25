import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ComplaintStatus, ComplaintPriority } from "@prisma/client";

/**
 * POST /api/complaints/guest
 * Public endpoint to submit a complaint.
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { 
      complainantName, 
      complainantPhone, 
      complainantEmail, 
      subject, 
      description, 
      category, 
      location, 
      attachments 
    } = json;

    // Basic validation
    const missingFields = [];
    if (!complainantName || complainantName.trim() === "") missingFields.push("complainantName");
    if (!subject || subject.trim() === "") missingFields.push("subject");
    if (!description || description.trim() === "") missingFields.push("description");

    if (missingFields.length > 0) {
      console.warn("Guest complaint 400 - Missing fields:", missingFields);
      console.warn("Received payload:", JSON.stringify(json, null, 2));
      return NextResponse.json(
        { 
          error: "Missing required fields", 
          fields: missingFields 
        },
        { status: 400 }
      );
    }

    // Generate a unique reference number
    const referenceNo = `MP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create the complaint
    const complaint = await prisma.complaint.create({
      data: {
        complainantName,
        complainantPhone,
        complainantEmail,
        subject,
        description,
        category,
        location,
        attachments, 
        status: "RECEIVED",
        priority: "MEDIUM",
        referenceNo: referenceNo, // Use the generated reference number
        createdBy: "GUEST", // Tag as guest
      },
    });

    // Create initial activity log
    await prisma.complaint_activities.create({
      data: {
        complaint_id: complaint.id,
        action: "SUBMITTED",
        to_status: "RECEIVED",
        performed_by: "GUEST",
        details: "Complaint submitted by guest user.",
      },
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (err: any) {
    console.error("Guest complaint creation error:", err);
    return NextResponse.json(
      { error: "Failed to submit complaint", message: err.message },
      { status: 500 }
    );
  }
}
