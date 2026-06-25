import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const talukId = request.nextUrl.searchParams.get("talukId");
    if (!talukId) return NextResponse.json({ data: [] });

    const panchayats = await prisma.panchayat.findMany({
      where: { talukId: parseInt(talukId) },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: panchayats });
  } catch (err) {
    console.error("Panchayats error:", err);
    return NextResponse.json({ data: [] });
  }
}
