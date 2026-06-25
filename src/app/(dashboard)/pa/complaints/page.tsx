"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PageHeader, LoadingSpinner, EmptyState, StatCard } from "@/components/shared/page-helpers";
import { StatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import {
  MessageSquare, Search, Eye, ArrowLeft, Send, CheckCircle2,
  AlertTriangle, StickyNote, Smartphone
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type ViewMode = "list" | "detail";

export default function PAComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [noteText, setNoteText] = useState("");

  useEffect(() => { fetchComplaints(); }, []);

  async function fetchComplaints() {
    setLoading(true);
    const res = await fetch("/api/complaints?pageSize=100");
    const d = await res.json();
    setComplaints(d.data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/complaints", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      toast.success(`Status updated to ${status.replace(/_/g, " ")}`);
      fetchComplaints();
      if (selected?.id === id) setSelected({ ...selected, status });
    }
  }

  const handleWhatsAppForward = (complaint: any) => {
    const text = `*Citizen Complaint Details*
*Subject:* ${complaint.subject}
*Location:* ${complaint.location || "N/A"}
*Complainant:* ${complaint.complainantName || complaint.complainant_name} - ${complaint.complainantPhone || complaint.complainant_phone || "No phone"}

*Description:* 
${complaint.description}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Only show complaints that are FORWARDED, RESOLVED, or CLOSED to the PA
  const paApplicableStatuses = ["FORWARDED", "RESOLVED", "CLOSED"];
  const paComplaints = complaints.filter(c => paApplicableStatuses.includes(c.status));

  const filtered = paComplaints.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (priorityFilter !== "ALL" && c.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.subject?.toLowerCase().includes(q) ||
        (c.complainantName || c.complainant_name || "").toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: paComplaints.length,
    forwarded: paComplaints.filter((c) => c.status === "FORWARDED").length,
    critical: paComplaints.filter((c) => c.priority === "CRITICAL" || c.priority === "HIGH").length,
    resolved: paComplaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length,
  };

  // ─── DETAIL VIEW ──────────────────────────────────
  if (viewMode === "detail" && selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setViewMode("list")}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1"><h1 className="text-xl font-bold">{selected.subject}</h1><p className="text-xs text-gray-500">Registered {formatDate(selected.createdAt || selected.created_at)}</p></div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50" onClick={() => handleWhatsAppForward(selected)}>
              <Smartphone className="h-4 w-4 mr-1" /> WhatsApp
            </Button>
            {selected.status === "FORWARDED" && (
              <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-black border-none" onClick={() => updateStatus(selected.id, "RESOLVED")}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Completed
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-[#1A1A1A] border-gray-800 text-gray-100">
              <CardHeader><CardTitle className="text-sm text-gray-300">Complaint Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <StatusBadge status={selected.status} size="md" />
                  <PriorityBadge priority={selected.priority} />
                </div>
                <Separator className="bg-gray-800" />
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">{selected.description}</p>
                </div>
                {selected.location && <div className="text-sm"><span className="text-gray-500">Location:</span> <span className="font-medium text-gray-300">{selected.location}</span></div>}
                {selected.category && <div className="text-sm"><span className="text-gray-500">Category:</span> <span className="font-medium text-gray-300">{selected.category}</span></div>}
                {selected.resolution && (
                  <div className="p-3 bg-green-900/20 rounded-lg border border-green-800 mt-4">
                    <p className="text-xs font-medium text-green-400 mb-1">Resolution</p>
                    <p className="text-sm text-green-300">{selected.resolution}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <Card className="bg-[#1A1A1A] border-gray-800 text-gray-100">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2 text-gray-300"><StickyNote className="h-4 w-4" /> Internal Notes</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Textarea placeholder="Add an internal note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="min-h-[60px] bg-[#222222] border-gray-700 text-gray-100 focus:border-lime-500" />
                  <Button size="sm" disabled={!noteText.trim()} onClick={() => { toast.success("Note added"); setNoteText(""); }}>Add</Button>
                </div>
                <div className="text-center py-4 text-xs text-gray-500">Notes will appear here</div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="bg-[#1A1A1A] border-gray-800 text-gray-100">
              <CardHeader><CardTitle className="text-sm text-gray-300">Complainant</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold text-gray-100">{selected.complainantName || selected.complainant_name}</p>
                {(selected.complainantPhone || selected.complainant_phone) && <p className="text-gray-400">{selected.complainantPhone || selected.complainant_phone}</p>}
                {(selected.complainantEmail || selected.complainant_email) && <p className="text-gray-400">{selected.complainantEmail || selected.complainant_email}</p>}
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-gray-800 text-gray-100">
              <CardHeader><CardTitle className="text-sm text-gray-300">Workflow Tracker</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["RECEIVED", "VERIFIED", "FORWARDED", "RESOLVED"].map((step, i) => {
                    const steps = ["RECEIVED", "VERIFIED", "FORWARDED", "RESOLVED"];
                    let currentIdx = steps.indexOf(selected.status);
                    if (selected.status === "CLOSED") currentIdx = 4;
                    if (selected.status === "IN_REVIEW") currentIdx = 2; // Treat IN_REVIEW as before FORWARDED
                    
                    const isCompleted = i < currentIdx || selected.status === "CLOSED";
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={step} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted ? "bg-lime-500 text-black" : isCurrent ? "bg-[#333333] border border-gray-600 text-white" : "bg-[#1A1A1A] text-gray-500"}`}>
                          {isCompleted ? "✓" : i + 1}
                        </div>
                        <span className={`text-xs ${isCurrent ? "font-semibold text-white" : "text-gray-500"}`}>{step.replace(/_/g, " ")}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────
  return (
    <div className="space-y-5">
      <PageHeader title="Forwarded Complaints" description="Track and resolve complaints forwarded by staff" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Assigned" value={stats.total} icon={<MessageSquare className="h-5 w-5 text-blue-500" />} />
        <StatCard title="Action Required" value={stats.forwarded} icon={<Send className="h-5 w-5 text-amber-500" />} />
        <StatCard title="High Priority" value={stats.critical} icon={<AlertTriangle className="h-5 w-5 text-red-500" />} />
        <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle2 className="h-5 w-5 text-lime-500" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" /><Input className="pl-10 bg-[#1A1A1A] border-gray-800 text-gray-100 placeholder:text-gray-500 focus-visible:ring-lime-500" placeholder="Search complaints..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-[#1A1A1A] border-gray-800 text-gray-100 focus:ring-lime-500"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-gray-800 text-gray-100">
            {["ALL", "FORWARDED", "RESOLVED", "CLOSED"].map((s) => <SelectItem key={s} value={s} className="focus:bg-[#2A2A2A] focus:text-white">{s === "ALL" ? "All Status" : s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 bg-[#1A1A1A] border-gray-800 text-gray-100 focus:ring-lime-500"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-gray-800 text-gray-100">
            {["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <SelectItem key={p} value={p} className="focus:bg-[#2A2A2A] focus:text-white">{p === "ALL" ? "All Priority" : p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-12 w-12" />} title="No complaints assigned" />
      ) : (
        <div className="border border-gray-800 rounded-lg overflow-hidden bg-[#1A1A1A]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-[#111111] text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left py-3 px-4">Subject / Complainant</th>
                <th className="text-left py-3 px-4 hidden md:table-cell">Priority</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4 hidden lg:table-cell">Date</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-800 last:border-0 hover:bg-[#2A2A2A] transition-colors">
                  <td className="py-3 px-4"><button onClick={() => { setSelected(c); setViewMode("detail"); }} className="text-left"><p className="font-medium text-sm text-gray-200 hover:text-lime-400">{c.subject}</p><p className="text-xs text-gray-500 mt-0.5">{c.complainantName || c.complainant_name}</p></button></td>
                  <td className="py-3 px-4 hidden md:table-cell"><PriorityBadge priority={c.priority} /></td>
                  <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                  <td className="py-3 px-4 hidden lg:table-cell text-sm text-gray-500">{formatDate(c.createdAt || c.created_at)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800" onClick={() => { setSelected(c); setViewMode("detail"); }}><Eye className="h-4 w-4" /></Button>
                      {c.status === "FORWARDED" && <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-400 hover:bg-green-900/20" onClick={() => handleWhatsAppForward(c)} title="Forward via WhatsApp"><Smartphone className="h-4 w-4" /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
