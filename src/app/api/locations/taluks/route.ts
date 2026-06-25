import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const districtId = request.nextUrl.searchParams.get("districtId");
    if (!districtId) return NextResponse.json({ data: [] });

    const taluks = await prisma.taluk.findMany({
      where: { districtId: parseInt(districtId) },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: taluks });
  } catch (err) {
    console.error("Taluks error:", err);
    return NextResponse.json({ data: [] });
  }
}
