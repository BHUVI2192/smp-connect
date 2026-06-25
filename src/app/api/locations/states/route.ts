import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const states = await prisma.state.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ data: states });
  } catch (err) {
    console.error("States error:", err);
    return NextResponse.json({ data: [] });
  }
}
