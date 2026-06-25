import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const speeches = await prisma.speechStorage.findMany({
      orderBy: { speechDate: "desc" },
    });

    return NextResponse.json({ data: speeches });
  } catch (err) {
    console.error("Speeches error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    
    if (!body.title || !body.speechDate || !body.fileUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const speech = await prisma.speechStorage.create({
      data: {
        title: body.title,
        description: body.description || null,
        speechDate: new Date(body.speechDate),
        location: body.location || null,
        fileUrl: body.fileUrl,
        fileType: body.fileType || "audio",
        duration: body.duration ? parseInt(body.duration) : null,
        transcript: body.transcript || null,
        tags: body.tags || [],
        createdBy: session.id,
      },
    });

    try {
      await logAudit(session.id, "CREATE", "speech_storage", speech.id);
    } catch (auditErr) {
      console.error("Speech audit log failed:", auditErr);
    }

    return NextResponse.json({ data: speech }, { status: 201 });
  } catch (err) {
    console.error("Create speech error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
