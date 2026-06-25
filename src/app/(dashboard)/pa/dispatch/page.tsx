"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageHeader, LoadingSpinner, EmptyState, StatCard } from "@/components/shared/page-helpers";
import { StatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import {
  Send, ArrowRight, CheckCircle2, Eye, ArrowLeft, Search,
  MessageSquare, Clock, AlertTriangle, XCircle, StickyNote,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PADispatchPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [resolution, setResolution] = useState("");

  useEffect(() => { fetchComplaints(); }, []);

  async function fetchComplaints() {
    setLoading(true);
    const res = await fetch("/api/complaints?pageSize=200");
    const data = await res.json();
    setComplaints(data.data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string, extra?: Record<string, any>) {
    const res = await fetch("/api/complaints", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, ...extra }),
    });
    if (res.ok) { toast.success(`Status → ${status.replace(/_/g, " ")}`); fetchComplaints(); setSelected(null); }
  }

  const tabs = [
    { value: "all", label: "All", statuses: null },
    { value: "received", label: "New", statuses: ["RECEIVED"] },
    { value: "verified", label: "Verified", statuses: ["VERIFIED"] },
    { value: "review", label: "In Review", statuses: ["IN_REVIEW"] },
    { value: "forwarded", label: "Forwarded", statuses: ["FORWARDED"] },
    { value: "resolved", label: "Resolved", statuses: ["RESOLVED", "CLOSED"] },
  ];

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => !["RESOLVED", "CLOSED", "REJECTED"].includes(c.status)).length,
    critical: complaints.filter((c) => c.priority === "CRITICAL").length,
  };

  // ─── DETAIL VIEW ──────────────────────────────
  if (selected) {
    const c = selected;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1"><h1 className="text-xl font-bold">{c.subject}</h1><p className="text-xs text-gray-500">{c.complainantName || c.complainant_name} &bull; {formatDate(c.createdAt || c.created_at)}</p></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card><CardContent className="py-4 space-y-3">
              <div className="flex gap-3"><StatusBadge status={c.status} size="md" /><PriorityBadge priority={c.priority} /></div>
              <Separator />
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.description}</p>
              {c.location && <p className="text-sm text-gray-500">📍 {c.location}</p>}
            </CardContent></Card>

            {/* Actions based on status */}
            <Card><CardHeader><CardTitle className="text-sm">Actions</CardTitle></CardHeader><CardContent className="space-y-3">
              {c.status === "RECEIVED" && <Button className="w-full" onClick={() => updateStatus(c.id, "VERIFIED")}><CheckCircle2 className="h-4 w-4 mr-2" />Verify & Accept</Button>}
              {c.status === "VERIFIED" && <Button className="w-full" onClick={() => updateStatus(c.id, "IN_REVIEW")}><ArrowRight className="h-4 w-4 mr-2" />Move to Review</Button>}
              {c.status === "IN_REVIEW" && (
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => updateStatus(c.id, "FORWARDED")}><Send className="h-4 w-4 mr-2" />Forward to Department</Button>
                  <Button className="w-full" variant="outline" onClick={() => updateStatus(c.id, "REJECTED")}><XCircle className="h-4 w-4 mr-2" />Reject</Button>
                </div>
              )}
              {c.status === "FORWARDED" && (
                <div className="space-y-2">
                  <Textarea placeholder="Enter resolution details..." value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} />
                  <Button className="w-full" disabled={!resolution.trim()} onClick={() => { updateStatus(c.id, "RESOLVED", { resolution }); setResolution(""); }}><CheckCircle2 className="h-4 w-4 mr-2" />Mark Resolved</Button>
                </div>
              )}
              {(c.status === "RESOLVED" || c.status === "CLOSED") && c.resolution && (
                <div className="p-3 bg-green-50 rounded-lg"><p className="text-xs font-medium text-green-700 mb-1">Resolution</p><p className="text-sm text-green-800">{c.resolution}</p></div>
              )}
            </CardContent></Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card><CardHeader><CardTitle className="text-sm">Complainant</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
              <p className="font-semibold">{c.complainantName || c.complainant_name}</p>
              {(c.complainantPhone || c.complainant_phone) && <p className="text-gray-500">📞 {c.complainantPhone || c.complainant_phone}</p>}
              {(c.complainantEmail || c.complainant_email) && <p className="text-gray-500">✉️ {c.complainantEmail || c.complainant_email}</p>}
            </CardContent></Card>

            <Card><CardHeader><CardTitle className="text-sm">Workflow Progress</CardTitle></CardHeader><CardContent>
              <div className="space-y-2">
                {["RECEIVED", "VERIFIED", "IN_REVIEW", "FORWARDED", "RESOLVED"].map((step, i) => {
                  const currentIdx = ["RECEIVED", "VERIFIED", "IN_REVIEW", "FORWARDED", "RESOLVED"].indexOf(c.status);
                  const done = i < currentIdx; const active = i === currentIdx;
                  return (<div key={step} className="flex items-center gap-2"><div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? "bg-green-500 text-white" : active ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400"}`}>{done ? "✓" : i + 1}</div><span className={`text-xs ${active ? "font-semibold" : "text-gray-400"}`}>{step.replace(/_/g, " ")}</span></div>);
                })}
              </div>
            </CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────
  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <PageHeader title="Dispatch Hub" description="Complaint workflow: Citizen → Staff → PA → Resolution" />

      <div className="grid grid-cols-3 gap-3">
        <StatCard title="Total" value={stats.total} icon={<MessageSquare className="h-5 w-5 text-blue-600" />} />
        <StatCard title="Active" value={stats.pending} icon={<Clock className="h-5 w-5 text-amber-600" />} />
        <StatCard title="Critical" value={stats.critical} icon={<AlertTriangle className="h-5 w-5 text-red-600" />} />
      </div>

      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input className="pl-10" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">{tabs.map((t) => { const count = t.statuses ? complaints.filter((c) => t.statuses!.includes(c.status)).length : complaints.length; return <TabsTrigger key={t.value} value={t.value}>{t.label} ({count})</TabsTrigger>; })}</TabsList>
        {tabs.map((tab) => {
          const items = tab.statuses ? complaints.filter((c) => tab.statuses!.includes(c.status)) : complaints;
          const searchFiltered = searchQuery ? items.filter((c) => c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || (c.complainantName || c.complainant_name || "").toLowerCase().includes(searchQuery.toLowerCase())) : items;
          return (
            <TabsContent key={tab.value} value={tab.value}>
              {searchFiltered.length === 0 ? <EmptyState icon={<MessageSquare className="h-12 w-12" />} title="No complaints" /> : (
                <div className="border rounded-lg overflow-hidden bg-white mt-3"><table className="w-full"><thead><tr className="border-b bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider"><th className="text-left py-3 px-4">Subject</th><th className="text-left py-3 px-4 hidden md:table-cell">Priority</th><th className="text-left py-3 px-4">Status</th><th className="text-left py-3 px-4 hidden lg:table-cell">Date</th><th className="text-right py-3 px-4">Action</th></tr></thead><tbody>
                  {searchFiltered.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelected(c)}>
                      <td className="py-3 px-4"><p className="font-medium text-sm">{c.subject}</p><p className="text-xs text-gray-400">{c.complainantName || c.complainant_name}</p></td>
                      <td className="py-3 px-4 hidden md:table-cell"><PriorityBadge priority={c.priority} /></td>
                      <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                      <td className="py-3 px-4 hidden lg:table-cell text-sm text-gray-500">{formatDate(c.createdAt || c.created_at)}</td>
                      <td className="py-3 px-4 text-right"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></td>
                    </tr>
                  ))}
                </tbody></table></div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
