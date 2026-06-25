"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/shared/page-helpers";
import { Plus, Image as ImageIcon, ChevronLeft, Upload, Calendar, ArrowRight, Trash2, MoreVertical } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { MediaUploader } from "@/components/shared/MediaUploader";

export default function PAGalleryPage() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", eventDate: "" });

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery");
      const d = await res.json();
      setAlbums(d.data || []);
    } catch (err) {
      toast.error("Failed to load albums");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumDetail = async (albumId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/gallery/${albumId}`);
      const d = await res.json();
      if (d.data) {
        setSelectedAlbum(d.data);
      }
    } catch (err) {
      toast.error("Failed to load album details");
    } finally {
      setDetailLoading(false);
    }
  };

  async function handleCreateAlbum() {
    if (!form.title) {
      toast.error("Title is required");
      return;
    }
    const res = await fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Album created successfully");
      setDialogOpen(false);
      fetchAlbums();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to create album");
    }
  }

  const handleDeleteAlbum = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this album and all its photos?")) return;

    try {
      const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Album deleted");
        if (selectedAlbum?.id === id) {
          setSelectedAlbum(null);
        }
        fetchAlbums();
      }
    } catch (err) {
      toast.error("Failed to delete album");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-20">
      <AnimatePresence mode="wait">
        {!selectedAlbum ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <PageHeader
              title="Media Gallery"
              description="Capture and organize your constituency events"
            >
              <Button
                onClick={() => {
                  setForm({ title: "", description: "", eventDate: "" });
                  setDialogOpen(true);
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" /> New Album
              </Button>
            </PageHeader>

            {albums.length === 0 ? (
              <EmptyState
                icon={<ImageIcon className="h-12 w-12 text-gray-300" />}
                title="No photo albums yet"
                description="Create your first album to start organizing your event photos."
                action={
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create First Album
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {albums.map((album, idx) => (
                  <motion.div
                    key={album.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card 
                      className="group cursor-pointer overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white/50 backdrop-blur-sm"
                      onClick={() => fetchAlbumDetail(album.id)}
                    >
                      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                        {album.coverUrl ? (
                          <img
                            src={album.coverUrl}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                            <ImageIcon className="h-12 w-12 mb-2" />
                            <span className="text-xs">No cover photo</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                          >
                            View Album <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
                           <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => handleDeleteAlbum(e, album.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{album.title}</h3>
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {album.eventDate ? formatDate(album.eventDate) : "No date set"}
                            </p>
                          </div>
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                            {album._count?.photos || 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedAlbum(null)}
                className="hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to Gallery
              </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 border-b">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">{selectedAlbum.title}</h1>
                <p className="text-gray-500 mt-2 max-w-2xl">{selectedAlbum.description || "No description provided."}</p>
                <div className="flex items-center gap-4 mt-4">
                  <span className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    {selectedAlbum.eventDate ? formatDate(selectedAlbum.eventDate) : "Unscheduled"}
                  </span>
                  <span className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {selectedAlbum.photos?.length || 0} Photos
                  </span>
                </div>
              </div>
              <Button onClick={() => setUploadDialogOpen(true)} className="gradient-primary text-white shadow-lg shadow-primary/20">
                <Upload className="h-4 w-4 mr-2" /> Add Photos
              </Button>
            </div>

            {selectedAlbum.photos?.length === 0 ? (
              <div className="bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 p-20 text-center">
                <div className="max-w-xs mx-auto">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">This album is empty</h3>
                  <p className="text-gray-500 mt-2 mb-6">Start populating your album with memories by uploading event photos.</p>
                  <Button onClick={() => setUploadDialogOpen(true)} variant="outline">
                    <Upload className="h-4 w-4 mr-2" /> Upload Now
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {selectedAlbum.photos.map((photo: any, idx: number) => (
                  <motion.div
                    key={photo.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200"
                  >
                    <img 
                      src={photo.fileUrl} 
                      alt={photo.caption || "Gallery"} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="ghost" size="icon" className="text-white hover:text-red-400">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Album Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Album</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Album Title <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="e.g. Youth Summit 2024" 
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                placeholder="Briefly describe the event..." 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Event Date</Label>
              <Input 
                type="date" 
                value={form.eventDate} 
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAlbum} className="gradient-primary">Create Album</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(val) => !detailLoading && setUploadDialogOpen(val)}>
        <DialogContent className="max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Upload Media to {selectedAlbum?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <MediaUploader 
              albumId={selectedAlbum?.id} 
              onUploadComplete={(newPhotos) => {
                fetchAlbumDetail(selectedAlbum.id);
                fetchAlbums();
              }} 
              onClose={() => setUploadDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
