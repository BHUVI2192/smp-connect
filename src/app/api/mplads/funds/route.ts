import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const funds = await prisma.mpladsFund.findMany({ orderBy: { year: "desc" } });
    return NextResponse.json({ data: funds });
  } catch (err) {
    console.error("MPLADS funds error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
