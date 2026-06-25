import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, logAudit } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const type = request.nextUrl.searchParams.get("type");

    const [letters, questions] = await Promise.all([
      prisma.parliamentLetter.findMany({
        where: type ? { type: type as any } : {},
        orderBy: { createdAt: "desc" },
      }),
      prisma.parliamentQuestion.findMany({
        include: { answers: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ data: { letters, questions } });
  } catch (err) {
    console.error("Parliament error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    if (body.entityType === "letter") {
      const letter = await prisma.parliamentLetter.create({
        data: {
          type: body.type,
          subject: body.subject,
          ministry: body.ministry,
          session: body.session || null,
          dateRaised: body.dateRaised ? new Date(body.dateRaised) : null,
          content: body.content || null,
          createdBy: session.id,
          // New fields
          priority: body.priority || "MEDIUM",
          letterCategory: body.letterCategory || null,
          referenceNo: body.referenceNo || null,
          addressedTo: body.addressedTo || null,
          expectedResponseDate: body.expectedResponseDate ? new Date(body.expectedResponseDate) : null,
          summary: body.summary || null,
          constituencyIssue: body.constituencyIssue || null,
          documentUrl: body.documentUrl || null,
          reminderDate: body.reminderDate ? new Date(body.reminderDate) : null,
          isReminderEnabled: body.isReminderEnabled || false,
        },
      });
      await logAudit(session.id, "CREATE", "parliament_letters", letter.id);
      return NextResponse.json({ data: letter }, { status: 201 });
    }

    if (body.entityType === "question") {
      const question = await prisma.parliamentQuestion.create({
        data: {
          questionNo: body.questionNo || null,
          subject: body.subject,
          ministry: body.ministry,
          session: body.session || null,
          questionDate: body.questionDate ? new Date(body.questionDate) : null,
          questionText: body.questionText,
          createdBy: session.id,
        },
      });
      await logAudit(session.id, "CREATE", "parliament_questions", question.id);
      return NextResponse.json({ data: question }, { status: 201 });
    }

    if (body.entityType === "answer") {
      const answer = await prisma.parliamentAnswer.create({
        data: {
          questionId: body.questionId,
          answerText: body.answerText,
          answeredBy: body.answeredBy || null,
        },
      });
      return NextResponse.json({ data: answer }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });
  } catch (err) {
    console.error("Create parliament error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
