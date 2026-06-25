"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Send, XCircle, Archive, FileText } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  DRAFT: {
    label: "Draft",
    color: "text-gray-700",
    bg: "bg-gray-100",
    icon: <FileText className="h-3.5 w-3.5" />,
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    color: "text-amber-700",
    bg: "bg-amber-100",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  APPROVED: {
    label: "Approved",
    color: "text-green-700",
    bg: "bg-green-100",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  REJECTED: {
    label: "Rejected",
    color: "text-red-700",
    bg: "bg-red-100",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  SENT: {
    label: "Sent",
    color: "text-blue-700",
    bg: "bg-blue-100",
    icon: <Send className="h-3.5 w-3.5" />,
  },
  ARCHIVED: {
    label: "Archived",
    color: "text-purple-700",
    bg: "bg-purple-100",
    icon: <Archive className="h-3.5 w-3.5" />,
  },
};

interface LetterStatusBadgeProps {
  status: string;
}

export function LetterStatusBadge({ status }: LetterStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color} ${config.bg}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

interface LetterWorkflowBarProps {
  status: string;
}

export function LetterWorkflowBar({ status }: LetterWorkflowBarProps) {
  const steps = ["DRAFT", "PENDING_REVIEW", "APPROVED", "SENT"];
  const currentIndex = steps.indexOf(status);
  const isRejected = status === "REJECTED";

  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((step, i) => {
        const config = STATUS_CONFIG[step];
        const isActive = i === currentIndex;
        const isCompleted = i < currentIndex;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? isRejected && step === "PENDING_REVIEW"
                      ? "bg-red-500 text-white"
                      : "bg-blue-500 text-white ring-4 ring-blue-100"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isCompleted ? "✓" : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {config.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mt-[-18px] ${
                  isCompleted ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
