"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatCard, LoadingSpinner } from "@/components/shared/page-helpers";
import { BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#8B5CF6", "#EC4899"];

export default function MPMpladsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/mplads").then((r) => r.json()),
      fetch("/api/mplads/funds").then((r) => r.json()),
    ])
      .then(([p, f]) => { setProjects(p.data || []); setFunds(f.data || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const totalSanctioned = projects.reduce((sum, p) => sum + (p.sanctionAmt || 0), 0);
  const totalReleased = projects.reduce((sum, p) => sum + (p.releasedAmt || 0), 0);
  const totalUtilized = projects.reduce((sum, p) => sum + (p.utilizedAmt || 0), 0);

  const statusData = projects.reduce((acc: Record<string, number>, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const statusChartData = Object.entries(statusData).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <PageHeader title="MPLADS Dashboard" description="Member of Parliament Local Area Development Scheme" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={projects.length} icon={<BarChart3 className="h-5 w-5 text-blue-600" />} />
        <StatCard title="Sanctioned" value={formatCurrency(totalSanctioned)} className="border-l-4 border-l-blue-500" />
        <StatCard title="Released" value={formatCurrency(totalReleased)} className="border-l-4 border-l-green-500" />
        <StatCard title="Utilized" value={formatCurrency(totalUtilized)} className="border-l-4 border-l-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Projects by Status</CardTitle></CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label>
                    {statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-[250px] text-gray-400">No data</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Fund Allocation by Year</CardTitle></CardHeader>
          <CardContent>
            {funds.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={funds}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="allocated" fill="#2563EB" name="Allocated" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="utilized" fill="#16A34A" name="Utilized" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-[250px] text-gray-400">No fund data</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All Projects</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">Project</th><th className="pb-2 pr-4">Status</th><th className="pb-2 pr-4">Sanctioned</th><th className="pb-2 pr-4">Released</th><th className="pb-2">Utilized</th>
              </tr></thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2.5 pr-4 font-medium">{p.work?.title || "—"}</td>
                    <td className="py-2.5 pr-4"><Badge variant="outline">{p.status}</Badge></td>
                    <td className="py-2.5 pr-4">{p.sanctionAmt ? formatCurrency(p.sanctionAmt) : "—"}</td>
                    <td className="py-2.5 pr-4">{p.releasedAmt ? formatCurrency(p.releasedAmt) : "—"}</td>
                    <td className="py-2.5">{p.utilizedAmt ? formatCurrency(p.utilizedAmt) : "—"}</td>
                  </tr>
                ))}
                {projects.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">No projects yet</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
