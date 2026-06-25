import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return NextResponse.json({ data: notifications, unreadCount });
  } catch (err) {
    console.error("Notifications error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, message, priority, link } = body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        priority: priority || "MEDIUM",
        link,
      },
    });

    return NextResponse.json({ data: notification });
  } catch (err) {
    console.error("Create notification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
