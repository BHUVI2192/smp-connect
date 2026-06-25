"use client";

import React from "react";

type StatusType =
  | "DRAFT" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
  | "RECEIVED" | "VERIFIED" | "IN_REVIEW" | "FORWARDED" | "RESOLVED" | "CLOSED" | "REJECTED"
  | "PROPOSED" | "APPROVED" | "IN_PROGRESS" | "DELAYED"
  | "PENDING_REVIEW" | "SENT" | "ARCHIVED"
  | "PLANNED" | "SUBMITTED"
  | "RECOMMENDED" | "SANCTIONED" | "RELEASED" | "PENDING"
  | string;

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  // Success / Green
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  APPROVED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  RESOLVED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  CONFIRMED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  RELEASED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  SENT: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },

  // Warning / Amber
  IN_PROGRESS: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  PENDING_REVIEW: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  IN_REVIEW: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  VERIFIED: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  SUBMITTED: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  SANCTIONED: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },

  // Blue / Info
  PLANNED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  FORWARDED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  PROPOSED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  RECOMMENDED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  RECEIVED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },

  // Red / Danger
  REJECTED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  DELAYED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  CLOSED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },

  // Gray / Default
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  ARCHIVED: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

const DEFAULT_STYLE = { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };

interface StatusBadgeProps {
  status: StatusType;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || DEFAULT_STYLE;
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${style.bg} ${style.text} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

// Priority badge
const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  CRITICAL: { bg: "bg-red-100", text: "text-red-800" },
  HIGH: { bg: "bg-orange-100", text: "text-orange-800" },
  MEDIUM: { bg: "bg-blue-100", text: "text-blue-800" },
  LOW: { bg: "bg-gray-100", text: "text-gray-700" },
  URGENT: { bg: "bg-red-100", text: "text-red-800" },
};

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.MEDIUM;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${style.bg} ${style.text}`}>
      {priority === "CRITICAL" && "🔴 "}
      {priority === "HIGH" && "🟠 "}
      {priority}
    </span>
  );
}
