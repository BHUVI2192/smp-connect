"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader, LoadingSpinner, EmptyState, StatCard } from "@/components/shared/page-helpers";
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus, Calendar, Edit2, Trash2, Check, Clock, MapPin, Send, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Mic, Paperclip, Upload, X, Loader2 } from "lucide-react";
import { VoiceRecorder } from "@/components/shared/voice-recorder";

export default function PAPlanTodayPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [quickTitle, setQuickTitle] = useState("");
  const [form, setForm] = useState({ 
    title: "", 
    description: "", 
    eventDate: "", 
    startTime: "", 
    endTime: "", 
    location: "", 
    notes: "",
    paMediaUrls: [] as string[],
    paVoiceUrl: null as string | null
  });
  const [files, setFiles] = useState<File[]>([]);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);

  useEffect(() => { fetchEvents(); }, [selectedDate]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch(`/api/plan-today?date=${selectedDate}`);
      const data = await res.json();
      setEvents(data.data || []);
    } catch (error) {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickAdd() {
    if (!quickTitle.trim()) return;
    const body = { 
      title: quickTitle, 
      eventDate: selectedDate, 
      status: "DRAFT" 
    };
    const res = await fetch("/api/plan-today", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(body) 
    });
    if (res.ok) {
      setQuickTitle("");
      fetchEvents();
      toast.success("Added to notepad");
    }
  }

  function openCreate() {
    setEditingEvent(null);
    setForm({ 
      title: "", 
      description: "", 
      eventDate: selectedDate, 
      startTime: "", 
      endTime: "", 
      location: "", 
      notes: "",
      paMediaUrls: [],
      paVoiceUrl: null
    });
    setFiles([]);
    setVoiceFile(null);
    setShowFullForm(true);
  }

  function openEdit(event: any) {
    setEditingEvent(event);
    setForm({
      title: event.title, 
      description: event.description || "",
      eventDate: new Date(event.eventDate || event.event_date).toISOString().split("T")[0],
      startTime: event.startTime || event.start_time || "", 
      endTime: event.endTime || event.end_time || "",
      location: event.location || "", 
      notes: event.notes || "",
      paMediaUrls: event.paMediaUrls || [],
      paVoiceUrl: event.paVoiceUrl || null,
    });
    setShowFullForm(true);
  }

  function closeForm() {
    setShowFullForm(false);
    setEditingEvent(null);
    setVoiceFile(null);
    setFiles([]);
  }

  async function handleSubmit() {
    if (!form.title || !form.eventDate) { toast.error("Title and date required"); return; }
    
    setIsUploading(true);
    try {
      const supabase = createSupabaseBrowser();
      const newMediaUrls: string[] = [];
      let finalVoiceUrl = form.paVoiceUrl;

      const sanitizeFileName = (name: string) => {
        return name.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
      };

      // Upload Documents/Media
      for (const file of files) {
        const sanitizedName = sanitizeFileName(file.name);
        const fileName = `${Date.now()}_${sanitizedName}`;
        const { data, error } = await supabase.storage
          .from("documents")
          .upload(`pa-docs/${fileName}`, file, {
            contentType: file.type,
            upsert: true
          });
          
        if (error) {
          console.error("Doc upload error:", error);
          throw new Error(`Document upload failed: ${error.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(`pa-docs/${fileName}`);
        newMediaUrls.push(publicUrl);
      }

      // Upload Voice Note (Live recorded)
      if (voiceFile) {
        const fileName = `${Date.now()}_voice.webm`;
        const { data, error } = await supabase.storage
          .from("documents")
          .upload(`pa-voice/${fileName}`, voiceFile, {
            contentType: 'audio/webm',
            upsert: true
          });

        if (error) {
          console.error("Voice upload error:", error);
          throw new Error(`Voice note upload failed: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(`pa-voice/${fileName}`);
        finalVoiceUrl = publicUrl;
      }

      const method = editingEvent ? "PUT" : "POST";
      const payload = { 
        ...form, 
        paMediaUrls: [...form.paMediaUrls, ...newMediaUrls],
        paVoiceUrl: finalVoiceUrl,
        ...(editingEvent ? { id: editingEvent.id } : {})
      };

      const res = await fetch("/api/plan-today", { 
        method, 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });

      if (res.ok) { 
        toast.success(editingEvent ? "Updated" : "Created"); 
        closeForm();
        fetchEvents(); 
      }
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/plan-today?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetchEvents(); }
  }

  async function finalizeDay() {
    try {
      await Promise.all(events.map((e) =>
        fetch("/api/plan-today", { 
          method: "PUT", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ id: e.id, isFinalized: true, status: "CONFIRMED" }) 
        })
      ));
      toast.success("Schedule forwarded — Go to TP to add details and finalize.");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to finalize schedule");
    }
  }

  const confirmed = events.filter((e) => e.status === "CONFIRMED").length;
  const draft = events.filter((e) => e.status === "DRAFT").length;
  const finalized = events.filter((e) => e.isFinalized || e.is_finalized).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="Plan Today (Notepad)" 
        description="Daily Notepad — Quickly log events and forward them to TP for detailing."
      >
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border">
          <Calendar className="h-4 w-4 text-gray-400 ml-2" />
          <Input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="border-none focus-visible:ring-0 w-[140px] appearance-none" 
          />
          <div className="w-px h-6 bg-gray-200" />
          {events.length > 0 && events.some((e) => !e.isFinalized) ? (
            <Button onClick={finalizeDay} size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all active:scale-95">
              <Send className="h-4 w-4 mr-2" /> Forward to TP
            </Button>
          ) : (
             <div className="flex items-center text-xs text-emerald-600 font-medium px-3">
               <Check className="h-3 w-3 mr-1" /> All Finalized
             </div>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total" value={events.length} icon={<StickyNote className="h-5 w-5 text-indigo-600" />} />
        <StatCard title="Drafts" value={draft} icon={<Clock className="h-5 w-5 text-amber-500" />} />
        <StatCard title="In TP" value={confirmed} icon={<Send className="h-5 w-5 text-blue-600" />} />
      </div>

      {/* Inline Creation Form */}
      {showFullForm && (
        <Card className="border-2 border-indigo-100 shadow-xl bg-white overflow-hidden animate-in slide-in-from-top-4 duration-300">
           <div className="bg-indigo-50/50 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-900">{editingEvent ? "Update Event Details" : "Create New Notepad Entry"}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={closeForm}><X className="h-4 w-4" /></Button>
           </div>
           <CardContent className="p-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Event Title *</Label>
                    <Input 
                      value={form.title} 
                      onChange={(e) => setForm({ ...form, title: e.target.value })} 
                      placeholder="e.g. Meeting with Minister" 
                      className="border-slate-200 focus:border-indigo-400 h-11"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Start Time</Label>
                      <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="h-11 border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">End Time</Label>
                      <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="h-11 border-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      <Input className="pl-9 h-11 border-slate-200" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Conference Room A" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Brief for Staff *</Label>
                    <Textarea 
                      value={form.description} 
                      onChange={(e) => setForm({ ...form, description: e.target.value })} 
                      rows={3} 
                      placeholder="Add context, instructions, or briefing for the staff..." 
                      className="border-slate-200 resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Briefing Voice Note (Live)</Label>
                      <VoiceRecorder 
                        onRecordingComplete={(file) => setVoiceFile(file)}
                        onClear={() => setVoiceFile(null)}
                      />
                   </div>

                   {/* Existing Voice Note */}
                   {form.paVoiceUrl && !voiceFile && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Current Voice Briefing</Label>
                        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                          <audio src={form.paVoiceUrl} controls className="h-8 flex-1" />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setForm(f => ({ ...f, paVoiceUrl: null }))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                   )}

                   <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Reference Documents</Label>
                    
                    {/* Existing Files */}
                    {form.paMediaUrls.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {form.paMediaUrls.map((url, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border rounded-lg text-xs">
                            <span className="truncate border-b border-transparent hover:border-indigo-400 text-indigo-600 cursor-pointer" onClick={() => window.open(url, '_blank')}>
                              {url.split('/').pop()}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-500"
                              onClick={() => setForm(f => ({ ...f, paMediaUrls: f.paMediaUrls.filter((_, i) => i !== idx) }))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-2 border-dashed rounded-lg p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => document.getElementById('pa-files')?.click()}>
                      <input id="pa-files" type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                      <Paperclip className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                      <span className="text-xs font-semibold text-slate-500">
                        {files.length > 0 ? `${files.length} new files selected` : "Attach new documents"}
                      </span>
                    </div>

                    {/* New Files List */}
                    {files.length > 0 && (
                       <div className="mt-2 space-y-1">
                          {files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-indigo-50/50 rounded-lg text-xs">
                              <span className="truncate text-slate-600">{file.name}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, i) => i !== idx)); }}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                       </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Private Notes (Only for you)</Label>
                    <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Reminders, personal context..." className="border-slate-200 resize-none text-xs" />
                  </div>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={closeForm}>Discard Changes</Button>
                <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl font-bold shadow-lg shadow-indigo-100" disabled={isUploading}>
                  {isUploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving Event...</> : (editingEvent ? "Save Changes" : "Add to Notepad")}
                </Button>
             </div>
           </CardContent>
        </Card>
      )}

      {/* Notepad Section */}
      <Card className={`border-none shadow-xl bg-slate-50 overflow-hidden transition-all duration-500 ${showFullForm ? 'opacity-50 pointer-events-none scale-[0.98]' : ''}`}>
        <div className="bg-white border-b p-4 flex gap-4">
          <Input 
            placeholder="Quick add: 'Meet with Ministry of Culture at 10 AM'..." 
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            className="flex-1 border-gray-100 bg-gray-50 focus-visible:bg-white"
          />
          <Button onClick={handleQuickAdd} variant="outline" className="shrink-0 border-indigo-100 text-indigo-600 hover:bg-indigo-50">
            <Plus className="h-4 w-4 mr-2" /> Quick Add
          </Button>
          {!showFullForm && (
            <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
              <Plus className="h-4 w-4 mr-2" /> Full Details
            </Button>
          )}
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center"><LoadingSpinner /></div>
          ) : events.length === 0 ? (
            <div className="p-20 text-center">
              <EmptyState 
                icon={<StickyNote className="h-12 w-12" />} 
                title="Your Notepad is Empty" 
                description="Start typing above to quickly add items to today's schedule." 
              />
            </div>
          ) : (
            <div className="divide-y bg-white">
              {events.sort((a, b) => (a.startTime || "99:99").localeCompare(b.startTime || "99:99")).map((event, index) => (
                <div key={event.id} className={`group flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors ${event.status === 'CONFIRMED' || event.isFinalized ? 'opacity-80' : ''}`}>
                  <div className="flex flex-col items-center justify-center min-w-[60px]">
                    <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                    {event.startTime ? (
                      <span className="text-sm font-semibold text-slate-900">{event.startTime}</span>
                    ) : (
                      <Clock className="h-4 w-4 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium text-slate-900 truncate ${event.isFinalized ? 'line-through text-slate-400' : ''}`}>
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {event.paVoiceUrl && <Mic className="h-3 w-3 text-indigo-500" />}
                        {event.paMediaUrls && (event.paMediaUrls as any).length > 0 && <Paperclip className="h-3 w-3 text-slate-400" />}
                      </div>
                      {!event.isFinalized && event.status !== "CONFIRMED" && <StatusBadge status={event.status} />}
                      {event.status === "CONFIRMED" && <StatusBadge status="FORWARDED" />}
                    </div>
                    {(event.location || event.description) && (
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>}
                        {event.description && <span className="truncate">{event.description}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!event.isFinalized && event.status !== "CONFIRMED" && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(event)} className="h-8 w-8 transition-colors hover:text-indigo-600"><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)} className="h-8 w-8 transition-colors hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </>
                    )}
                    {event.status === "CONFIRMED" && (
                      <div className="flex items-center gap-1 text-blue-600 text-xs font-semibold bg-blue-50 px-2 py-1 rounded">
                        <Send className="h-3 w-3 " /> In TP Stage
                      </div>
                    )}
                    {event.isFinalized && (
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-1 rounded">
                        <Check className="h-3 w-3 " /> Finalized
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
