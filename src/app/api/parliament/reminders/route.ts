import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isBefore, addDays, startOfDay } from "date-fns";

/**
 * This route checks for parliament letters that:
 * 1. Are due soon (Expected Response Date)
 * 2. Have a reminder date set for today
 * 
 * It creates notifications for these items.
 * This can be triggered by a CRON job or manually from the dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const today = startOfDay(new Date());
    const threeDaysFromNow = addDays(today, 3);

    // 1. Find letters with reminderDate set for today that haven't been notified yet (simplified logic)
    // In a real app, we'd track if a notification was already sent.
    const lettersWithReminders = await prisma.parliamentLetter.findMany({
      where: {
        isReminderEnabled: true,
        reminderDate: {
          gte: today,
          lt: addDays(today, 1)
        },
        status: { not: "RESOLVED" }
      }
    });

    // 2. Find letters with expectedResponseDate due in 3 days
    const lettersDueSoon = await prisma.parliamentLetter.findMany({
      where: {
        expectedResponseDate: {
          gte: today,
          lt: threeDaysFromNow
        },
        status: { not: "RESOLVED" }
      }
    });

    const notificationsCreated = [];

    // Create notifications for reminders
    for (const letter of lettersWithReminders) {
      const notification = await prisma.notification.create({
        data: {
          userId: "admin", // Default to admin/PA for now, in a real app this would be more specific
          title: "Parliament Follow-up Reminder",
          message: `Reminder to follow up on letter: ${letter.subject} (${letter.referenceNo})`,
          priority: "HIGH",
          link: "/pa/parliament"
        }
      });
      notificationsCreated.push(notification);
    }

    // Create notifications for upcoming deadlines
    for (const letter of lettersDueSoon) {
      const notification = await prisma.notification.create({
        data: {
          userId: "admin",
          title: "Upcoming Response Deadline",
          message: `Response expected soon for: ${letter.subject}. Expected by ${letter.expectedResponseDate?.toLocaleDateString()}`,
          priority: letter.priority === "HIGH" ? "HIGH" : "MEDIUM",
          link: "/pa/parliament"
        }
      });
      notificationsCreated.push(notification);
    }

    return NextResponse.json({ 
      success: true, 
      remindersProcessed: lettersWithReminders.length,
      deadlinesNotified: lettersDueSoon.length,
      notificationsSent: notificationsCreated.length
    });

  } catch (error) {
    console.error("Reminder job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
