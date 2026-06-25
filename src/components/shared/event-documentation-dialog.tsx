"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Upload, Users, Paperclip, Loader2, CheckCircle2, MessageSquare, Mic, Image as ImageIcon, ChevronDown, ChevronUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";

interface EventDocumentationDialogProps {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EventDocumentationDialog({
  event,
  open,
  onOpenChange,
  onSuccess,
}: EventDocumentationDialogProps) {
  const [documentation, setDocumentation] = useState(event?.documentation || "");
  const [isBriefExpanded, setIsBriefExpanded] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [attendeeInput, setAttendeeInput] = useState("");
  const [attendees, setAttendees] = useState<string[]>(event?.attendees || []);
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>(event?.docMediaUrls || []);

  // Cleanup effect for object URLs
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
    if (!documentation.trim() && files.length === 0 && attendees.length === 0) {
      toast.error("Please add some documentation details");
      return;
    }

    try {
      setUploading(true);
      const supabase = createSupabaseBrowser();
      const newMediaUrls = [...mediaUrls];

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
        
        newMediaUrls.push(publicUrl);
      }

      // Update event in DB
      const res = await fetch(`/api/plan-today/documentation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          documentation,
          attendees,
          mediaUrls: newMediaUrls,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || "Failed to update documentation");
      }

      toast.success("Documentation saved and PA notified!");
      onSuccess?.();
      onOpenChange(false);
      setFiles([]);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none bg-white">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Document Event: {event?.title}
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            Complete the documentation for this event. You can add notes, participants, and upload any media evidence.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-2">
          <div className="space-y-6 pb-6 relative" ref={scrollRef}>
            {/* PA Original Context Section */}
            {(event?.description || event?.paVoiceUrl || (event?.paMediaUrls && (event?.paMediaUrls as any[]).length > 0)) && (
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-2xl border border-blue-100/50 space-y-4 shadow-sm relative transition-all duration-300">
                <div 
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => setIsBriefExpanded(!isBriefExpanded)}
                >
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2 group-hover:text-blue-800 transition-colors">
                    <Mic className="h-3.5 w-3.5" /> Original PA Brief
                    {isBriefExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </p>
                  <Badge variant="outline" className="text-[9px] bg-white/80 border-blue-200 text-blue-600 font-bold uppercase">Source: TP</Badge>
                </div>
                
                {isBriefExpanded && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {event.description && (
                      <p className="text-sm text-gray-700 leading-relaxed font-medium italic">"{event.description}"</p>
                    )}
                    
                    {event.paVoiceUrl && (
                      <div className="flex items-center gap-3 p-2 bg-white/80 rounded-xl border border-blue-50 shadow-sm w-fit backdrop-blur-sm">
                        <audio src={event.paVoiceUrl} controls className="h-8 max-w-[200px]" />
                      </div>
                    )}
                    
                    {event.paMediaUrls && (event.paMediaUrls as any[]).length > 0 && (
                      <div className="flex gap-2.5 overflow-x-auto py-1 scrollbar-hide">
                        {(event.paMediaUrls as any[]).map((url: string, i: number) => (
                          <div key={i} className="h-20 w-20 rounded-xl border-2 border-white shadow-md bg-white overflow-hidden shrink-0 hover:scale-[1.05] transition-transform duration-300">
                            <img src={url} alt="PA Media" className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {!isBriefExpanded && (event?.description || event?.paVoiceUrl || (event?.paMediaUrls && (event?.paMediaUrls as any[]).length > 0)) && (
                <div className="absolute top-4 right-4 z-10">
                   <Button variant="secondary" size="icon" className="rounded-full shadow-md bg-white text-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 border border-indigo-100" onClick={() => {
                        const formElem = document.getElementById("documentation-form-start");
                        if(formElem) {
                           formElem.scrollIntoView({ behavior: 'smooth' });
                        }
                   }}>
                        <ArrowDown className="h-4 w-4" />
                   </Button>
                </div>
            )}

            <div id="documentation-form-start" className="space-y-2.5">
              <Label className="text-sm font-bold flex items-center gap-2 text-gray-800">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                Documentation Details
              </Label>
              <Textarea
                placeholder="Describe what happened, outcomes, and feedback..."
                className="min-h-[140px] resize-none focus-visible:ring-green-500 bg-gray-50/50 border-gray-200 rounded-xl text-sm leading-relaxed"
                value={documentation}
                onChange={(e) => setDocumentation(e.target.value)}
              />
            </div>

            <div className="space-y-2.5">
              <Label className="text-sm font-bold flex items-center gap-2 text-gray-800">
                <Users className="h-4 w-4 text-indigo-500" />
                Attendees
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type name & hit Add..."
                  value={attendeeInput}
                  onChange={(e) => setAttendeeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAttendee())}
                  className="bg-gray-50/50 border-gray-200 rounded-xl h-10"
                />
                <Button type="button" variant="outline" onClick={handleAddAttendee} className="shrink-0 h-10 px-4 rounded-xl border-gray-200 font-bold hover:bg-gray-50">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {attendees.map((name) => (
                  <Badge key={name} variant="secondary" className="px-3 py-1.5 gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-100 rounded-lg shadow-sm font-medium animate-in zoom-in-50 duration-200">
                    {name}
                    <X
                      className="h-3.5 w-3.5 cursor-pointer hover:text-red-500 transition-colors"
                      onClick={() => removeAttendee(name)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold flex items-center gap-2 text-gray-800">
                <ImageIcon className="h-4 w-4 text-indigo-500" />
                Photos & Media Proof
              </Label>
              <div 
                className="group relative border-2 border-dashed rounded-2xl p-8 text-center bg-gray-50/30 border-gray-200 hover:bg-green-50/40 hover:border-green-300 transition-all duration-300 cursor-pointer"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-green-500 group-hover:scale-110 transition-all duration-300">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 font-bold">Select media files</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Images, Video, or PDF (Max 10MB)</p>
                  </div>
                </div>
              </div>

              {/* Visual Preview Grid */}
              {filePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {filePreviews.map((preview, i) => (
                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm animate-in zoom-in-50 duration-200">
                      {files[i]?.type.startsWith('image/') ? (
                        <img src={preview} alt="preview" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center p-2 bg-indigo-50/30 text-indigo-500">
                          <Paperclip className="h-6 w-6 mb-1" />
                          <p className="text-[8px] text-center font-bold uppercase truncate w-full px-1">{files[i]?.name.split('.').pop()}</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="h-8 w-8 bg-white/90 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {mediaUrls.length > 0 && (
                <div className="space-y-3 pt-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Already Documented</p>
                  <div className="grid grid-cols-5 gap-2">
                    {mediaUrls.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 group shadow-sm ring-2 ring-white hover:ring-indigo-100 transition-all duration-300">
                        <img src={url} alt="Uploaded" className="object-cover w-full h-full" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-gray-50/50 gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={uploading} className="font-bold text-gray-500 hover:text-gray-800">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={uploading} 
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100 font-black px-8 h-11 rounded-xl transition-all active:scale-95"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finalizing...
              </>
            ) : (
              "Complete Documentation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
