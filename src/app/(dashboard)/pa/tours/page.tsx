"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/shared/page-helpers";
import { Plus, Navigation } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PAToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", startDate: "", endDate: "" });

  useEffect(() => { fetchTours(); }, []);

  async function fetchTours() {
    setLoading(true);
    const res = await fetch("/api/tours");
    const data = await res.json();
    setTours(data.data || []);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!form.title || !form.startDate || !form.endDate) { toast.error("Title and dates are required"); return; }
    const res = await fetch("/api/tours", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Tour created"); setDialogOpen(false); fetchTours(); }
    else toast.error("Failed to create tour");
  }

  const statusColors: Record<string, string> = { PLANNED: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-yellow-100 text-yellow-700", COMPLETED: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700" };

  return (
    <div className="space-y-6">
      <PageHeader title="Tour Hub" description="Plan and manage constituency tours">
        <Button onClick={() => { setForm({ title: "", description: "", startDate: "", endDate: "" }); setDialogOpen(true); }} size="sm"><Plus className="h-4 w-4 mr-1" /> New Tour</Button>
      </PageHeader>
      {loading ? <LoadingSpinner /> : tours.length === 0 ? (
        <EmptyState icon={<Navigation className="h-12 w-12" />} title="No tours" action={<Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Plan Tour</Button>} />
      ) : (
        <div className="space-y-3">{tours.map((tour) => (
          <Card key={tour.id}><CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div><h3 className="font-medium">{tour.title}</h3><p className="text-sm text-gray-500 mt-1">{formatDate(tour.startDate)} — {formatDate(tour.endDate)}</p>{tour.description && <p className="text-sm text-gray-600 mt-2">{tour.description}</p>}</div>
              <Badge className={statusColors[tour.status] || ""}>{tour.status}</Badge>
            </div>
          </CardContent></Card>
        ))}</div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Tour Program</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date *</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><Label>End Date *</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button onClick={handleSubmit}>Create Tour</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
