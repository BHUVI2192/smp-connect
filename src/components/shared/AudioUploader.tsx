"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, CheckCircle2, Music, Loader2, FileAudio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { uploadFileViaServer } from "@/lib/upload-helper"
import { toast } from "sonner"

interface AudioUploadFile {
  file: File
  id: string
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
  url?: string
}

interface AudioUploaderProps {
  onUploadComplete: (urls: { url: string; fileName: string; type: string }[]) => void
  onClose: () => void
  maxFiles?: number
}

export function AudioUploader({ onUploadComplete, onClose, maxFiles = 10 }: AudioUploaderProps) {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const [items, setItems] = useState<AudioUploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files)
      .filter(file => file.type.startsWith("audio/") && file.size <= MAX_FILE_SIZE)
      .slice(0, maxFiles - items.length)
      .map(file => ({
        file,
        id: Math.random().toString(36).substring(7),
        progress: 0,
        status: "pending" as const,
      }))

    if (newFiles.length === 0 && files.length > 0) {
      toast.error("Please select valid audio files (MP3, WAV, etc.) under 50MB")
      return
    }

    setItems(prev => [...prev, ...newFiles])
  }

  const startUploads = async () => {
    const pendingItems = items.filter(item => item.status === "pending")
    if (pendingItems.length === 0) return

    const uploadPromises = pendingItems.map(async (item) => {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "uploading" } : i))
      
      try {
        const path = `speeches/${Date.now()}-${item.file.name}`
        const url = await uploadFileViaServer(item.file, path, "audio")
        
        setItems(prev => prev.map(i => i.id === item.id ? { 
          ...i, 
          status: "success", 
          progress: 100,
          url 
        } : i))
        return { url, fileName: item.file.name, type: item.file.type }
      } catch (err: any) {
        setItems(prev => prev.map(i => i.id === item.id ? { 
          ...i, 
          status: "error", 
          error: err.message || "Upload failed" 
        } : i))
        return null
      }
    })

    const results = await Promise.all(uploadPromises)
    const successfulUploads = results.filter((r): r is { url: string; fileName: string; type: string } => r !== null)
    
    if (successfulUploads.length > 0) {
      onUploadComplete(successfulUploads)
    }
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group",
          isDragging ? "border-primary bg-primary/5 scale-[0.99]" : "border-gray-200 hover:border-primary/50 hover:bg-gray-50/50",
          items.length > 0 && "py-6"
        )}
      >
        <input
          type="file"
          hidden
          multiple
          accept="audio/*"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all",
          isDragging ? "bg-primary text-white scale-110" : "bg-primary/10 text-primary group-hover:scale-110"
        )}>
          <Upload className="w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 leading-tight">
            Click or drag audio files
          </p>
          <p className="text-sm text-gray-500 mt-1">
            MP3, WAV, or OGG up to 50MB each
          </p>
        </div>
      </div>

      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                Files to Upload ({items.length})
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-red-500 h-8"
                onClick={() => setItems([])}
              >
                Clear all
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white border rounded-xl p-3 flex items-center gap-3 shadow-sm group relative overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    {item.status === "uploading" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Music className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.file.name}
                      </p>
                      {item.status === "success" && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                    </div>
                    
                    <div className="mt-1.5">
                      <Progress 
                        value={item.status === "success" ? 100 : item.status === "pending" ? 0 : 45} 
                        className={cn(
                          "h-1.5",
                          item.status === "error" && "bg-red-100 [&>div]:bg-red-500"
                        )}
                      />
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="pt-4 flex gap-3">
              <Button 
                className="flex-1 gradient-primary h-12 text-lg font-medium shadow-lg"
                onClick={startUploads}
                disabled={items.every(i => i.status === "success") || items.some(i => i.status === "uploading")}
              >
                {items.some(i => i.status === "uploading") ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Start Upload
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="h-12 px-6"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
