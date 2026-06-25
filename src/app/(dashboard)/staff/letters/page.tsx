"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/shared/page-helpers";
import { LetterEditor } from "@/components/letters/letter-editor";
import { LetterPreview } from "@/components/letters/letter-preview";
import { LetterStatusBadge } from "@/components/letters/letter-workflow";
import { Plus, Mail, ArrowLeft, Save, Send, Eye, Edit2 } from "lucide-react";
import { formatDate, generateRefNo } from "@/lib/utils";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

type ViewMode = "list" | "create" | "edit";

export default function StaffLettersPage() {
  const [letters, setLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [saving, setSaving] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [form, setForm] = useState({
    subject: "", body: "", recipientName: "", recipientDesignation: "",
    recipientAddress: "", letterDate: new Date().toISOString().split("T")[0],
    referenceNo: "", department: "",
  });

  async function fetchLetters() {
    setLoading(true);
    const r = await fetch("/api/letters");
    const d = await r.json();
    setLetters(d.data || []);
    setLoading(false);
  }

  useEffect(() => { fetchLetters(); }, []);

  const handleFormChange = useCallback((data: any) => setForm(data), []);

  async function saveDraft(status = "DRAFT") {
    if (!form.subject || !form.recipientName || !form.body) { toast.error("Required fields missing"); return; }
    setSaving(true);
    
    const method = selectedLetter ? "PUT" : "POST";
    const payload: any = { ...form, referenceNo: form.referenceNo || generateRefNo("MP"), status };
    if (selectedLetter) payload.id = selectedLetter.id;

    const res = await fetch("/api/letters", {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (res.ok) { 
      toast.success(status === "PENDING_REVIEW" ? "Submitted to PA for review" : "Draft saved"); 
      setViewMode("list"); 
      fetchLetters(); 
    }
    else toast.error("Failed");
    
    setSaving(false);
  }

  if (viewMode === "create" || viewMode === "edit") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-xl font-bold">{viewMode === "create" ? "Draft New Letter" : "Edit Draft Letter"}</h1>
              <p className="text-xs text-gray-500">Staff draft — can be sent to PA for review</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => saveDraft("DRAFT")} disabled={saving}><Save className="h-4 w-4 mr-1" />Save Draft</Button>
            <Button size="sm" onClick={() => saveDraft("PENDING_REVIEW")} disabled={saving}><Send className="h-4 w-4 mr-1" />Submit to PA</Button>
          </div>
        </div>
        
        {viewMode === "edit" && selectedLetter?.rejected_reason && (
           <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex flex-col gap-1">
             <span className="text-red-700 font-bold text-sm">PA Remarks for Modification:</span>
             <span className="text-red-600 text-sm">{selectedLetter.rejected_reason}</span>
           </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" style={{ minHeight: "calc(100vh - 180px)" }}>
          <Card className="overflow-auto"><CardHeader className="pb-3"><CardTitle className="text-sm">Editor</CardTitle></CardHeader><CardContent><LetterEditor data={form} onChange={handleFormChange} /></CardContent></Card>
          <Card className="overflow-hidden"><CardHeader className="pb-3"><CardTitle className="text-sm">Preview</CardTitle></CardHeader><CardContent className="p-0"><LetterPreview {...form} /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Letters" description="Draft official letters for PA review">
        <Button onClick={() => { 
          setForm({ subject: "", body: "", recipientName: "", recipientDesignation: "", recipientAddress: "", letterDate: new Date().toISOString().split("T")[0], referenceNo: generateRefNo("MP"), department: "" }); 
          setSelectedLetter(null);
          setViewMode("create"); 
        }} size="sm"><Plus className="h-4 w-4 mr-1" /> Draft Letter</Button>
      </PageHeader>
      {loading ? <LoadingSpinner /> : letters.length === 0 ? <EmptyState icon={<Mail className="h-12 w-12" />} title="No letters" /> : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left py-3 px-4">Subject</th>
                <th className="text-left py-3 px-4 hidden md:table-cell">Recipient</th>
                <th className="text-left py-3 px-4 hidden lg:table-cell">Date</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {letters.map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-sm flex items-center gap-2">
                       {l.subject}
                       {l.rejected_reason && l.status === "DRAFT" && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold">REMARKS ADDED</span>}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{l.referenceNo || l.reference_no || "—"}</p>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-sm text-gray-600">{l.recipientName || l.recipient_name}</td>
                  <td className="py-3 px-4 hidden lg:table-cell text-sm text-gray-500">{formatDate(l.letterDate || l.letter_date)}</td>
                  <td className="py-3 px-4"><LetterStatusBadge status={l.status} /></td>
                  <td className="py-3 px-4 text-right">
                    {l.status === 'DRAFT' && (
                       <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedLetter(l);
                          setForm({
                            subject: l.subject, body: l.body, recipientName: l.recipientName || l.recipient_name, 
                            recipientDesignation: l.recipientDesignation || l.recipient_designation || "",
                            recipientAddress: l.recipientAddress || l.recipient_address || "", 
                            letterDate: new Date(l.letterDate || l.letter_date).toISOString().split("T")[0],
                            referenceNo: l.referenceNo || l.reference_no || "", department: l.department || "",
                          });
                          setViewMode("edit");
                       }}>
                         <Edit2 className="w-4 h-4" />
                       </Button>
                    )}
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
