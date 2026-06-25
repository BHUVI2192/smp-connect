"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PageHeader, StatCard, LoadingSpinner, EmptyState } from "@/components/shared/page-helpers";
import { StatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import { MessageSquare, Clock, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ["#F59E0B", "#2563EB", "#8B5CF6", "#16A34A", "#DC2626", "#6B7280", "#EC4899"];

export default function MPComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/complaints?pageSize=200").then((r) => r.json()).then((d) => setComplaints(d.data || [])).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => ["RECEIVED", "VERIFIED", "IN_REVIEW"].includes(c.status)).length,
    critical: complaints.filter((c) => c.priority === "CRITICAL" || c.priority === "HIGH").length,
    resolved: complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length,
  };

  const statusCounts = complaints.reduce((acc: Record<string, number>, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
  const chartData = Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  const priorityCounts = complaints.reduce((acc: Record<string, number>, c) => { acc[c.priority] = (acc[c.priority] || 0) + 1; return acc; }, {});
  const priorityData = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));

  const filtered = complaints.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (searchQuery) return c.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Complaint Insights" description="Analytics and overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total" value={stats.total} icon={<MessageSquare className="h-5 w-5 text-blue-600" />} />
        <StatCard title="Pending" value={stats.pending} icon={<Clock className="h-5 w-5 text-amber-600" />} />
        <StatCard title="High Priority" value={stats.critical} icon={<AlertTriangle className="h-5 w-5 text-red-600" />} />
        <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">By Status</CardTitle></CardHeader><CardContent>
          {chartData.length > 0 ? <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={chartData} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" nameKey="name" label>{chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: "11px" }} /></PieChart></ResponsiveContainer> : <div className="h-[220px] flex items-center justify-center text-gray-300">No data</div>}
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">By Priority</CardTitle></CardHeader><CardContent>
          {priorityData.length > 0 ? <ResponsiveContainer width="100%" height={220}><BarChart data={priorityData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{priorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer> : <div className="h-[220px] flex items-center justify-center text-gray-300">No data</div>}
        </CardContent></Card>
      </div>

      {/* Complaint List */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input className="pl-10" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{["ALL", "RECEIVED", "VERIFIED", "IN_REVIEW", "FORWARDED", "RESOLVED", "CLOSED"].map((s) => <SelectItem key={s} value={s}>{s === "ALL" ? "All Status" : s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
      </div>

      {filtered.length === 0 ? <EmptyState icon={<MessageSquare className="h-12 w-12" />} title="No complaints match" /> : (
        <div className="border rounded-lg overflow-hidden bg-white"><table className="w-full"><thead><tr className="border-b bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider"><th className="text-left py-3 px-4">Subject</th><th className="text-left py-3 px-4 hidden md:table-cell">Priority</th><th className="text-left py-3 px-4">Status</th><th className="text-left py-3 px-4 hidden lg:table-cell">Date</th></tr></thead><tbody>
          {filtered.map((c) => (
            <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50/50">
              <td className="py-3 px-4"><p className="font-medium text-sm">{c.subject}</p><p className="text-xs text-gray-400">{c.complainantName || c.complainant_name}</p></td>
              <td className="py-3 px-4 hidden md:table-cell"><PriorityBadge priority={c.priority} /></td>
              <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
              <td className="py-3 px-4 hidden lg:table-cell text-sm text-gray-500">{formatDate(c.createdAt || c.created_at)}</td>
            </tr>
          ))}
        </tbody></table></div>
      )}
    </div>
  );
}
