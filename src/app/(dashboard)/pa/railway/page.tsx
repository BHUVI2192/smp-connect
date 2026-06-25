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
import { PageHeader, LoadingSpinner, EmptyState, StatCard } from "@/components/shared/page-helpers";
import { StatusBadge } from "@/components/shared/status-badge";
import { RailwayEqPreview } from "@/components/railway/railway-eq-preview";
import { Plus, Train, Search, Eye, ArrowLeft, Send, CheckCircle2, Save, Download, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { generateRailwayEqPdf } from "@/lib/pdf-generator";

export default function PARailwayPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [selected, setSelected] = useState<any>(null);
  const [trainSearch, setTrainSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState({
    trainId: "", trainNo: "", trainName: "", passengerName: "", passengerAge: "", passengerGender: "",
    fromStation: "", toStation: "", travelDate: "", coachPreference: "",
    pnrNo: "", remarks: "",
  });

  useEffect(() => { fetchRequests(); }, []);

  async function fetchRequests() {
    setLoading(true);
    const res = await fetch("/api/railway");
    const data = await res.json();
    setRequests(data.data || []);
    setLoading(false);
  }

  async function searchTrains(query: string) {
    setTrainSearch(query);
    if (query.length < 2) { setTrains([]); return; }
    const res = await fetch(`/api/railway?type=trains&search=${encodeURIComponent(query)}`);
    const data = await res.json();
    setTrains(data.data || []);
  }

  async function handleSubmit() {
    if (!form.trainId || !form.passengerName || !form.fromStation || !form.toStation || !form.travelDate) {
      toast.error("Fill required fields"); return;
    }
    const res = await fetch("/api/railway", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("EQ request created"); setViewMode("list"); fetchRequests(); }
    else toast.error("Failed");
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/railway", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (res.ok) { toast.success("Updated"); fetchRequests(); setSelected(null); }
  }

  const filtered = statusFilter === "ALL" ? requests : requests.filter((r) => r.status === statusFilter);
  const stats = {
    total: requests.length,
    draft: requests.filter((r) => r.status === "DRAFT").length,
    submitted: requests.filter((r) => r.status === "SUBMITTED").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
  };

  // ─── DETAIL VIEW ──────────────────────────────
  if (selected) {
    const r = selected;
    return (
      <div className="space-y-4">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{r.passengerName || r.passenger_name}</h1>
              <p className="text-xs text-gray-500 font-mono">
                EQ Request &bull; {formatDate(r.travelDate || r.travel_date)} &bull; PNR: {r.pnrNo || r.pnr_no || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={r.status} size="md" />
            {/* E-Sign Upload */}
            <input
              type="file"
              accept="image/*"
              id="eq-esign-upload"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setSelected({ ...r, _signatureUrl: url });
                  toast.success("E-Sign applied to preview");
                }
              }}
            />
            <Button size="sm" variant="outline" onClick={() => document.getElementById("eq-esign-upload")?.click()}>
              <FileText className="h-4 w-4 mr-1" /> Apply E-Sign
            </Button>
            <Button size="sm" onClick={async () => {
              if (r.status !== "APPROVED") {
                await updateStatus(r.id, "APPROVED");
              }
              const filename = `RailwayEQ_${r.pnrNo || r.pnr_no || r.id}.pdf`;
              toast.promise(
                generateRailwayEqPdf(
                  {
                    passengerName: r.passengerName || r.passenger_name || "",
                    passengerAge: r.passengerAge || r.passenger_age || "",
                    passengerGender: r.passengerGender || r.passenger_gender || "",
                    fromStation: r.fromStation || r.from_station || "",
                    toStation: r.toStation || r.to_station || "",
                    travelDate: r.travelDate || r.travel_date || "",
                    coachPreference: r.coachPreference || r.coach_preference || "",
                    pnrNo: r.pnrNo || r.pnr_no || "",
                    trainNo: r.train?.trainNo || r.train?.train_no || "",
                    trainName: r.train?.trainName || r.train?.train_name || "",
                    remarks: r.remarks || "",
                    signatureUrl: r._signatureUrl,
                  },
                  filename
                ),
                {
                  loading: "Generating professional PDF...",
                  success: "PDF downloaded successfully!",
                  error: "Failed to generate PDF",
                }
              );
            }}>
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
          </div>
        </div>

        {/* Details + Preview */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Meta */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Travel Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Status</span><StatusBadge status={r.status} /></div>
              <hr />
              <div className="flex justify-between"><span className="text-gray-500">Train</span><span className="font-medium text-right">{r.train?.trainNo || r.train?.train_no} — {r.train?.trainName || r.train?.train_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Route</span><span className="text-right">{r.fromStation || r.from_station} → {r.toStation || r.to_station}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Travel Date</span><span>{formatDate(r.travelDate || r.travel_date, "long")}</span></div>
              {(r.coachPreference || r.coach_preference) && (
                <div className="flex justify-between"><span className="text-gray-500">Coach</span><span>{r.coachPreference || r.coach_preference}</span></div>
              )}
              {(r.pnrNo || r.pnr_no) && (
                <div className="flex justify-between"><span className="text-gray-500">PNR</span><span className="font-mono font-semibold">{r.pnrNo || r.pnr_no}</span></div>
              )}
              <hr />
              <div className="flex justify-between"><span className="text-gray-500">Passenger</span><span className="font-semibold">{r.passengerName || r.passenger_name}</span></div>
              {(r.passengerAge || r.passenger_age) && (
                <div className="flex justify-between"><span className="text-gray-500">Age / Gender</span><span>{r.passengerAge || r.passenger_age} Yrs / {r.passengerGender || r.passenger_gender}</span></div>
              )}
              {r.remarks && (
                <>
                  <hr />
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 font-medium">Remarks:</span>
                    <span className="p-2 bg-yellow-50 rounded-md text-yellow-800 text-xs">{r.remarks}</span>
                  </div>
                </>
              )}
              {r._signatureUrl && (
                <>
                  <hr />
                  <div className="flex flex-col gap-1">
                    <span className="text-green-600 font-medium text-xs flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> E-Sign Applied
                    </span>
                    <img src={r._signatureUrl} alt="E-Sign" className="h-10 object-contain border rounded p-1 bg-gray-50" />
                  </div>
                </>
              )}
              <hr />
              {r.status === "DRAFT" && (
                <Button size="sm" className="w-full" variant="outline" onClick={() => updateStatus(r.id, "SUBMITTED")}>
                  <Send className="h-4 w-4 mr-1" /> Submit Request
                </Button>
              )}
              {r.status === "SUBMITTED" && (
                <Button size="sm" className="w-full" variant="outline" onClick={() => updateStatus(r.id, "APPROVED")}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="xl:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Document Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <RailwayEqPreview
                  passengerName={r.passengerName || r.passenger_name || ""}
                  passengerAge={r.passengerAge || r.passenger_age || ""}
                  passengerGender={r.passengerGender || r.passenger_gender || ""}
                  fromStation={r.fromStation || r.from_station || ""}
                  toStation={r.toStation || r.to_station || ""}
                  travelDate={r.travelDate || r.travel_date || ""}
                  coachPreference={r.coachPreference || r.coach_preference || ""}
                  pnrNo={r.pnrNo || r.pnr_no || ""}
                  trainNo={r.train?.trainNo || r.train?.train_no || ""}
                  trainName={r.train?.trainName || r.train?.train_name || ""}
                  remarks={r.remarks || ""}
                  signatureUrl={r._signatureUrl}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ─── CREATE VIEW ──────────────────────────────
  if (viewMode === "create") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")}><ArrowLeft className="h-5 w-5" /></Button>
            <div><h1 className="text-xl font-bold">New EQ Request</h1><p className="text-xs text-gray-500">Draft an emergency quota request</p></div>
          </div>
          <Button onClick={handleSubmit}><Save className="h-4 w-4 mr-1" /> Create Request</Button>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" style={{ minHeight: "calc(100vh - 180px)" }}>
          <Card className="overflow-auto"><CardHeader className="pb-3"><CardTitle className="text-sm">Passenger Details</CardTitle></CardHeader><CardContent>
            <div className="space-y-4">
              <div><Label>Search Train *</Label><div className="relative"><Input value={trainSearch} onChange={(e) => searchTrains(e.target.value)} placeholder="Type train number or name..." />{trains.length > 0 && <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-auto bg-white border rounded-md shadow-lg z-50">{trains.map((t) => <button key={t.id} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => { setForm({ ...form, trainId: t.id.toString(), trainNo: t.trainNo || t.train_no, trainName: t.trainName || t.train_name, fromStation: t.fromStation || t.from_station, toStation: t.toStation || t.to_station }); setTrainSearch(`${t.trainNo || t.train_no} — ${t.trainName || t.train_name}`); setTrains([]); }}>{t.trainNo || t.train_no} — {t.trainName || t.train_name}</button>)}</div>}</div></div>
              <div><Label>Passenger Name *</Label><Input value={form.passengerName} onChange={(e) => setForm({ ...form, passengerName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Age</Label><Input type="number" value={form.passengerAge} onChange={(e) => setForm({ ...form, passengerAge: e.target.value })} /></div><div><Label>Gender</Label><Select value={form.passengerGender} onValueChange={(v) => setForm({ ...form, passengerGender: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>From *</Label><Input value={form.fromStation} onChange={(e) => setForm({ ...form, fromStation: e.target.value })} /></div><div><Label>To *</Label><Input value={form.toStation} onChange={(e) => setForm({ ...form, toStation: e.target.value })} /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Date *</Label><Input type="date" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} /></div><div><Label>Coach</Label><Input value={form.coachPreference} onChange={(e) => setForm({ ...form, coachPreference: e.target.value })} placeholder="2A, 3A, SL" /></div></div>
              <div><Label>PNR</Label><Input value={form.pnrNo} onChange={(e) => setForm({ ...form, pnrNo: e.target.value })} /></div>
              <div><Label>Remarks</Label><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} /></div>
            </div>
          </CardContent></Card>
          
          <Card className="overflow-hidden"><CardHeader className="pb-3"><CardTitle className="text-sm">Preview</CardTitle></CardHeader><CardContent className="p-4 bg-gray-50 border-t">
            <RailwayEqPreview {...form} />
          </CardContent></Card>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────
  return (
    <div className="space-y-5">
      <PageHeader title="Railway EQ" description="Emergency Quota request tracking">
        <Button onClick={() => { setForm({ trainId: "", trainNo: "", trainName: "", passengerName: "", passengerAge: "", passengerGender: "", fromStation: "", toStation: "", travelDate: "", coachPreference: "", pnrNo: "", remarks: "" }); setTrainSearch(""); setViewMode("create"); }} size="sm"><Plus className="h-4 w-4 mr-1" /> New Request</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total" value={stats.total} icon={<Train className="h-5 w-5 text-blue-600" />} />
        <StatCard title="Draft" value={stats.draft} />
        <StatCard title="Submitted" value={stats.submitted} />
        <StatCard title="Approved" value={stats.approved} />
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{["ALL", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED"].map((s) => <SelectItem key={s} value={s}>{s === "ALL" ? "All" : s}</SelectItem>)}</SelectContent></Select>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={<Train className="h-12 w-12" />} title="No requests" /> : (
        <div className="border rounded-lg overflow-hidden bg-white"><table className="w-full"><thead><tr className="border-b bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider"><th className="text-left py-3 px-4">Passenger</th><th className="text-left py-3 px-4 hidden md:table-cell">Train</th><th className="text-left py-3 px-4 hidden lg:table-cell">Route</th><th className="text-left py-3 px-4">Status</th><th className="text-right py-3 px-4">View</th></tr></thead><tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelected(r)}>
              <td className="py-3 px-4"><p className="font-medium text-sm">{r.passengerName || r.passenger_name}</p><p className="text-xs text-gray-400">{formatDate(r.travelDate || r.travel_date)}</p></td>
              <td className="py-3 px-4 hidden md:table-cell text-sm text-gray-600">{r.train?.trainNo || r.train?.train_no} — {r.train?.trainName || r.train?.train_name}</td>
              <td className="py-3 px-4 hidden lg:table-cell text-sm text-gray-500">{r.fromStation || r.from_station} → {r.toStation || r.to_station}</td>
              <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
              <td className="py-3 px-4 text-right"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></td>
            </tr>
          ))}
        </tbody></table></div>
      )}
    </div>
  );
}
