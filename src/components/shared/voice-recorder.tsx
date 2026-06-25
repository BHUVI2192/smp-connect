"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Play, Pause, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onRecordingComplete: (file: File) => void;
  onClear: () => void;
}

export function VoiceRecorder({ onRecordingComplete, onClear }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        onRecordingComplete(file);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleClear = () => {
    setAudioURL(null);
    setDuration(0);
    setIsPlaying(false);
    onClear();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Voice Note</span>
        {duration > 0 && (
          <span className={`text-xs font-mono ${isRecording ? 'text-red-500 animate-pulse font-bold' : 'text-gray-600'}`}>
            {formatTime(duration)}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {!audioURL ? (
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex-1 ${isRecording ? 'animate-pulse' : ''}`}
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Record Voice Note
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2 flex-1">
             <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={togglePlayback}
                className="h-9 w-9 border-green-200 text-green-600 hover:bg-green-50"
             >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
             </Button>
             
             <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-0 transition-all duration-300" />
             </div>
             
             <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-9 w-9 text-gray-400 hover:text-red-500"
             >
                <Trash2 className="h-4 w-4" />
             </Button>

             <audio 
                ref={audioRef} 
                src={audioURL} 
                onEnded={() => setIsPlaying(false)} 
                className="hidden" 
             />
          </div>
        )}
      </div>
    </div>
  );
}
