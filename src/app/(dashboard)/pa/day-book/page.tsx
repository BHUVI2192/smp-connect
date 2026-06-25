"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/shared/page-helpers";
import { StatusBadge } from "@/components/shared/status-badge";
import { 
  CheckCircle2, Mic, Paperclip, Upload, Play, Loader2, 
  Plus, BookOpen, Lightbulb, AlertCircle, ListChecks, 
  Forward, Send, Clock, MapPin, AudioLines, FileText, Check
} from "lucide-react";
import { VoiceRecorder } from "@/components/shared/voice-recorder";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PATPDetailingPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [form, setForm] = useState({ 
    title: "", 
    description: "",
    keyDecisions: "", 
    issues: "", 
    actions: "" 
  });
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  useEffect(() => { fetchEvents(); }, [selectedDate]);

  async function fetchEvents() {
    setLoading(true);
    try {
      // Fetch events that are forwarded (CONFIRMED) or already Finalized
      const res = await fetch(`/api/plan-today?date=${selectedDate}`);
      const data = await res.json();
      // Only show events that have at least reached the TP stage (CONFIRMED or FINALIZED)
      const filtered = (data.data || []).filter((e: any) => e.status === "CONFIRMED" || e.isFinalized);
      setEvents(filtered);
    } catch (error) {
      toast.error("Failed to load TP items");
    } finally {
      setLoading(false);
    }
  }

  function openDetailing(event: any) {
    setSelectedEvent(event);
    setForm({
      title: event.title,
      description: event.description || "",
      keyDecisions: event.keyDecisions || "",
      issues: event.issues || "",
      actions: event.actions || ""
    });
    setVoiceFile(null);
    setMediaFiles([]);
    setDialogOpen(true);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles([...mediaFiles, ...Array.from(e.target.files)]);
    }
  };

  async function handleFinalize() {
    if (!selectedEvent) return;
    
    try {
      setSubmitting(true);
      const supabase = createSupabaseBrowser();
      let paVoiceUrl = selectedEvent.paVoiceUrl;
      const paMediaUrls = [...(selectedEvent.paMediaUrls || [])];

      // Upload voice note if new one recorded
      if (voiceFile) {
        const filePath = `pa-voice/${Date.now()}_detailing.webm`;
        const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, voiceFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(filePath);
        paVoiceUrl = publicUrl;
      }

      // Upload new media files
      for (const file of mediaFiles) {
        const filePath = `pa-docs/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(filePath);
          paMediaUrls.push(publicUrl);
        }
      }

      const res = await fetch("/api/plan-today", {
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedEvent.id,
          ...form,
          paVoiceUrl,
          paMediaUrls: paMediaUrls.length > 0 ? paMediaUrls : undefined,
          isFinalized: true
        }),
      });

      if (res.ok) { 
        toast.success("Finalized — Staff can now see this in their TP Dashboard"); 
        setDialogOpen(false); 
        fetchEvents(); 
      } else {
        toast.error("Failed to finalize");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader 
        title="TP / Day Detailing" 
        description="Add voice notes, media, and structural details to your notepad entries before they go to staff."
      >
        <Input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)} 
          className="w-[180px] bg-white" 
        />
      </PageHeader>

      {loading ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <EmptyState 
          icon={<Send className="h-12 w-12 text-slate-300" />} 
          title="No items in TP detailing" 
          description="Forward items from your Notepad to start detailing them here." 
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {events.map((event) => (
            <Card key={event.id} className={`overflow-hidden border-none shadow-md ${event.isFinalized ? 'bg-slate-50' : 'bg-white'}`}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className={`p-6 flex-1 space-y-4 ${event.isFinalized ? 'opacity-80' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                           <StatusBadge status={event.isFinalized ? "FINALIZED" : "PENDING_DETAIL"} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {event.startTime || "No time set"}</span>
                          {event.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>}
                        </div>
                      </div>
                      {!event.isFinalized && (
                         <Button onClick={() => openDetailing(event)} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" /> Add Details
                         </Button>
                      )}
                    </div>

                    {event.description && (
                      <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                        &quot;{event.description}&quot;
                      </div>
                    )}

                    {/* Detailing Previews */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {event.keyDecisions && (
                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                          <div className="flex items-center gap-1.5 mb-1 text-blue-700 font-bold text-xs uppercase tracking-tight">
                            <Lightbulb className="h-3 w-3" /> Key Decisions
                          </div>
                          <p className="text-xs text-blue-800 line-clamp-3">{event.keyDecisions}</p>
                        </div>
                      )}
                      {event.issues && (
                        <div className="p-3 bg-red-50/50 rounded-lg border border-red-100">
                          <div className="flex items-center gap-1.5 mb-1 text-red-700 font-bold text-xs uppercase tracking-tight">
                            <AlertCircle className="h-3 w-3" /> Issues
                          </div>
                          <p className="text-xs text-red-800 line-clamp-3">{event.issues}</p>
                        </div>
                      )}
                      {event.actions && (
                        <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                          <div className="flex items-center gap-1.5 mb-1 text-emerald-700 font-bold text-xs uppercase tracking-tight">
                            <ListChecks className="h-3 w-3" /> Actions
                          </div>
                          <p className="text-xs text-emerald-800 line-clamp-3">{event.actions}</p>
                        </div>
                      )}
                    </div>

                    {/* Media/Voice Previews */}
                    <div className="flex items-center gap-3">
                      {event.paVoiceUrl && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100">
                           <AudioLines className="h-3 w-3" /> Voice Note
                        </div>
                      )}
                      {event.paMediaUrls?.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-100">
                           <FileText className="h-3 w-3" /> {event.paMediaUrls.length} Files
                        </div>
                      )}
                    </div>
                  </div>

                  {event.isFinalized && (
                     <div className="bg-emerald-50 border-l border-emerald-100 p-6 flex flex-col items-center justify-center text-center w-full md:w-48">
                        <div className="h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center mb-2 shadow-lg shadow-emerald-200">
                          <Check className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-bold text-emerald-700 uppercase">Finalized</span>
                        <p className="text-[10px] text-emerald-600 mt-1">Visible to staff</p>
                     </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detailing Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detailing: {selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
               <Label className="text-indigo-900 font-bold flex items-center gap-2"><Mic className="h-4 w-4" /> Live Voice Recording</Label>
               <VoiceRecorder 
                 onRecordingComplete={(file) => setVoiceFile(file)} 
                 onClear={() => setVoiceFile(null)} 
               />
               <p className="text-[10px] text-indigo-600 italic">Add your verbal notes or summary of the event for staff reference.</p>
            </div>

            <div className="space-y-4">
               <div>
                  <Label className="flex items-center gap-2 mb-2"><Lightbulb className="h-4 w-4 text-blue-600" /> Key Decisions</Label>
                  <Textarea 
                    value={form.keyDecisions} 
                    onChange={(e) => setForm({ ...form, keyDecisions: e.target.value })} 
                    placeholder="What was decided? List them here..."
                    rows={2}
                  />
               </div>
               <div>
                  <Label className="flex items-center gap-2 mb-2"><AlertCircle className="h-4 w-4 text-red-600" /> Issues & Blockers</Label>
                  <Textarea 
                    value={form.issues} 
                    onChange={(e) => setForm({ ...form, issues: e.target.value })} 
                    placeholder="Any problems or follow-ups needed?"
                    rows={2}
                  />
               </div>
               <div>
                  <Label className="flex items-center gap-2 mb-2"><ListChecks className="h-4 w-4 text-green-600" /> Action Items</Label>
                  <Textarea 
                    value={form.actions} 
                    onChange={(e) => setForm({ ...form, actions: e.target.value })} 
                    placeholder="Next steps for the staff..."
                    rows={2}
                  />
               </div>
            </div>

            <div className="space-y-2">
               <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> Photos & Document Evidence</Label>
               <Input type="file" multiple onChange={handleFileChange} className="cursor-pointer" />
               {mediaFiles.length > 0 && (
                 <div className="flex flex-wrap gap-2 mt-2">
                    {mediaFiles.map((f, i) => (
                      <div key={i} className="px-2 py-1 bg-slate-100 rounded text-[10px] font-medium text-slate-600">{f.name}</div>
                    ))}
                 </div>
               )}
            </div>
          </div>
          <DialogFooter className="bg-slate-50 p-4 -mx-6 -mb-6 border-t">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleFinalize} className="bg-emerald-600 hover:bg-emerald-700 shadow-md" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Finalizing...</> : <><Check className="h-4 w-4 mr-2" /> Finalize & Send to Staff</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
