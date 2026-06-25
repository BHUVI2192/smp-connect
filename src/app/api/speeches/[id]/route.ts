import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";
import { createRouteHandlerAdminClient } from "@/lib/supabase/route-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const speech = await prisma.speechStorage.findUnique({
      where: { id: params.id },
    });

    if (!speech) return NextResponse.json({ error: "Speech not found" }, { status: 404 });

    return NextResponse.json({ data: speech });
  } catch (err) {
    console.error("Get speech error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const speech = await prisma.speechStorage.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        speechDate: body.speechDate ? new Date(body.speechDate) : undefined,
        location: body.location,
        transcript: body.transcript,
        tags: body.tags,
      },
    });

    await logAudit(session.id, "UPDATE", "speech_storage", speech.id);
    return NextResponse.json({ data: speech });
  } catch (err) {
    console.error("Update speech error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const speech = await prisma.speechStorage.findUnique({
      where: { id: params.id },
    });

    if (!speech) return NextResponse.json({ error: "Speech not found" }, { status: 404 });

    // Delete from Supabase Storage if fileUrl exists
    if (speech.fileUrl) {
      try {
        const supabase = createRouteHandlerAdminClient();
        const urlSegments = speech.fileUrl.split("/");
        const fileName = urlSegments[urlSegments.length - 1];
        // We assume files are in 'speeches/' folder in the 'audio' bucket based on our uploader
        const storagePath = `speeches/${fileName}`;
        
        await supabase.storage.from("audio").remove([storagePath]);
      } catch (storageErr) {
        console.error("Failed to delete speech file from storage:", storageErr);
        // Continue deleting database record even if storage deletion fails
      }
    }

    await prisma.speechStorage.delete({
      where: { id: params.id },
    });

    await logAudit(session.id, "DELETE", "speech_storage", params.id);
    return NextResponse.json({ message: "Speech deleted successfully" });
  } catch (err) {
    console.error("Delete speech error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
