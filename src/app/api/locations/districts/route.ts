import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const stateId = request.nextUrl.searchParams.get("stateId");
    if (!stateId) return NextResponse.json({ data: [] });

    const districts = await prisma.district.findMany({
      where: { stateId: parseInt(stateId) },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: districts });
  } catch (err) {
    console.error("Districts error:", err);
    return NextResponse.json({ data: [] });
  }
}
