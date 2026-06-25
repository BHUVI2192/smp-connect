"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/shared/page-helpers";
import { Plus, Mic, Search, Calendar, MapPin, Play, Pause, Trash2, MoreVertical, Edit2, Tag, Volume2, Clock, Music } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import { AudioUploader } from "@/components/shared/AudioUploader";

export default function PASpeechesPage() {
  const [speeches, setSpeeches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpeech, setSelectedSpeech] = useState<any>(null);
  
  // Audio Player State
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSpeeches();
  }, []);

  const fetchSpeeches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/speeches");
      const d = await res.json();
      setSpeeches(d.data || []);
    } catch (err) {
      toast.error("Failed to load speeches");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this speech? This will also remove the audio file.")) return;
    try {
      const res = await fetch(`/api/speeches/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Speech deleted");
        fetchSpeeches();
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleEdit = (speech: any) => {
    setSelectedSpeech({
      ...speech,
      tags: speech.tags?.join(", ") || ""
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSpeech?.title) return;
    try {
      const res = await fetch(`/api/speeches/${selectedSpeech.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedSpeech,
          tags: selectedSpeech.tags ? selectedSpeech.tags.split(",").map((t: string) => t.trim()) : []
        })
      });
      if (res.ok) {
        toast.success("Speech updated");
        setEditDialogOpen(false);
        fetchSpeeches();
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handlePlayPause = (speech: any) => {
    if (playingId === speech.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      setPlayingId(speech.id);
      if (audioRef.current) {
        audioRef.current.src = speech.fileUrl;
        audioRef.current.play();
      }
    }
  };

  const filteredSpeeches = speeches.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading && speeches.length === 0) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <PageHeader 
        title="Speech Archive" 
        description="Preserve and manage recorded speeches, rallies, and transcripts."
      >
        <div className="flex items-center gap-3">
          <div className="relative w-64 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search speeches..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-gray-200"
            />
          </div>
          <Button onClick={() => setUploadDialogOpen(true)} className="gradient-primary shadow-md">
            <Plus className="h-4 w-4 mr-2" /> Add Speech
          </Button>
        </div>
      </PageHeader>

      {speeches.length === 0 ? (
        <EmptyState 
          icon={<Mic className="h-16 w-16 text-gray-300" />} 
          title="No speeches found" 
          description="Your recorded speech archive is currently empty. Start by uploading an audio recording."
          action={<Button onClick={() => setUploadDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Your First Speech</Button>} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpeeches.map((speech) => (
            <motion.div
              key={speech.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="glass-panel overflow-hidden border-none shadow-lg h-full flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <Mic className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600 rounded-full" onClick={() => handleEdit(speech)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 rounded-full" onClick={() => handleDelete(speech.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight mb-2">
                      {speech.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2 opacity-70" />
                        {formatDate(speech.speechDate)}
                      </div>
                      {speech.location && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2 opacity-70" />
                          {speech.location}
                        </div>
                      )}
                    </div>

                    {speech.description && (
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                        {speech.description}
                      </p>
                    )}

                    {speech.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {speech.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-2 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Audio Player Mini */}
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-4">
                    <Button 
                      onClick={() => handlePlayPause(speech)}
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-full shrink-0 shadow-md transition-transform active:scale-95",
                        playingId === speech.id ? "bg-red-500 hover:bg-red-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      )}
                    >
                      {playingId === speech.id ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span className="flex items-center"><Volume2 className="h-3 w-3 mr-1" /> {playingId === speech.id ? "Playing" : "Available"}</span>
                        {speech.duration && <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {Math.floor(speech.duration / 60)}:{(speech.duration % 60).toString().padStart(2, '0')}</span>}
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-indigo-600"
                          initial={{ width: 0 }}
                          animate={{ width: playingId === speech.id ? "100%" : "0%" }}
                          transition={{ duration: speech.duration || 60, ease: "linear" }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-8 border-b bg-gray-50/50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Music className="w-6 h-6 text-indigo-600" />
                Upload Speeches
              </DialogTitle>
              <p className="text-sm text-gray-500">Add recorded audio speeches to the archive. You can set metadata for each after upload.</p>
            </DialogHeader>
          </div>
          
          <div className="p-8">
            <AudioUploader 
              onUploadComplete={(results) => {
                // In a real app, we'd open a form for each upload to set date/location
                // For now, we'll auto-create with today's date and prompt for edit
                results.forEach(async (res) => {
                  await fetch("/api/speeches", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: res.fileName.split(".")[0],
                      speechDate: new Date().toISOString().split("T")[0],
                      fileUrl: res.url,
                      fileType: "audio",
                      tags: ["Uploaded"]
                    })
                  });
                });
                fetchSpeeches();
              }}
              onClose={() => setUploadDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Speech Details</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label>Speech Title</Label>
              <Input value={selectedSpeech?.title} onChange={(e) => setSelectedSpeech({ ...selectedSpeech, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={selectedSpeech?.speechDate?.split("T")[0]} onChange={(e) => setSelectedSpeech({ ...selectedSpeech, speechDate: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Location</Label>
                <Input value={selectedSpeech?.location} onChange={(e) => setSelectedSpeech({ ...selectedSpeech, location: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Tags (comma separated)</Label>
              <Input value={selectedSpeech?.tags} onChange={(e) => setSelectedSpeech({ ...selectedSpeech, tags: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Description / Key Points</Label>
              <Textarea value={selectedSpeech?.description} onChange={(e) => setSelectedSpeech({ ...selectedSpeech, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} className="gradient-primary">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingId(null)}
        onError={() => { toast.error("Audio playback error"); setPlayingId(null); }}
      />
    </div>
  );
}
