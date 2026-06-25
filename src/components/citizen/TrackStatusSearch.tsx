"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ClipboardList, Clock, CheckCircle2, AlertCircle, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function TrackStatusSearch() {
  const [refId, setRefId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refId.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/complaints/track?id=${refId.trim().toUpperCase()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to find complaint");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RECEIVED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "IN_PROGRESS": return "bg-orange-100 text-orange-700 border-orange-200";
      case "RESOLVED": return "bg-green-100 text-green-700 border-green-200";
      case "REJECTED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">Track Your Complaint</h2>
        <p className="text-gray-400">Enter your unique reference ID to check the real-time status.</p>
      </div>

      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-0 bg-blue-500/20 blur-xl group-hover:bg-blue-500/30 transition-all rounded-2xl" />
        <div className="relative flex gap-2 p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
          <Input
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
            placeholder="Enter Reference ID (e.g. MP-ABC123)"
            className="bg-transparent border-none text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg h-12"
          />
          <Button 
            disabled={loading}
            className="bg-white hover:bg-gray-100 text-black font-bold h-12 px-8 rounded-xl shrink-0 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
            {loading ? "Searching..." : "Track Status"}
          </Button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-3xl">
              <CardContent className="p-0">
                <div className="bg-gray-900 p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Reference ID</p>
                    <p className="text-2xl font-mono text-white font-black">{refId.toUpperCase()}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full border text-sm font-bold ${getStatusColor(result.status)}`}>
                    {result.status.replace("_", " ")}
                  </div>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                          <ClipboardList className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase">Subject</p>
                          <p className="text-gray-900 font-semibold">{result.subject}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase">Submitted On</p>
                          <p className="text-gray-900 font-semibold">{format(new Date(result.createdAt), "PPP")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase">Category</p>
                          <p className="text-gray-900 font-semibold">{result.category}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase mb-2">Description</p>
                      <p className="text-gray-700 text-sm leading-relaxed">{result.description}</p>
                    </div>
                    {result.location && (
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase mb-2">Location</p>
                        <p className="text-gray-700 text-sm">{result.location}</p>
                      </div>
                    )}
                  </div>

                  {result.attachments && Array.isArray(result.attachments) && result.attachments.length > 0 && (
                    <div className="pt-6 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-bold uppercase mb-4">Submitted Attachments</p>
                      <div className="flex flex-wrap gap-4">
                        {result.attachments.map((url: string, idx: number) => (
                          <a 
                            key={idx} 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-orange-500 transition-colors bg-gray-50 flex items-center justify-center group"
                          >
                            <img src={url} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.resolution && (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                      <p className="text-xs text-green-600 font-bold uppercase mb-1">Official Resolution</p>
                      <p className="text-green-800 text-sm">{result.resolution}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
