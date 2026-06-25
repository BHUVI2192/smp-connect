"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { uploadFileViaServer } from "@/lib/upload-helper";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MediaUploaderProps {
  albumId: string;
  onUploadComplete: (photos: any[]) => void;
  onClose: () => void;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function MediaUploader({ albumId, onUploadComplete, onClose }: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => f.type.startsWith("image/"));
    if (validFiles.length < newFiles.length) {
      toast.error("Some files were skipped. Only images are allowed.");
    }

    const fileObjects: UploadingFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: "pending"
    }));

    setFiles(prev => [...prev, ...fileObjects]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      const removed = prev.find(f => f.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    const uploadPromises = files.map(async (fileObj) => {
      if (fileObj.status === "success") return null;

      try {
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "uploading", progress: 10 } : f));
        
        // Mock progress updates for a smoother feel
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => {
            if (f.id === fileObj.id && f.status === "uploading" && f.progress < 90) {
              return { ...f, progress: f.progress + 5 };
            }
            return f;
          }));
        }, 500);

        const storagePath = `gallery/${albumId}/${Date.now()}_${fileObj.file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const url = await uploadFileViaServer(fileObj.file, storagePath, "images");
        
        clearInterval(progressInterval);
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "success", progress: 100 } : f));
        
        return { url, caption: fileObj.file.name.split(".")[0] };
      } catch (err) {
        console.error("Upload error for file:", fileObj.file.name, err);
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "error", error: "Failed to upload" } : f));
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(r => r !== null);

    if (successfulUploads.length > 0) {
      try {
        const res = await fetch(`/api/gallery/${albumId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photos: successfulUploads })
        });
        
        if (res.ok) {
          const data = await res.json();
          toast.success(`Successfully uploaded ${successfulUploads.length} photos`);
          onUploadComplete(data.data);
          // Auto close after success if all was good
          if (successfulUploads.length === files.length) {
            setTimeout(onClose, 1500);
          }
        }
      } catch (err) {
        toast.error("Failed to save photos to database");
      }
    }

    setIsUploading(false);
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 text-center cursor-pointer",
          isDragging ? "border-primary bg-primary/5 scale-[0.99]" : "border-gray-200 hover:border-primary/50",
          files.length > 0 ? "py-8" : "py-16"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
        />
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="p-4 rounded-full bg-primary/10 text-primary">
            <Upload className="h-8 w-8" />
          </div>
          <div>
            <p className="text-lg font-medium">Click or drag images to upload</p>
            <p className="text-sm text-gray-500 mt-1">PNG, JPG, WebP supported</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{files.length} images selected</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFiles([])} 
                disabled={isUploading}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Clear all
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-1">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="group relative aspect-square rounded-lg overflow-hidden border bg-white shadow-sm"
                >
                  <img
                    src={file.preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Overlays */}
                  <div className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center transition-opacity",
                    file.status === "pending" ? "opacity-0 group-hover:opacity-100 bg-black/40" : "bg-black/60 opacity-100"
                  )}>
                    {file.status === "pending" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                        className="p-1.5 rounded-full bg-white text-gray-900 shadow-lg hover:scale-110 transition-transform"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    
                    {file.status === "uploading" && (
                      <div className="w-full px-4 text-center">
                        <Loader2 className="h-6 w-6 text-white animate-spin mx-auto mb-2" />
                        <Progress value={file.progress} className="h-1 bg-white/20" />
                        <span className="text-[10px] text-white mt-1 uppercase tracking-wider font-bold">Uploading</span>
                      </div>
                    )}

                    {file.status === "success" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-white flex flex-col items-center"
                      >
                        <CheckCircle2 className="h-8 w-8 text-green-400" />
                      </motion.div>
                    )}

                    {file.status === "error" && (
                      <div className="text-white flex flex-col items-center p-2 text-center">
                        <AlertCircle className="h-6 w-6 text-red-500 mb-1" />
                        <span className="text-[10px] font-bold">Error</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-4 flex gap-3">
              <Button 
                onClick={startUpload} 
                disabled={isUploading || files.length === 0 || files.every(f => f.status === "success")}
                className="flex-1 h-11"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Start Upload
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isUploading}
                className="h-11 px-8"
              >
                Close
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
