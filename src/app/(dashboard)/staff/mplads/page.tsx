"use client";
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader, LoadingSpinner, EmptyState, StatCard } from "@/components/shared/page-helpers";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Plus, BarChart3, MapPin, IndianRupee, CalendarDays, Building2,
  FileText, TrendingUp, Layers, ArrowLeft, Upload, Trash2, ExternalLink,
  Image as ImageIcon, Check, X, Edit3, AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { uploadFileViaServer, makeMediaPath } from "@/lib/upload-helper";


const SECTORS = ["ROADS", "BRIDGES", "WATER", "ELECTRICITY", "EDUCATION", "HEALTH", "AGRICULTURE", "HOUSING", "SANITATION", "TELECOM", "RAILWAYS", "OTHER"];
const MPLADS_STATUSES = ["RECOMMENDED", "SANCTIONED", "IN_PROGRESS", "COMPLETED", "LAPSED"];

const STATUS_COLORS: Record<string, string> = {
  RECOMMENDED: "bg-blue-50 text-blue-700 border-blue-200",
  SANCTIONED:  "bg-indigo-50 text-indigo-700 border-indigo-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED:   "bg-green-50 text-green-700 border-green-200",
  LAPSED:      "bg-red-50 text-red-700 border-red-200",
};

const emptyForm = {
  title: "", sector: "ROADS", schemeCode: "",
  stateId: "", districtId: "", talukId: "", panchayatId: "", villageId: "",
  sanctionDate: "", releaseDate: "", status: "RECOMMENDED",
  contractor: "", fundSource: "", latitude: "", longitude: "",
  startDate: "", endDate: "", description: "", remarks: "",
  budget: "", budget_used: "",
  sanctionAmt: "", releasedAmt: "", utilizedAmt: "",
  location: "",
};

type ViewMode = "list" | "create" | "edit";

interface UploadedPhoto {
  id: string;         // random ID for keying
  file: File;         // raw File object — uploaded on submit
  previewUrl: string; // local blob URL — for display during creation
  fileType: string;
  fileName: string;
  fileSize: number;
  phase: "BEFORE" | "DURING" | "AFTER";
  caption: string;
}

export default function StaffMpladsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Edit state
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editStep, setEditStep] = useState(1);

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Media state (for create flow)
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploadPhase, setUploadPhase] = useState<"BEFORE" | "DURING" | "AFTER">("BEFORE");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Media upload for existing projects (on detail/edit)
  const existingFileRef = useRef<HTMLInputElement>(null);
  const [existingUploadPhase, setExistingUploadPhase] = useState<"BEFORE" | "DURING" | "AFTER">("DURING");
  const [existingUploadCaption, setExistingUploadCaption] = useState("");
  const [existingUploading, setExistingUploading] = useState(false);
  const [expandedMediaIds, setExpandedMediaIds] = useState<string[]>([]);

  // Location Hierarchy State
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [taluks, setTaluks] = useState<any[]>([]);
  const [panchayats, setPanchayats] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  // Edit Location Helper State
  const [editDistricts, setEditDistricts] = useState<any[]>([]);
  const [editTaluks, setEditTaluks] = useState<any[]>([]);
  const [editPanchayats, setEditPanchayats] = useState<any[]>([]);
  const [editVillages, setEditVillages] = useState<any[]>([]);

  useEffect(() => { 
    fetchProjects(); 
    fetchStates();
  }, []);

  async function fetchStates() {
    try {
      const res = await fetch("/api/locations/states");
      const d = await res.json();
      setStates(d.data || []);
    } catch (err) {}
  }

  async function fetchLoc(type: string, parentId: string, setter: any) {
    if (!parentId) { setter([]); return; }
    try {
      const paramMap: Record<string, string> = {
        districts: "stateId",
        taluks: "districtId",
        panchayats: "talukId",
        villages: "panchayatId"
      };
      const paramName = paramMap[type] || "parentId";
      const res = await fetch(`/api/locations/${type}?${paramName}=${parentId}`);
      const d = await res.json();
      setter(d.data || []);
    } catch (err) {}
  }

  async function fetchProjects() {
    setLoading(true);
    const res = await fetch("/api/mplads", { credentials: "include" });
    if (res.status === 401) {
      toast.error("Session expired — please log in again");
      setTimeout(() => { window.location.href = "/login"; }, 1500);
      setLoading(false);
      return;
    }
    const d = await res.json();
    setProjects(d.data || []);
    setLoading(false);
  }

  // Revoke blob URLs when component unmounts or photos change
  useEffect(() => {
    return () => { photos.forEach((p) => URL.revokeObjectURL(p.previewUrl)); };
  }, [photos]);

  // Add files to the pending list using local blob URLs (no Supabase call yet)
  function addPhotos(files: FileList) {
    const added: UploadedPhoto[] = Array.from(files).map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      fileType: file.type,
      fileName: file.name,
      fileSize: file.size,
      phase: uploadPhase,
      caption: uploadCaption,
    }));
    setPhotos((prev) => [...prev, ...added]);
    setUploadCaption("");
    toast.success(`${added.length} photo(s) added`);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function handleSubmit() {
    if (!form.title || !form.sector) { toast.error("Title and sector are required"); return; }
    setSubmitting(true);

    // 1. Create the MPLADS project
    const res = await fetch("/api/mplads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...form,
        stateId: form.stateId || null,
        districtId: form.districtId || null,
        talukId: form.talukId || null,
        panchayatId: form.panchayatId || null,
        villageId: form.villageId || null,
      }),
    });
    if (res.status === 401) {
      toast.error("Session expired — please log in again", { duration: 5000 });
      setSubmitting(false);
      setTimeout(() => { window.location.href = "/login"; }, 1500);
      return;
    }
    if (!res.ok) {
      toast.error("Failed to create project");
      setSubmitting(false);
      return;
    }
    const created = await res.json();
    const workId = created.data?.workId || created.data?.work?.id;

    // 2. Upload photos via server API and save media records
    if (workId && photos.length > 0) {
      let successCount = 0;
      for (const photo of photos) {
        try {
          const storagePath = makeMediaPath(workId, photo.fileName);
          const publicUrl = await uploadFileViaServer(photo.file, storagePath);

          const mediaRes = await fetch("/api/development-works/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              workId,
              fileUrl: publicUrl,
              fileType: photo.fileType,
              fileName: photo.fileName,
              fileSize: photo.fileSize,
              phase: photo.phase,
              caption: photo.caption,
            }),
          });
          if (mediaRes.ok) successCount++;
          else console.error("Media record failed for", photo.fileName);
        } catch (err: any) {
          toast.error(`Upload failed: ${photo.fileName} — ${err.message}`);
        }
      }
      if (successCount > 0) toast.success(`${successCount} photo(s) uploaded`);
    }

    toast.success("MPLADS project created successfully!");
    setSubmitting(false);
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setForm(emptyForm);
    setPhotos([]);
    setCurrentStep(1);
    setViewMode("list");
    fetchProjects();
  }

  // ─── DELETE project ────────────────────────────────────────────────────
  async function deleteProject() {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const res = await fetch("/api/mplads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: confirmDeleteId }),
    });
    if (res.ok) {
      toast.success("Project deleted");
      setProjects((prev) => prev.filter((p) => p.id !== confirmDeleteId));
    } else {
      toast.error("Failed to delete project");
    }
    setDeleting(false);
    setConfirmDeleteId(null);
    setConfirmDeleteTitle("");
  }

  // ─── EDIT project ──────────────────────────────────────────────────────
  function openEdit(project: any) {
    const w = project.work || {};
    setEditForm({
      id: project.id,
      status: project.status || "RECOMMENDED",
      schemeCode: project.schemeCode || "",
      sanctionAmt: project.sanctionAmt ? String(project.sanctionAmt) : "",
      releasedAmt: project.releasedAmt ? String(project.releasedAmt) : "",
      utilizedAmt: project.utilizedAmt ? String(project.utilizedAmt) : "",
      sanctionDate: project.sanctionDate ? project.sanctionDate.slice(0, 10) : "",
      releaseDate: project.releaseDate ? project.releaseDate.slice(0, 10) : "",
      workId: w.id,
      title: w.title || "",
      description: w.description || "",
      sector: w.sector || "ROADS",
      location: w.location || "",
      latitude: w.latitude ? String(w.latitude) : "",
      longitude: w.longitude ? String(w.longitude) : "",
      contractor: w.contractor || "",
      fundSource: w.fundSource || "",
      startDate: w.startDate ? w.startDate.slice(0, 10) : "",
      endDate: w.endDate ? w.endDate.slice(0, 10) : "",
      remarks: w.remarks || "",
      stateId: w.stateId ? String(w.stateId) : "",
      districtId: w.districtId ? String(w.districtId) : "",
      talukId: w.talukId ? String(w.talukId) : "",
      panchayatId: w.panchayatId ? String(w.panchayatId) : "",
      villageId: w.villageId ? String(w.villageId) : "",
    });

    // Populate edit location dropdowns
    if (w.stateId) fetchLoc("districts", String(w.stateId), setEditDistricts);
    if (w.districtId) fetchLoc("taluks", String(w.districtId), setEditTaluks);
    if (w.talukId) fetchLoc("panchayats", String(w.talukId), setEditPanchayats);
    if (w.panchayatId) fetchLoc("villages", String(w.panchayatId), setEditVillages);

    setEditingProject(project);
    setEditStep(1);
    setViewMode("edit");
  }

  async function saveEdit() {
    setEditSaving(true);
    // 1. Update MPLADS fields
    const mpladsRes = await fetch("/api/mplads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: editForm.id,
        status: editForm.status,
        schemeCode: editForm.schemeCode,
        sanctionAmt: editForm.sanctionAmt,
        releasedAmt: editForm.releasedAmt,
        utilizedAmt: editForm.utilizedAmt,
        sanctionDate: editForm.sanctionDate || null,
        releaseDate: editForm.releaseDate || null,
      }),
    });
    // 2. Update Development Work fields
    if (editForm.workId) {
      await fetch("/api/development-works", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: editForm.workId,
          title: editForm.title,
          description: editForm.description,
          sector: editForm.sector,
          location: editForm.location,
          contractor: editForm.contractor,
          fundSource: editForm.fundSource,
          startDate: editForm.startDate || null,
          endDate: editForm.endDate || null,
          remarks: editForm.remarks,
          stateId: editForm.stateId || null,
          districtId: editForm.districtId || null,
          talukId: editForm.talukId || null,
          panchayatId: editForm.panchayatId || null,
          villageId: editForm.villageId || null,
        }),
      });
    }
    if (mpladsRes.ok) {
      toast.success("Project updated");
      setEditingProject(null);
      fetchProjects();
    } else {
      toast.error("Failed to update project");
    }
    setEditSaving(false);
  }

  // ─── Upload media to an existing project ──────────────────────────────
  async function uploadExistingMedia(files: FileList, workId: string) {
    if (!workId) return;
    setExistingUploading(true);
    let uploadedCount = 0;
    for (const file of Array.from(files)) {
      try {
        const storagePath = makeMediaPath(workId, file.name);
        const publicUrl = await uploadFileViaServer(file, storagePath);

        const r = await fetch("/api/development-works/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            workId,
            fileUrl: publicUrl,
            fileType: file.type,
            fileName: file.name,
            fileSize: file.size,
            phase: existingUploadPhase,
            caption: existingUploadCaption,
          }),
        });
        if (r.ok) uploadedCount++;
        else toast.error(`Failed to save record for ${file.name}`);
      } catch (err: any) {
        toast.error(`Upload failed: ${file.name} — ${err.message}`);
      }
    }
    if (uploadedCount > 0) {
      toast.success(`${uploadedCount} photo(s) uploaded`);
      setExistingUploadCaption("");
      fetchProjects();
    }
    setExistingUploading(false);
  }

  // ─── Delete existing media ─────────────────────────────────────────────
  async function deleteExistingMedia(mediaId: string) {
    const r = await fetch("/api/development-works/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: mediaId }),
    });
    if (r.ok) {
      toast.success("Photo removed");
      fetchProjects();
    } else {
      toast.error("Failed to remove photo");
    }
  }

  // Aggregates
  const totalSanction = projects.reduce((s, p) => s + (p.sanctionAmt || 0), 0);
  const totalReleased = projects.reduce((s, p) => s + (p.releasedAmt || 0), 0);
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;

  if (loading) return <LoadingSpinner />;

  // ─── EDIT VIEW (full-page multi-step, mirrors create) ─────────────────
  if (viewMode === "edit" && editingProject) {
    const STEPS = ["Project Info", "Financial Details", "Location & Dates", "Media"];
    const existingMedia: any[] = editingProject?.work?.media || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setViewMode("list"); setEditingProject(null); setEditStep(1); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Edit MPLADS Project</h1>
            <p className="text-sm text-gray-500 truncate">{editForm.title || "—"}</p>
          </div>
          <Button onClick={saveEdit} disabled={editSaving} className="gap-2">
            {editSaving ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
            ) : (
              <><Check className="h-4 w-4" /> Save Changes</>
            )}
          </Button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <button
                onClick={() => setEditStep(i + 1)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  editStep === i + 1
                    ? "bg-blue-600 text-white font-semibold"
                    : editStep > i + 1
                    ? "bg-green-100 text-green-700 font-medium"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  editStep > i + 1 ? "bg-green-500 text-white" :
                  editStep === i + 1 ? "bg-white text-blue-600" : "bg-gray-200 text-gray-500"
                }`}>
                  {editStep > i + 1 ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{step}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${editStep > i + 1 ? "bg-green-400" : "bg-gray-200"}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 — Project Info */}
        {editStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" /> Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Project Title *</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="e.g. Construction of Road — Village to Main Highway"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Sector *</Label>
                  <Select value={editForm.sector} onValueChange={(v) => setEditForm({ ...editForm, sector: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{MPLADS_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Scheme Code</Label>
                  <Input className="mt-1 font-mono" value={editForm.schemeCode} onChange={(e) => setEditForm({ ...editForm, schemeCode: e.target.value })} placeholder="e.g. MPLAD/KA/2024/001" />
                </div>
                <div>
                  <Label>Fund Source</Label>
                  <Input className="mt-1" value={editForm.fundSource} onChange={(e) => setEditForm({ ...editForm, fundSource: e.target.value })} placeholder="e.g. MPLADS, State Budget" />
                </div>
              </div>
              <div>
                <Label>Contractor / Implementing Agency</Label>
                <Input className="mt-1" value={editForm.contractor} onChange={(e) => setEditForm({ ...editForm, contractor: e.target.value })} placeholder="e.g. KRDCL, Panchayat Raj, Private contractor" />
              </div>
              <div>
                <Label>Remarks</Label>
                <Input className="mt-1" value={editForm.remarks || ""} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} placeholder="Any additional remarks..." />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  className="mt-1"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the project, scope, and its intended benefit..."
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setEditStep(2)}>Next: Financial Details →</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Financial Details */}
        {editStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-600" /> Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Sanction Amount (₹)", key: "sanctionAmt" },
                  { label: "Released Amount (₹)", key: "releasedAmt" },
                  { label: "Utilized Amount (₹)", key: "utilizedAmt" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <div className="relative mt-1">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        type="number"
                        className="pl-8"
                        value={editForm[key] || ""}
                        onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live utilization preview */}
              {editForm.sanctionAmt && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Financial Summary Preview</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-400">Sanctioned</p>
                      <p className="font-bold text-gray-900">{formatCurrency(parseFloat(editForm.sanctionAmt) || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Released</p>
                      <p className="font-bold text-indigo-600">{formatCurrency(parseFloat(editForm.releasedAmt) || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Utilized</p>
                      <p className="font-bold text-green-600">{formatCurrency(parseFloat(editForm.utilizedAmt) || 0)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                      style={{ width: `${Math.min(((parseFloat(editForm.utilizedAmt) || 0) / (parseFloat(editForm.sanctionAmt) || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-center text-xs text-gray-500">
                    {Math.round(((parseFloat(editForm.utilizedAmt) || 0) / (parseFloat(editForm.sanctionAmt) || 1)) * 100)}% Utilized
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setEditStep(1)}>← Back</Button>
                <Button onClick={() => setEditStep(3)}>Next: Location & Dates →</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Location & Dates */}
        {editStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" /> Location & Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Location</p>
                <Separator />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select 
                    value={editForm.stateId} 
                    onValueChange={(v) => {
                      setEditForm({ ...editForm, stateId: v, districtId: "", talukId: "", panchayatId: "", villageId: "" });
                      fetchLoc("districts", v, setEditDistricts);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                    <SelectContent>
                      {states.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>District</Label>
                  <Select 
                    disabled={!editForm.stateId}
                    value={editForm.districtId} 
                    onValueChange={(v) => {
                      setEditForm({ ...editForm, districtId: v, talukId: "", panchayatId: "", villageId: "" });
                      fetchLoc("taluks", v, setEditTaluks);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                    <SelectContent>
                      {editDistricts.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Taluk</Label>
                  <Select 
                    disabled={!editForm.districtId}
                    value={editForm.talukId} 
                    onValueChange={(v) => {
                      setEditForm({ ...editForm, talukId: v, panchayatId: "", villageId: "" });
                      fetchLoc("panchayats", v, setEditPanchayats);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Taluk" /></SelectTrigger>
                    <SelectContent>
                      {editTaluks.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gram Panchayat</Label>
                  <Select 
                    disabled={!editForm.talukId}
                    value={editForm.panchayatId} 
                    onValueChange={(v) => {
                      setEditForm({ ...editForm, panchayatId: v, villageId: "" });
                      fetchLoc("villages", v, setEditVillages);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Panchayat" /></SelectTrigger>
                    <SelectContent>
                      {editPanchayats.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Village</Label>
                  <Select 
                    disabled={!editForm.panchayatId}
                    value={editForm.villageId} 
                    onValueChange={(v) => setEditForm({ ...editForm, villageId: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Village" /></SelectTrigger>
                    <SelectContent>
                      {editVillages.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Specific Area / Landmark</Label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="e.g. Near Bus Stand"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitude (optional)</Label>
                  <Input
                    className="mt-1" type="number" step="any"
                    value={editForm.latitude || ""}
                    onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                    placeholder="e.g. 13.0827"
                  />
                </div>
                <div>
                  <Label>Longitude (optional)</Label>
                  <Input
                    className="mt-1" type="number" step="any"
                    value={editForm.longitude || ""}
                    onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                    placeholder="e.g. 77.5877"
                  />
                </div>
              </div>
              {editForm.latitude && editForm.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${editForm.latitude},${editForm.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Preview on Google Maps
                </a>
              )}

              <div className="space-y-1 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Important Dates</p>
                <Separator />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sanction Date</Label>
                  <Input className="mt-1" type="date" value={editForm.sanctionDate || ""} onChange={(e) => setEditForm({ ...editForm, sanctionDate: e.target.value })} />
                </div>
                <div>
                  <Label>Release Date</Label>
                  <Input className="mt-1" type="date" value={editForm.releaseDate || ""} onChange={(e) => setEditForm({ ...editForm, releaseDate: e.target.value })} />
                </div>
                <div>
                  <Label>Work Start Date</Label>
                  <Input className="mt-1" type="date" value={editForm.startDate || ""} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
                </div>
                <div>
                  <Label>Expected Completion</Label>
                  <Input className="mt-1" type="date" value={editForm.endDate || ""} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setEditStep(2)}>← Back</Button>
                <Button onClick={() => setEditStep(4)}>Next: Media →</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4 — Media Management */}
        {editStep === 4 && (
          <div className="space-y-4">
            {/* Existing media */}
            {existingMedia.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-blue-600" /> Current Photos</span>
                    <Badge variant="outline">{existingMedia.length} photo{existingMedia.length !== 1 ? "s" : ""}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(["BEFORE", "DURING", "AFTER"] as const).map((phase) => {
                    const pPhotos = existingMedia.filter((m) => m.phase === phase);
                    if (pPhotos.length === 0) return null;
                    const phaseLabel = { BEFORE: "🔵 Before Work", DURING: "🟡 During Work", AFTER: "🟢 After Completion" }[phase];
                    return (
                      <div key={phase} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-600">{phaseLabel}</span>
                          <Badge variant="outline" className="text-xs">{pPhotos.length}</Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {pPhotos.map((m: any) => (
                            <div key={m.id} className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                              {m.fileType?.startsWith("image") ? (
                                <img src={m.fileUrl} alt={m.caption || m.fileName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white/90 rounded-full">
                                  <ExternalLink className="h-3.5 w-3.5 text-gray-700" />
                                </a>
                                <button
                                  className="p-1.5 bg-red-500/90 rounded-full hover:bg-red-600"
                                  onClick={() => deleteExistingMedia(m.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-white" />
                                </button>
                              </div>
                              {m.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                  <p className="text-white text-xs truncate">{m.caption}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Upload new photos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-600" /> Add New Photos
                </CardTitle>
                <p className="text-xs text-gray-400">Tag photos as Before / During / After work to document progress</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Phase Tag</Label>
                    <Select value={existingUploadPhase} onValueChange={(v: any) => setExistingUploadPhase(v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEFORE">🔵 Before Work</SelectItem>
                        <SelectItem value="DURING">🟡 During Work</SelectItem>
                        <SelectItem value="AFTER">🟢 After Completion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Caption (optional)</Label>
                    <Input
                      className="mt-1"
                      value={existingUploadCaption}
                      onChange={(e) => setExistingUploadCaption(e.target.value)}
                      placeholder="Describe what this photo shows..."
                    />
                  </div>
                </div>

                <input
                  ref={existingFileRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files && editForm.workId) uploadExistingMedia(e.target.files, editForm.workId); e.target.value = ""; }}
                />
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                  onClick={() => existingFileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files && editForm.workId) uploadExistingMedia(e.dataTransfer.files, editForm.workId); }}
                >
                  {existingUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      <p className="text-sm text-blue-600 font-medium">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-10 w-10 text-gray-300" />
                      <p className="text-sm font-medium text-gray-700">Click to upload or drag & drop</p>
                      <p className="text-xs text-gray-400">JPG, PNG, MP4 • Multiple files allowed</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setEditStep(3)}>← Back</Button>
              <Button onClick={saveEdit} disabled={editSaving} size="lg" className="gap-2">
                {editSaving ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
                ) : (
                  <><Check className="h-4 w-4" /> Save Changes</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── CREATE VIEW ──────────────────────────────────────────────────────
  if (viewMode === "create") {
    const STEPS = ["Project Info", "Financial Details", "Location & Dates", "Media Upload"];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setViewMode("list"); setCurrentStep(1); setPhotos([]); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">New MPLADS Project</h1>
            <p className="text-sm text-gray-500">Creates a linked Development Work automatically</p>
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
            ) : (
              <><Check className="h-4 w-4" /> Create Project</>
            )}
          </Button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <button
                onClick={() => setCurrentStep(i + 1)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentStep === i + 1
                    ? "bg-blue-600 text-white font-semibold"
                    : currentStep > i + 1
                    ? "bg-green-100 text-green-700 font-medium"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  currentStep > i + 1 ? "bg-green-500 text-white" :
                  currentStep === i + 1 ? "bg-white text-blue-600" : "bg-gray-200 text-gray-500"
                }`}>
                  {currentStep > i + 1 ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{step}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${currentStep > i + 1 ? "bg-green-400" : "bg-gray-200"}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 — Project Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" /> Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Project Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Construction of Road — Village to Main Highway"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Sector *</Label>
                  <Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{MPLADS_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Scheme Code</Label>
                  <Input
                    className="mt-1 font-mono"
                    value={form.schemeCode}
                    onChange={(e) => setForm({ ...form, schemeCode: e.target.value })}
                    placeholder="e.g. MPLAD/KA/2024/001"
                  />
                </div>
                <div>
                  <Label>Fund Source</Label>
                  <Input
                    className="mt-1"
                    value={form.fundSource}
                    onChange={(e) => setForm({ ...form, fundSource: e.target.value })}
                    placeholder="e.g. MPLADS, State Budget"
                  />
                </div>
              </div>
              <div>
                <Label>Contractor / Implementing Agency</Label>
                <Input
                  className="mt-1"
                  value={form.contractor}
                  onChange={(e) => setForm({ ...form, contractor: e.target.value })}
                  placeholder="e.g. KRDCL, Panchayat Raj, Private contractor"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  className="mt-1"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the project, scope, and its intended benefit to the constituency..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setCurrentStep(2)}>Next: Financial Details →</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Financial Details */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-600" /> Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Sanction Amount (₹)", key: "sanctionAmt", color: "blue" },
                  { label: "Released Amount (₹)", key: "releasedAmt", color: "indigo" },
                  { label: "Utilized Amount (₹)", key: "utilizedAmt", color: "green" },
                ].map(({ label, key, color }) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <div className="relative mt-1">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        type="number"
                        className="pl-8"
                        value={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live utilization preview */}
              {form.sanctionAmt && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Financial Summary Preview</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-400">Sanctioned</p>
                      <p className="font-bold text-gray-900">{formatCurrency(parseFloat(form.sanctionAmt) || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Released</p>
                      <p className="font-bold text-indigo-600">{formatCurrency(parseFloat(form.releasedAmt) || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Utilized</p>
                      <p className="font-bold text-green-600">{formatCurrency(parseFloat(form.utilizedAmt) || 0)}</p>
                    </div>
                  </div>
                  {form.sanctionAmt && (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                          style={{ width: `${Math.min(((parseFloat(form.utilizedAmt) || 0) / (parseFloat(form.sanctionAmt) || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-center text-xs text-gray-500">
                        {Math.round(((parseFloat(form.utilizedAmt) || 0) / (parseFloat(form.sanctionAmt) || 1)) * 100)}% Utilized
                      </p>
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>← Back</Button>
                <Button onClick={() => setCurrentStep(3)}>Next: Location & Dates →</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Location & Dates */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" /> Location & Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Location</p>
                <Separator />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select 
                    value={form.stateId} 
                    onValueChange={(v) => {
                      setForm({ ...form, stateId: v, districtId: "", talukId: "", panchayatId: "", villageId: "" });
                      fetchLoc("districts", v, setDistricts);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                    <SelectContent>
                      {states.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>District</Label>
                  <Select 
                    disabled={!form.stateId}
                    value={form.districtId} 
                    onValueChange={(v) => {
                      setForm({ ...form, districtId: v, talukId: "", panchayatId: "", villageId: "" });
                      fetchLoc("taluks", v, setTaluks);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                    <SelectContent>
                      {districts.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Taluk</Label>
                  <Select 
                    disabled={!form.districtId}
                    value={form.talukId} 
                    onValueChange={(v) => {
                      setForm({ ...form, talukId: v, panchayatId: "", villageId: "" });
                      fetchLoc("panchayats", v, setPanchayats);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Taluk" /></SelectTrigger>
                    <SelectContent>
                      {taluks.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gram Panchayat</Label>
                  <Select 
                    disabled={!form.talukId}
                    value={form.panchayatId} 
                    onValueChange={(v) => {
                      setForm({ ...form, panchayatId: v, villageId: "" });
                      fetchLoc("villages", v, setVillages);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Panchayat" /></SelectTrigger>
                    <SelectContent>
                      {panchayats.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Village</Label>
                  <Select 
                    disabled={!form.panchayatId}
                    value={form.villageId} 
                    onValueChange={(v) => setForm({ ...form, villageId: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Village" /></SelectTrigger>
                    <SelectContent>
                      {villages.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Specific Area / Landmark</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Near Bus Stand"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitude (optional)</Label>
                  <Input
                    className="mt-1" type="number" step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    placeholder="e.g. 13.0827"
                  />
                </div>
                <div>
                  <Label>Longitude (optional)</Label>
                  <Input
                    className="mt-1" type="number" step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    placeholder="e.g. 77.5877"
                  />
                </div>
              </div>
              {form.latitude && form.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Preview on Google Maps
                </a>
              )}

              <div className="space-y-1 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Important Dates</p>
                <Separator />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sanction Date</Label>
                  <Input className="mt-1" type="date" value={form.sanctionDate} onChange={(e) => setForm({ ...form, sanctionDate: e.target.value })} />
                </div>
                <div>
                  <Label>Release Date</Label>
                  <Input className="mt-1" type="date" value={form.releaseDate} onChange={(e) => setForm({ ...form, releaseDate: e.target.value })} />
                </div>
                <div>
                  <Label>Work Start Date</Label>
                  <Input className="mt-1" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <Label>Expected Completion</Label>
                  <Input className="mt-1" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>← Back</Button>
                <Button onClick={() => setCurrentStep(4)}>Next: Media Upload →</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4 — Media Upload */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-600" /> Upload Project Photos
                </CardTitle>
                <p className="text-xs text-gray-400">Tag photos as Before / During / After work to document progress</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Phase Tag</Label>
                    <Select value={uploadPhase} onValueChange={(v: any) => setUploadPhase(v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEFORE">🔵 Before Work</SelectItem>
                        <SelectItem value="DURING">🟡 During Work</SelectItem>
                        <SelectItem value="AFTER">🟢 After Completion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Caption (optional)</Label>
                    <Input
                      className="mt-1"
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                      placeholder="Describe what this photo shows..."
                    />
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && addPhotos(e.target.files)}
                />
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); e.dataTransfer.files && addPhotos(e.dataTransfer.files); }}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      <p className="text-sm text-blue-600 font-medium">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-10 w-10 text-gray-300" />
                      <p className="text-sm font-medium text-gray-700">Click to upload or drag & drop</p>
                      <p className="text-xs text-gray-400">JPG, PNG, MP4 • Multiple files allowed • Preview shown instantly</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Uploaded photos grid */}
            {photos.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-blue-600" /> Added Photos
                    </span>
                    <Badge variant="outline">{photos.length} photo{photos.length !== 1 ? "s" : ""}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(["BEFORE", "DURING", "AFTER"] as const).map((phase) => {
                    const pPhotos = photos.filter((p) => p.phase === phase);
                    if (pPhotos.length === 0) return null;
                    const phaseLabel = { BEFORE: "🔵 Before Work", DURING: "🟡 During Work", AFTER: "🟢 After Completion" }[phase];
                    return (
                      <div key={phase} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-600">{phaseLabel}</span>
                          <Badge variant="outline" className="text-xs">{pPhotos.length}</Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {pPhotos.map((photo) => (
                            <div key={photo.id} className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                              {photo.fileType.startsWith("image") ? (
                                <img src={photo.previewUrl} alt={photo.caption || photo.fileName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  className="p-1.5 bg-red-500/90 rounded-full hover:bg-red-600"
                                  onClick={() => removePhoto(photo.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-white" />
                                </button>
                              </div>
                              {photo.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                  <p className="text-white text-xs truncate">{photo.caption}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>← Back</Button>
              <Button onClick={handleSubmit} disabled={submitting} size="lg" className="gap-2">
                {submitting ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Creating...</>
                ) : (
                  <><Check className="h-4 w-4" /> Create MPLADS Project</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader title="MPLADS Projects" description="Member of Parliament Local Area Development Scheme — project tracking">
        <Button onClick={() => { setForm(emptyForm); setPhotos([]); setCurrentStep(1); setViewMode("create"); }} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Project
        </Button>
      </PageHeader>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Projects"    value={projects.length}               icon={<BarChart3  className="h-5 w-5 text-blue-600"   />} />
        <StatCard title="Sanction Amount"   value={formatCurrency(totalSanction)} icon={<IndianRupee className="h-5 w-5 text-indigo-600" />} />
        <StatCard title="Released Amount"   value={formatCurrency(totalReleased)} icon={<TrendingUp  className="h-5 w-5 text-amber-600"  />} />
        <StatCard title="Completed"         value={completedCount}                icon={<Building2  className="h-5 w-5 text-green-600"  />} />
      </div>

      {/* Project Cards */}
      {projects.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-12 w-12" />}
          title="No MPLADS projects yet"
          description="Add a project to get started"
          action={<Button onClick={() => setViewMode("create")}><Plus className="h-4 w-4 mr-1" /> New Project</Button>}
        />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const w = p.work || {};
            const media: any[] = w.media || [];
            const utilPct = p.sanctionAmt && p.utilizedAmt
              ? Math.round((p.utilizedAmt / p.sanctionAmt) * 100)
              : 0;
            const statusClass = STATUS_COLORS[p.status] || "bg-gray-50 text-gray-600 border-gray-200";
            return (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 py-4">
                    {/* Sector icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-blue-600" />
                    </div>

                    {/* Title & metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{w.title || "—"}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}>
                          {p.status}
                        </span>
                        {w.sector && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {w.sector}
                          </span>
                        )}
                        <span
                          onClick={() => setExpandedMediaIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                          className={`cursor-pointer transition-colors inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                            media.length > 0
                              ? "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {media.length > 0 ? (
                            <><ImageIcon className="h-3 w-3" /> {media.length} photo{media.length !== 1 ? "s" : ""}</>
                          ) : (
                            <><Upload className="h-3 w-3" /> Add Photos</>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        {p.schemeCode && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" /> Scheme: <span className="font-mono font-medium text-gray-700">{p.schemeCode}</span>
                          </span>
                        )}
                        {w.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {w.location}
                          </span>
                        )}
                        {p.sanctionDate && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" /> Sanction: {formatDate(p.sanctionDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financials */}
                    <div className="grid grid-cols-3 gap-3 md:gap-6 text-center flex-shrink-0">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Sanction</p>
                        <p className="text-sm font-bold text-gray-900">{p.sanctionAmt ? formatCurrency(p.sanctionAmt) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Released</p>
                        <p className="text-sm font-bold text-indigo-600">{p.releasedAmt ? formatCurrency(p.releasedAmt) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Utilized</p>
                        <p className="text-sm font-bold text-green-600">{p.utilizedAmt ? formatCurrency(p.utilizedAmt) : "—"}</p>
                      </div>
                    </div>

                    {/* Utilization bar */}
                    {p.sanctionAmt > 0 && (
                      <div className="md:w-28 flex-shrink-0">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1 text-center">{utilPct}% utilized</p>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                            style={{ width: `${Math.min(utilPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline" size="sm"
                        className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => openEdit(p)}
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => { setConfirmDeleteId(p.id); setConfirmDeleteTitle(w.title || p.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  {w.description && (
                    <>
                      <Separator />
                      <p className="py-3 text-xs text-gray-500 leading-relaxed">{w.description}</p>
                    </>
                  )}

                  {/* Media Gallery */}
                  {expandedMediaIds.includes(p.id) && (
                    <div className="pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      {media.length > 0 && (
                        <>
                          <Separator />
                          <div className="py-3 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Photos</p>
                            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                              {media.map((m: any) => (
                                <div key={m.id} className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                  {m.fileType?.startsWith("image") ? (
                                    <img src={m.fileUrl} alt={m.caption || m.fileName} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                    <a href={m.fileUrl} target="_blank" rel="noopener noreferrer"
                                      className="p-1 bg-white/90 rounded-full" onClick={(e) => e.stopPropagation()}>
                                      <ExternalLink className="h-3 w-3 text-gray-700" />
                                    </a>
                                    <button className="p-1 bg-red-500/90 rounded-full" onClick={() => deleteExistingMedia(m.id)}>
                                      <Trash2 className="h-3 w-3 text-white" />
                                    </button>
                                  </div>
                                  {m.phase && (
                                    <div className="absolute top-1 left-1">
                                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                                        m.phase === "BEFORE" ? "bg-blue-500 text-white" :
                                        m.phase === "AFTER" ? "bg-green-500 text-white" :
                                        "bg-amber-500 text-white"
                                      }`}>{m.phase}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Quick media upload row (for existing projects) */}
                      <Separator />
                      <div className="pt-3 flex items-center gap-3">
                    <Select value={existingUploadPhase} onValueChange={(v: any) => setExistingUploadPhase(v)}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEFORE">Before</SelectItem>
                        <SelectItem value="DURING">During</SelectItem>
                        <SelectItem value="AFTER">After</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-8 text-xs flex-1 max-w-xs"
                      placeholder="Caption (optional)"
                      value={existingUploadCaption}
                      onChange={(e) => setExistingUploadCaption(e.target.value)}
                    />
                    <input
                      ref={existingFileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => { if (e.target.files && w.id) uploadExistingMedia(e.target.files, w.id); e.target.value = ""; }}
                    />
                    <Button
                      variant="outline" size="sm"
                      className="h-8 gap-1 text-xs"
                      disabled={existingUploading}
                      onClick={() => existingFileRef.current?.click()}
                    >
                      {existingUploading ? (
                        <><div className="animate-spin rounded-full h-3 w-3 border-b border-current" /> Uploading...</>
                      ) : (
                        <><Upload className="h-3 w-3" /> Add Photos</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
        </div>
      )}

      {/* ─── DELETE CONFIRMATION DIALOG ─────────────────────────── */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(o) => { if (!o) { setConfirmDeleteId(null); setConfirmDeleteTitle(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Delete Project
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-gray-700">Are you sure you want to delete <span className="font-semibold">"{confirmDeleteTitle}"</span>?</p>
            <p className="text-xs text-gray-400 mt-1">This will permanently delete the MPLADS project and all linked development work records. This action cannot be undone.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setConfirmDeleteId(null); setConfirmDeleteTitle(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={deleteProject} disabled={deleting}>
              {deleting ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Deleting...</> : <><Trash2 className="h-4 w-4 mr-1" /> Delete</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
