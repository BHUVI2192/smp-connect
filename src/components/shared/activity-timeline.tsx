"use client";

import React from "react";
import { formatDate } from "@/lib/utils";

interface Activity {
  id: string;
  action: string;
  details?: string;
  performedBy?: string;
  fromStatus?: string;
  toStatus?: string;
  createdAt: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
  emptyMessage?: string;
}

const actionIcons: Record<string, string> = {
  CREATE: "🆕",
  UPDATE: "✏️",
  STATUS_CHANGE: "🔄",
  COMMENT: "💬",
  UPLOAD: "📎",
  DELETE: "🗑️",
  FORWARD: "↗️",
  APPROVE: "✅",
  REJECT: "❌",
  LOGIN: "🔑",
};

export function ActivityTimeline({ activities, emptyMessage }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        {emptyMessage || "No activity yet"}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="relative flex items-start gap-3 pl-2">
            {/* Dot */}
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border-2 border-gray-200 text-sm">
              {actionIcons[activity.action] || "📌"}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {activity.action.replace(/_/g, " ")}
                </p>
                <time className="text-[10px] text-gray-400 shrink-0">
                  {formatDate(activity.createdAt)}
                </time>
              </div>
              {activity.details && (
                <p className="text-xs text-gray-500 mt-0.5">{activity.details}</p>
              )}
              {activity.fromStatus && activity.toStatus && (
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="line-through">{activity.fromStatus}</span>{" "}
                  → <span className="font-medium text-gray-600">{activity.toStatus}</span>
                </p>
              )}
              {activity.performedBy && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  by {activity.performedBy}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
