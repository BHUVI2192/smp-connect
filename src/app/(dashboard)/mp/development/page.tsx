"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/shared/page-helpers";
import { Building2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function MPDevelopmentPage() {
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    const params = new URLSearchParams();
    if (sectorFilter !== "ALL") params.set("sector", sectorFilter);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    fetch(`/api/development-works?${params}`)
      .then((r) => r.json())
      .then((d) => setWorks(d.data || []))
      .finally(() => setLoading(false));
  }, [sectorFilter, statusFilter]);

  const sectors = ["ALL", "ROADS", "BRIDGES", "WATER", "ELECTRICITY", "EDUCATION", "HEALTH", "AGRICULTURE", "HOUSING", "SANITATION", "TELECOM", "RAILWAYS", "OTHER"];
  const statuses = ["ALL", "PROPOSED", "APPROVED", "IN_PROGRESS", "COMPLETED", "DELAYED", "CANCELLED"];
  const statusColors: Record<string, string> = { PROPOSED: "bg-gray-100 text-gray-700", APPROVED: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-yellow-100 text-yellow-700", COMPLETED: "bg-green-100 text-green-700", DELAYED: "bg-red-100 text-red-700", CANCELLED: "bg-gray-200 text-gray-600" };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Development Works" description="All constituency development projects" />
      <div className="flex flex-wrap gap-3">
        <Select value={sectorFilter} onValueChange={setSectorFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Sector" /></SelectTrigger>
          <SelectContent>{sectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {works.length === 0 ? (
        <EmptyState icon={<Building2 className="h-12 w-12" />} title="No development works" description="No works match the current filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {works.map((work) => (
            <Card key={work.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{work.title}</CardTitle>
                  <Badge className={statusColors[work.status] || ""}>{work.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Sector</span><span>{work.sector}</span></div>
                  {work.budget && <div className="flex justify-between"><span className="text-gray-500">Budget</span><span>{formatCurrency(work.budget)}</span></div>}
                  {work.location && <div className="flex justify-between"><span className="text-gray-500">Location</span><span>{work.location}</span></div>}
                  {work.startDate && <div className="flex justify-between"><span className="text-gray-500">Timeline</span><span>{formatDate(work.startDate)} — {work.endDate ? formatDate(work.endDate) : "Ongoing"}</span></div>}
                  {work.description && <p className="text-gray-600 mt-2 text-xs">{work.description}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
