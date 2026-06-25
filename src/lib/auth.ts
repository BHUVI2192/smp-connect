import { createSupabaseServer } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import type { UserSession } from "@/types";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export async function getSession(): Promise<UserSession | null> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Try by authId first
    let profile = await prisma.profile.findUnique({
      where: { authId: user.id },
    });

    // Fallback: try by email (handles UUID mismatch)
    if (!profile && user.email) {
      profile = await prisma.profile.findUnique({
        where: { email: user.email },
      });

      // Auto-fix the authId mapping
      if (profile) {
        await prisma.profile
          .update({
            where: { email: user.email },
            data: { authId: user.id },
          })
          .catch(() => {});
      }
    }

    if (!profile) return null;

    return {
      id: profile.id,
      authId: profile.authId,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
      avatarUrl: profile.avatarUrl,
    };
  } catch (err) {
    console.error("getSession error:", err);
    return null;
  }
}

export async function requireAuth(
  allowedRoles?: Role[]
): Promise<UserSession> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect("/unauthorized");
  }

  return session;
}

export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: (details as any) ?? undefined,
      },
    });
  } catch (err) {
    console.error("Audit log error:", err);
    // Never fail operations because of audit logging
  }
}
