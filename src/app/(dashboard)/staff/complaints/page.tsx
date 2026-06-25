"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageHeader, LoadingSpinner, EmptyState, StatCard } from "@/components/shared/page-helpers";
import { StatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import {
  Plus, MessageSquare, Search, Eye, ArrowLeft, Send, Clock,
  AlertTriangle, CheckCircle2, FileText, StickyNote,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type ViewMode = "list" | "create" | "detail";

export default function StaffComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [noteText, setNoteText] = useState("");
  const [form, setForm] = useState({
    subject: "", description: "", complainantName: "", complainantPhone: "",
    complainantEmail: "", category: "", priority: "MEDIUM", location: "",
  });

  useEffect(() => { fetchComplaints(); }, []);

  async function fetchComplaints() {
    setLoading(true);
    const res = await fetch("/api/complaints?pageSize=100");
    const d = await res.json();
    setComplaints(d.data || []);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!form.subject || !form.description || !form.complainantName) {
      toast.error("Subject, description and name required"); return;
    }
    const res = await fetch("/api/complaints", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Complaint registered");
      setDialogOpen(false);
      fetchComplaints();
      setForm({ subject: "", description: "", complainantName: "", complainantPhone: "", complainantEmail: "", category: "", priority: "MEDIUM", location: "" });
    } else toast.error("Failed to register complaint");
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/complaints", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      toast.success(`Status → ${status.replace(/_/g, " ")}`);
      fetchComplaints();
      if (selected?.id === id) setSelected({ ...selected, status });
    }
  }

  const filtered = complaints.filter((c) => {
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
    total: complaints.length,
    pending: complaints.filter((c) => ["RECEIVED", "VERIFIED", "IN_REVIEW"].includes(c.status)).length,
    critical: complaints.filter((c) => c.priority === "CRITICAL" || c.priority === "HIGH").length,
    resolved: complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length,
  };

  // ─── DETAIL VIEW ──────────────────────────────────
  if (viewMode === "detail" && selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setViewMode("list")}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1"><h1 className="text-xl font-bold">{selected.subject}</h1><p className="text-xs text-gray-500">Registered {formatDate(selected.createdAt || selected.created_at)}</p></div>
          <div className="flex gap-2">
            {selected.status === "RECEIVED" && <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "VERIFIED")}>Verify</Button>}
            {selected.status === "VERIFIED" && (
              <>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(selected.id, "REJECTED")}>Reject</Button>
                <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-black border-none" onClick={() => updateStatus(selected.id, "FORWARDED")}><Send className="h-4 w-4 mr-1" /> Forward to PA</Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Complaint Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <StatusBadge status={selected.status} size="md" />
                  <PriorityBadge priority={selected.priority} />
                </div>
                <Separator />
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selected.description}</p>
                </div>
                {selected.location && <div className="text-sm"><span className="text-gray-500">Location:</span> <span className="font-medium">{selected.location}</span></div>}
                {selected.category && <div className="text-sm"><span className="text-gray-500">Category:</span> <span className="font-medium">{selected.category}</span></div>}
                {selected.resolution && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs font-medium text-green-700 mb-1">Resolution</p>
                    <p className="text-sm text-green-800">{selected.resolution}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><StickyNote className="h-4 w-4" /> Internal Notes</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Textarea placeholder="Add an internal note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="min-h-[60px]" />
                  <Button size="sm" disabled={!noteText.trim()} onClick={() => { toast.success("Note added"); setNoteText(""); }}>Add</Button>
                </div>
                <div className="text-center py-4 text-xs text-gray-400">Notes will appear here</div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Complainant</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold">{selected.complainantName || selected.complainant_name}</p>
                {(selected.complainantPhone || selected.complainant_phone) && <p className="text-gray-500">{selected.complainantPhone || selected.complainant_phone}</p>}
                {(selected.complainantEmail || selected.complainant_email) && <p className="text-gray-500">{selected.complainantEmail || selected.complainant_email}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Workflow</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selected.status === "REJECTED" ? (
                    <div className="p-3 bg-red-900/30 text-red-400 rounded-lg border border-red-800 text-sm">
                      This complaint has been rejected.
                    </div>
                  ) : (
                    ["RECEIVED", "VERIFIED", "FORWARDED", "RESOLVED"].map((step, i) => {
                      const steps = ["RECEIVED", "VERIFIED", "FORWARDED", "RESOLVED"];
                      let currentIdx = steps.indexOf(selected.status);
                      // Fallbacks if status is not directly in the simplified path
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
                    })
                  )}
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
      <PageHeader title="Complaints" description="Register, verify and track citizen complaints">
        <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> Register</Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total" value={stats.total} icon={<MessageSquare className="h-5 w-5 text-blue-600" />} />
        <StatCard title="Pending" value={stats.pending} icon={<Clock className="h-5 w-5 text-amber-600" />} />
        <StatCard title="High Priority" value={stats.critical} icon={<AlertTriangle className="h-5 w-5 text-red-600" />} />
        <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input className="pl-10" placeholder="Search complaints..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent>{["ALL", "RECEIVED", "VERIFIED", "IN_REVIEW", "FORWARDED", "RESOLVED", "CLOSED"].map((s) => <SelectItem key={s} value={s}>{s === "ALL" ? "All Status" : s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}><SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent>{["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <SelectItem key={p} value={p}>{p === "ALL" ? "All Priority" : p}</SelectItem>)}</SelectContent></Select>
      </div>

      {/* Data Table */}
      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-12 w-12" />} title="No complaints" action={<Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Register</Button>} />
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full"><thead><tr className="border-b bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
            <th className="text-left py-3 px-4">Subject / Complainant</th>
            <th className="text-left py-3 px-4 hidden md:table-cell">Priority</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-left py-3 px-4 hidden lg:table-cell">Date</th>
            <th className="text-right py-3 px-4">Actions</th>
          </tr></thead><tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4"><button onClick={() => { setSelected(c); setViewMode("detail"); }} className="text-left"><p className="font-medium text-sm text-gray-900 hover:text-blue-600">{c.subject}</p><p className="text-xs text-gray-400 mt-0.5">{c.complainantName || c.complainant_name}</p></button></td>
                <td className="py-3 px-4 hidden md:table-cell"><PriorityBadge priority={c.priority} /></td>
                <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                <td className="py-3 px-4 hidden lg:table-cell text-sm text-gray-500">{formatDate(c.createdAt || c.created_at)}</td>
                <td className="py-3 px-4 text-right"><div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setSelected(c); setViewMode("detail"); }}><Eye className="h-4 w-4" /></Button>
                  {c.status === "RECEIVED" && <Button variant="ghost" size="sm" onClick={() => updateStatus(c.id, "VERIFIED")}>Verify</Button>}
                </div></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Register Complaint</DialogTitle></DialogHeader><div className="space-y-4">
        <div><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
        <div><Label>Complainant Name *</Label><Input value={form.complainantName} onChange={(e) => setForm({ ...form, complainantName: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Phone</Label><Input value={form.complainantPhone} onChange={(e) => setForm({ ...form, complainantPhone: e.target.value })} /></div><div><Label>Email</Label><Input value={form.complainantEmail} onChange={(e) => setForm({ ...form, complainantEmail: e.target.value })} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Roads, Water, etc." /></div><div><Label>Priority</Label><Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div></div>
        <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div><Label>Description *</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></div>
      </div><DialogFooter><Button onClick={handleSubmit}>Register Complaint</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
