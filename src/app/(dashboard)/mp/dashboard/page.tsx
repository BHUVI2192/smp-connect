"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, StatCard, LoadingSpinner } from "@/components/shared/page-helpers";
import { StatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import { Building2, MessageSquare, Mail, Users, CalendarDays, BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#2563EB", "#DC2626", "#16A34A", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];

export default function MPDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((d) => setData(d.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-center py-12 text-gray-500">Failed to load</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Constituency operations overview" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard title="Today's Events" value={data.todayEvents} icon={<CalendarDays className="h-5 w-5 text-blue-600" />} />
        <StatCard title="Active Complaints" value={data.complaints.pending} description={`${data.complaints.total} total`} icon={<MessageSquare className="h-5 w-5 text-orange-600" />} />
        <StatCard title="Dev. Works" value={data.works.inProgress} description={`${data.works.total} total`} icon={<Building2 className="h-5 w-5 text-green-600" />} />
        <StatCard title="Pending Letters" value={data.letters.pending} icon={<Mail className="h-5 w-5 text-purple-600" />} />
        <StatCard title="Contacts" value={data.totalContacts} icon={<Users className="h-5 w-5 text-cyan-600" />} />
        <StatCard title="MPLADS" value={formatCurrency(data.mplads.sanctioned)} description={`${data.mplads.total} projects`} icon={<BarChart3 className="h-5 w-5 text-red-600" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Complaints by Status</CardTitle></CardHeader><CardContent>
          {data.complaintsByStatus?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={data.complaintsByStatus} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="count" nameKey="status" label={({ status, count }) => `${count}`}>{data.complaintsByStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: "11px" }} /></PieChart></ResponsiveContainer>
          ) : <div className="h-[240px] flex items-center justify-center text-gray-300">No data</div>}
        </CardContent></Card>

        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Works by Sector</CardTitle></CardHeader><CardContent>
          {data.worksBySector?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}><BarChart data={data.worksBySector}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={55} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
          ) : <div className="h-[240px] flex items-center justify-center text-gray-300">No data</div>}
        </CardContent></Card>
      </div>

      {/* MPLADS Fund + Recent Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">MPLADS Summary</CardTitle></CardHeader><CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center"><p className="text-[10px] text-blue-600 uppercase font-medium">Sanctioned</p><p className="text-lg font-bold text-blue-900">{formatCurrency(data.mplads.sanctioned)}</p></div>
            <div className="p-3 bg-green-50 rounded-lg text-center"><p className="text-[10px] text-green-600 uppercase font-medium">Released</p><p className="text-lg font-bold text-green-900">{formatCurrency(data.mplads.released)}</p></div>
            <div className="p-3 bg-amber-50 rounded-lg text-center"><p className="text-[10px] text-amber-600 uppercase font-medium">Utilized</p><p className="text-lg font-bold text-amber-900">{formatCurrency(data.mplads.utilized)}</p></div>
          </div>
        </CardContent></Card>

        <Card className="lg:col-span-2"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Recent Complaints</CardTitle></CardHeader><CardContent>
          {data.recentComplaints?.length > 0 ? (
            <div className="space-y-2">{data.recentComplaints.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{c.subject}</p><p className="text-xs text-gray-400">{c.complainantName || c.complainant_name} &bull; {formatDate(c.createdAt || c.created_at)}</p></div>
                <div className="flex items-center gap-2 ml-3"><PriorityBadge priority={c.priority} /><StatusBadge status={c.status} /></div>
              </div>
            ))}</div>
          ) : <div className="py-8 text-center text-gray-300">No complaints</div>}
        </CardContent></Card>
      </div>
    </div>
  );
}
