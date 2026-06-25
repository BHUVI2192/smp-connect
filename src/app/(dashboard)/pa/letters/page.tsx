"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/shared/page-helpers";
import { LetterEditor } from "@/components/letters/letter-editor";
import { LetterPreview } from "@/components/letters/letter-preview";
import { LetterStatusBadge, LetterWorkflowBar } from "@/components/letters/letter-workflow";
import {
  Plus, Mail, ArrowLeft, Save, Send, CheckCircle2, XCircle,
  FileText, Eye, Edit2, Trash2, Download, Clock, Search,
} from "lucide-react";
import { formatDate, generateRefNo } from "@/lib/utils";
import { toast } from "sonner";
import { generateLetterPdf } from "@/lib/pdf-generator";

type ViewMode = "list" | "create" | "edit" | "view";

interface LetterFormData {
  subject: string;
  body: string;
  recipientName: string;
  recipientDesignation: string;
  recipientAddress: string;
  letterDate: string;
  referenceNo: string;
  department: string;
  signatureUrl?: string;
}

const emptyForm: LetterFormData = {
  subject: "",
  body: "",
  recipientName: "",
  recipientDesignation: "",
  recipientAddress: "",
  letterDate: new Date().toISOString().split("T")[0],
  referenceNo: "",
  department: "",
};

export default function PALettersPage() {
  const [letters, setLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [form, setForm] = useState<LetterFormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { fetchLetters(); }, []);

  async function fetchLetters() {
    setLoading(true);
    const res = await fetch("/api/letters");
    const data = await res.json();
    setLetters(data.data || []);
    setLoading(false);
  }

  function openCreate() {
    setForm({
      ...emptyForm,
      referenceNo: generateRefNo("MP"),
      letterDate: new Date().toISOString().split("T")[0],
    });
    setSelectedLetter(null);
    setViewMode("create");
  }

  function openEdit(letter: any) {
    setForm({
      subject: letter.subject,
      body: letter.body,
      recipientName: letter.recipientName || letter.recipient_name,
      recipientDesignation: letter.recipientDesignation || letter.recipient_designation || "",
      recipientAddress: letter.recipientAddress || letter.recipient_address || "",
      letterDate: new Date(letter.letterDate || letter.letter_date).toISOString().split("T")[0],
      referenceNo: letter.referenceNo || letter.reference_no || "",
      department: letter.department || "",
    });
    setSelectedLetter(letter);
    setViewMode("edit");
  }

  function openView(letter: any) {
    setSelectedLetter(letter);
    setForm({
      subject: letter.subject,
      body: letter.body,
      recipientName: letter.recipientName || letter.recipient_name,
      recipientDesignation: letter.recipientDesignation || letter.recipient_designation || "",
      recipientAddress: letter.recipientAddress || letter.recipient_address || "",
      letterDate: new Date(letter.letterDate || letter.letter_date).toISOString().split("T")[0],
      referenceNo: letter.referenceNo || letter.reference_no || "",
      department: letter.department || "",
    });
    setViewMode("view");
  }

  async function saveLetter(status?: string) {
    if (!form.subject || !form.recipientName || !form.body) {
      toast.error("Subject, recipient and body are required");
      return;
    }
    setSaving(true);
    try {
      const method = selectedLetter ? "PUT" : "POST";
      const payload: any = {
        ...form,
        status: status || "DRAFT",
      };
      if (selectedLetter) payload.id = selectedLetter.id;

      const res = await fetch("/api/letters", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          status === "PENDING_REVIEW"
            ? "Letter submitted for review"
            : selectedLetter
            ? "Letter updated"
            : "Letter saved as draft"
        );
        await fetchLetters();
        setViewMode("list");
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to save");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/letters", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      toast.success(`Letter ${status.toLowerCase().replace("_", " ")}`);
      fetchLetters();
      setViewMode("list");
    }
  }

  async function deleteLetter(id: string) {
    if (!confirm("Delete this letter?")) return;
    const res = await fetch(`/api/letters?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Letter deleted"); fetchLetters(); }
  }

  const handleFormChange = useCallback((data: LetterFormData) => {
    setForm(data);
  }, []);

  // Filter letters
  const filtered = letters.filter((l) => {
    if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.subject?.toLowerCase().includes(q) ||
        (l.recipientName || l.recipient_name || "").toLowerCase().includes(q) ||
        (l.referenceNo || l.reference_no || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ─── LIST VIEW ────────────────────────────────────────

  if (viewMode === "list") {
    const statusTabs = [
      { value: "ALL", label: "All", count: letters.length },
      { value: "DRAFT", label: "Drafts", count: letters.filter((l) => l.status === "DRAFT").length },
      { value: "PENDING_REVIEW", label: "Pending", count: letters.filter((l) => l.status === "PENDING_REVIEW").length },
      { value: "APPROVED", label: "Approved", count: letters.filter((l) => l.status === "APPROVED").length },
      { value: "SENT", label: "Sent", count: letters.filter((l) => l.status === "SENT").length },
    ];

    return (
      <div className="space-y-5">
        <PageHeader title="Draft Letters" description="Official correspondence management with workflow">
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Letter
          </Button>
        </PageHeader>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search letters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {statusTabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setStatusFilter(t.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === t.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Mail className="h-12 w-12" />}
            title="No letters found"
            description={statusFilter !== "ALL" ? "No letters match the current filter." : "Create your first official letter."}
            action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Letter</Button>}
          />
        ) : (
          <div className="border rounded-lg overflow-hidden bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left py-3 px-4">Ref / Subject</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">Recipient</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">Date</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((letter) => (
                  <tr key={letter.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <button onClick={() => openView(letter)} className="text-left">
                        <p className="font-medium text-sm text-gray-900 hover:text-blue-600 transition-colors">{letter.subject}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{letter.referenceNo || letter.reference_no || "—"}</p>
                      </button>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <p className="text-sm text-gray-700">{letter.recipientName || letter.recipient_name}</p>
                      <p className="text-xs text-gray-400">{letter.recipientDesignation || letter.recipient_designation || ""}</p>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-sm text-gray-500">
                      {formatDate(letter.letterDate || letter.letter_date)}
                    </td>
                    <td className="py-3 px-4">
                      <LetterStatusBadge status={letter.status} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(letter)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {letter.status === "DRAFT" && (
                          <Button variant="ghost" size="icon" onClick={() => openEdit(letter)} title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {letter.status === "DRAFT" && (
                          <Button variant="ghost" size="icon" onClick={() => deleteLetter(letter.id)} title="Delete">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        )}
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

  // ─── CREATE / EDIT VIEW (Split Screen) ─────────────────

  if (viewMode === "create" || viewMode === "edit") {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                {viewMode === "create" ? "New Letter" : "Edit Letter"}
              </h1>
              <p className="text-xs text-gray-500">
                {viewMode === "create" ? "Compose a new official letter" : `Editing: ${form.subject || "Untitled"}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => saveLetter("DRAFT")} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button size="sm" onClick={() => saveLetter("PENDING_REVIEW")} disabled={saving}>
              <Send className="h-4 w-4 mr-1" />
              Submit for Review
            </Button>
          </div>
        </div>

        {/* Split Screen: Editor | Preview */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" style={{ minHeight: "calc(100vh - 180px)" }}>
          {/* Left: Editor */}
          <Card className="overflow-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Edit2 className="h-4 w-4" /> Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LetterEditor data={form} onChange={handleFormChange} />
            </CardContent>
          </Card>

          {/* Right: Live Preview */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" /> Live Preview (A4)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <LetterPreview {...form} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── VIEW MODE ────────────────────────────────────────

  if (viewMode === "view" && selectedLetter) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{selectedLetter.subject}</h1>
              <p className="text-xs text-gray-500 font-mono">
                {selectedLetter.referenceNo || selectedLetter.reference_no || "No reference"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(selectedLetter.status === "PENDING_REVIEW" || selectedLetter.status === "DRAFT") && (
              <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-black border-none" onClick={() => updateStatus(selectedLetter.id, "APPROVED")}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
              </Button>
            )}
            {selectedLetter.status === "APPROVED" && (
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-none" onClick={() => updateStatus(selectedLetter.id, "SENT")}>
                <Send className="h-4 w-4 mr-1" /> Mark as Sent
              </Button>
            )}
            <Button size="sm" variant="outline" className="text-red-600" onClick={async () => {
              const remarks = window.prompt("Enter remarks for staff to change:");
              if (remarks === null) return;
              const res = await fetch("/api/letters", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selectedLetter.id, status: "DRAFT", rejected_reason: remarks }),
              });
              if (res.ok) {
                toast.success("Returned to staff with remarks");
                fetchLetters();
                setViewMode("list");
              }
            }}>
              <XCircle className="h-4 w-4 mr-1" /> Return to Staff
            </Button>
            
            <input 
               type="file" 
               accept="image/*" 
               id="esign-upload" 
               className="hidden" 
               onChange={(e) => {
                 const file = e.target.files?.[0];
                 if (file) {
                   const url = URL.createObjectURL(file);
                   setForm({ ...form, signatureUrl: url });
                   toast.success("E-Sign applied to preview");
                 }
               }} 
            />
            <Button size="sm" variant="outline" onClick={() => document.getElementById("esign-upload")?.click()}>
              <FileText className="h-4 w-4 mr-1" /> Apply E-Sign
            </Button>
            <Button size="sm" onClick={async () => {
              const filename = `Letter_${selectedLetter.referenceNo || selectedLetter.reference_no || selectedLetter.id}.pdf`;
              toast.promise(
                generateLetterPdf(
                  {
                    subject: form.subject,
                    body: form.body,
                    recipientName: form.recipientName,
                    recipientDesignation: form.recipientDesignation,
                    recipientAddress: form.recipientAddress,
                    letterDate: form.letterDate,
                    referenceNo: form.referenceNo,
                    signatureUrl: (form as any).signatureUrl,
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

        {/* Workflow Progress */}
        <Card className="print:hidden">
          <CardContent className="py-4">
            <LetterWorkflowBar status={selectedLetter.status} />
          </CardContent>
        </Card>

        {/* Details + Preview */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Meta */}
          <Card className="print:hidden">
            <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Status</span><LetterStatusBadge status={selectedLetter.status} /></div>
              <Separator />
              <div className="flex justify-between"><span className="text-gray-500">Recipient</span><span className="font-medium text-right">{selectedLetter.recipientName || selectedLetter.recipient_name}</span></div>
              {(selectedLetter.recipientDesignation || selectedLetter.recipient_designation) && (
                <div className="flex justify-between"><span className="text-gray-500">Designation</span><span className="text-right">{selectedLetter.recipientDesignation || selectedLetter.recipient_designation}</span></div>
              )}
              <Separator />
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{formatDate(selectedLetter.letterDate || selectedLetter.letter_date, "long")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{formatDate(selectedLetter.createdAt || selectedLetter.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Version</span><span>{selectedLetter.version || 1}</span></div>
              {selectedLetter.rejected_reason && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-1">
                    <span className="text-red-500 font-medium">Remarks for Staff:</span>
                    <span className="p-2 bg-red-50 rounded-md text-red-700">{selectedLetter.rejected_reason}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="xl:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Letter Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <LetterPreview {...form} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
