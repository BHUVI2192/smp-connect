"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { 
  X, Upload, Users, Paperclip, Loader2, CheckCircle2, 
  MessageSquare, Mic, Image as ImageIcon, ChevronDown, 
  ChevronUp, Clock, MapPin, ClipboardList, Info, AlertCircle, ListChecks
} from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";

interface TPDocumentationFormProps {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  isInline?: boolean;
}

export function TPDocumentationForm({
  event,
  open,
  onOpenChange,
  onSuccess,
  isInline = false,
}: TPDocumentationFormProps) {
  // Documentation Fields
  const [documentation, setDocumentation] = useState("");
  const [attendeeInput, setAttendeeInput] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Logistics Fields (Pre-filled from event)
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");

  const [isBriefExpanded, setIsBriefExpanded] = useState(true);

  // Load initial data
  useEffect(() => {
    if (event) {
      setDocumentation(event.documentation || "");
      setAttendees(event.attendees || []);
      setStartTime(event.startTime || "");
      setEndTime(event.endTime || "");
      setLocation(event.location || "");
    }
  }, [event]);

  // Cleanup for object URLs
  useEffect(() => {
    return () => {
      filePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleAddAttendee = () => {
    if (attendeeInput.trim() && !attendees.includes(attendeeInput.trim())) {
      setAttendees([...attendees, attendeeInput.trim()]);
      setAttendeeInput("");
    }
  };

  const removeAttendee = (name: string) => {
    setAttendees(attendees.filter((a) => a !== name));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setFiles([...files, ...newFiles]);
      setFilePreviews([...filePreviews, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setFiles(files.filter((_, i) => i !== index));
    setFilePreviews(filePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!documentation.trim()) {
      toast.error("Please add an event summary/documentation");
      return;
    }

    try {
      setUploading(true);
      const supabase = createSupabaseBrowser();
      const mediaUrls: string[] = [...(event?.docMediaUrls || [])];

      // Upload new files
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${event.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `event-docs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath);
        
        mediaUrls.push(publicUrl);
      }

      // Update event in DB (including logistical updates)
      const res = await fetch(`/api/plan-today/documentation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          documentation,
          attendees,
          mediaUrls,
          // Updated logistical info
          startTime,
          endTime,
          location,
          status: "COMPLETED" 
        }),
      });

      if (!res.ok) throw new Error("Failed to save documentation");

      toast.success("Event fully documented and COMPLETED");
      onSuccess?.();
      onOpenChange(false);
      setFiles([]);
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setUploading(false);
    }
  };

  if (isInline) {
    return (
      <div className="flex flex-col bg-slate-50 min-h-screen">
        <div className="bg-indigo-600 p-6 text-white shrink-0">
          <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)} 
                className="text-white hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Proper Event Documentation</h1>
                  <p className="text-indigo-100 text-sm">Update logistics, evidence, and report summary.</p>
                </div>
              </div>
            </div>
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">TP TRACKING</Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8 max-w-4xl mx-auto pb-32">
            {renderContent()}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 border-t bg-white flex items-center justify-center shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-10">
          <div className="flex items-center justify-between w-full max-w-4xl">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={uploading}>Cancel & Return</Button>
            <Button 
              onClick={handleSubmit} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-12 h-12 rounded-xl shadow-lg shadow-indigo-100 text-base"
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Report...</>
              ) : "Submit Final Report"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-none">
        <div className="bg-indigo-600 p-6 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Proper Event Documentation</DialogTitle>
                <p className="text-indigo-100 text-sm">Update logistics, evidence, and report summary.</p>
              </div>
            </div>
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">TP TRACKING</Badge>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8 max-w-3xl mx-auto">
            {renderContent()}
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-white flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={uploading}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10 h-11 rounded-xl shadow-lg shadow-emerald-100"
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Report...</>
            ) : "Submit Final Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  function renderContent() {
    return (
      <>
        {/* 1. PA Context (Non-editable) */}
        <section className="space-y-3">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsBriefExpanded(!isBriefExpanded)}
          >
            <div className="flex items-center gap-2 text-slate-900">
              <Info className="h-4 w-4 text-indigo-500" />
              <h3 className="font-bold text-sm uppercase tracking-wider">PA Briefing & Context</h3>
            </div>
            {isBriefExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          
          {isBriefExpanded && (
            <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-50">
                <div>
                  <Label className="text-[10px] text-slate-400 font-black uppercase">Original Title</Label>
                  <p className="text-sm font-semibold">{event?.title}</p>
                </div>
                <div>
                  <Label className="text-[10px] text-slate-400 font-black uppercase">Planned Location</Label>
                  <p className="text-sm font-semibold">{event?.location || "N/A"}</p>
                </div>
              </div>

              {event?.description && (
                <div className="space-y-1 pb-2 border-b border-slate-50">
                  <Label className="text-[10px] text-slate-400 font-black uppercase">PA Briefing Notes</Label>
                  <p className="text-sm text-slate-700 leading-relaxed italic">"{event.description}"</p>
                </div>
              )}

              {/* PA Detailing Context */}
              { (event?.keyDecisions || event?.key_decisions || event?.issues || event?.actions) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-2 border-b border-slate-50">
                  {(event.keyDecisions || event.key_decisions) && (
                    <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                      <Label className="text-[9px] text-blue-700 font-black uppercase flex items-center gap-1 mb-1">
                        <Info className="h-2.5 w-2.5" /> Decisions
                      </Label>
                      <p className="text-[11px] text-blue-900 leading-tight">{event.keyDecisions || event.key_decisions}</p>
                    </div>
                  )}
                  {event.issues && (
                    <div className="p-2.5 bg-red-50/50 rounded-lg border border-red-100">
                      <Label className="text-[9px] text-red-700 font-black uppercase flex items-center gap-1 mb-1">
                        <AlertCircle className="h-2.5 w-2.5" /> Issues
                      </Label>
                      <p className="text-[11px] text-red-900 leading-tight">{event.issues}</p>
                    </div>
                  )}
                  {event.actions && (
                    <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                      <Label className="text-[9px] text-emerald-700 font-black uppercase flex items-center gap-1 mb-1">
                        <ListChecks className="h-2.5 w-2.5" /> Actions
                      </Label>
                      <p className="text-[11px] text-emerald-900 leading-tight">{event.actions}</p>
                    </div>
                  )}
                </div>
              )}

              {event?.paVoiceUrl && (
                <div className="space-y-2">
                  <Label className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1">
                    <Mic className="h-3 w-3" /> PA Recorded Briefing
                  </Label>
                  <audio src={event.paVoiceUrl} controls className="h-9 w-full max-w-sm" />
                </div>
              )}

              {event?.paMediaUrls && (event.paMediaUrls as string[]).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[10px] text-slate-400 font-black uppercase">Reference Media</Label>
                  <div className="flex gap-2.5 overflow-x-auto pb-2">
                    {(event.paMediaUrls as string[]).map((url: string, i: number) => (
                      <div key={i} className="h-20 w-20 rounded-lg border bg-slate-50 shrink-0 overflow-hidden cursor-zoom-in hover:brightness-90 transition-all">
                        <img src={url} alt="Reference" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 2. Logistical Updates */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Clock className="h-4 w-4 text-emerald-500" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Actual Logistics</h3>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Actual Start Time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Actual End Time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Final Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input className="pl-9" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Verified location" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Attendees */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Users className="h-4 w-4 text-orange-500" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Participants / Attendees</h3>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Enter full name of participant..." 
                value={attendeeInput}
                onChange={(e) => setAttendeeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAttendee())}
              />
              <Button onClick={handleAddAttendee} variant="secondary">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attendees.length === 0 && <p className="text-xs text-slate-400 italic">No attendees added yet.</p>}
              {attendees.map((name) => (
                <Badge key={name} variant="outline" className="pl-3 pr-1 py-1.5 flex items-center gap-1.5 bg-slate-50 border-slate-200">
                  {name}
                  <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeAttendee(name)} />
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Evidence Media */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <ImageIcon className="h-4 w-4 text-blue-500" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Evidence & Media Proof</h3>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm space-y-6">
            <div 
              className="border-2 border-dashed rounded-xl p-8 text-center bg-slate-50 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all cursor-pointer group"
              onClick={() => document.getElementById("evidence-upload")?.click()}
            >
              <input id="evidence-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3 group-hover:text-indigo-500 group-hover:scale-110 transition-all" />
              <p className="text-sm font-bold text-slate-600">Click to upload photos or videos</p>
              <p className="text-xs text-slate-400">High quality evidence for the final report</p>
            </div>

            {filePreviews.length > 0 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {filePreviews.map((preview, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-white group shadow-sm">
                    <img src={preview} className="h-full w-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 5. Final Report Summary */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <MessageSquare className="h-4 w-4 text-purple-500" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Final Report Summary</h3>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <Textarea 
              placeholder="Provide a detailed professional summary of the event outcomes, decisions made, and follow-up actions..." 
              className="min-h-[200px] text-base leading-relaxed"
              value={documentation}
              onChange={(e) => setDocumentation(e.target.value)}
            />
          </div>
        </section>
      </>
    );
  }

}
