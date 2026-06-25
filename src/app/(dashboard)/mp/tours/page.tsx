"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/shared/page-helpers";
import { Navigation } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function MPToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tours")
      .then((r) => r.json())
      .then((d) => setTours(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    PLANNED: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Tour Programs" description="View scheduled and past tours" />
      {tours.length === 0 ? (
        <EmptyState icon={<Navigation className="h-12 w-12" />} title="No tours scheduled" description="Tour programs will appear here once planned by the PA." />
      ) : (
        <div className="space-y-4">
          {tours.map((tour) => (
            <Card key={tour.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{tour.title}</CardTitle>
                  <Badge className={statusColors[tour.status] || ""}>{tour.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="text-gray-500">{formatDate(tour.startDate)} — {formatDate(tour.endDate)}</p>
                  {tour.description && <p className="text-gray-600">{tour.description}</p>}
                  {tour.staffNotes && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                      <p className="font-medium text-green-700 mb-1">Staff Notes:</p>
                      <p className="text-green-600">{tour.staffNotes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
