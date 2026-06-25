import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const panchayatId = request.nextUrl.searchParams.get("panchayatId");
    if (!panchayatId) return NextResponse.json({ data: [] });

    const villages = await prisma.village.findMany({
      where: { panchayatId: parseInt(panchayatId) },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: villages });
  } catch (err) {
    console.error("Villages error:", err);
    return NextResponse.json({ data: [] });
  }
}
