"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader, LoadingSpinner, EmptyState, StatCard } from "@/components/shared/page-helpers";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Building2, Search, ArrowLeft, MapPin, DollarSign,
  Calendar, Image as ImageIcon, Activity,
  ExternalLink, Navigation, Info, TrendingUp,
  LayoutGrid, List as ListIcon, Maximize2,
} from "lucide-react";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart2 } from "lucide-react";

type ViewMode = "list" | "detail" | "analytics";
const SECTORS = ["ROADS", "BRIDGES", "WATER", "ELECTRICITY", "EDUCATION", "HEALTH", "AGRICULTURE", "HOUSING", "SANITATION", "TELECOM", "RAILWAYS", "OTHER"];
const STATUSES = ["PROPOSED", "APPROVED", "IN_PROGRESS", "COMPLETED", "DELAYED", "CANCELLED"];

const STATUS_THEMES: Record<string, { gradient: string, color: string, ring: string }> = {
  PROPOSED:    { gradient: "from-slate-600 to-slate-500", color: "bg-slate-500", ring: "ring-slate-100" },
  APPROVED:    { gradient: "from-blue-600 to-blue-500", color: "bg-blue-500", ring: "ring-blue-100" },
  IN_PROGRESS: { gradient: "from-amber-500 to-orange-500", color: "bg-amber-500", ring: "ring-amber-100" },
  ONGOING:     { gradient: "from-amber-500 to-orange-500", color: "bg-amber-500", ring: "ring-amber-100" },
  COMPLETED:   { gradient: "from-emerald-600 to-teal-500", color: "bg-emerald-500", ring: "ring-emerald-100" },
  DELAYED:     { gradient: "from-red-600 to-rose-500", color: "bg-red-500", ring: "ring-red-100" },
  CANCELLED:   { gradient: "from-gray-500 to-gray-400", color: "bg-gray-500", ring: "ring-gray-100" },
};

export default function PADevelopmentWorksPage() {
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => { fetchWorks(); }, []);

  async function fetchWorks() {
    try {
      setLoading(true);
      const res = await fetch("/api/development-works?pageSize=200");
      const data = await res.json();
      setWorks(data.data || []);
    } catch (err) {
      toast.error("Failed to fetch works");
    } finally {
      setLoading(false);
    }
  }

  const filtered = works.filter((w) => {
    if (sectorFilter !== "ALL" && w.sector !== sectorFilter) return false;
    if (statusFilter !== "ALL" && w.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return w.title?.toLowerCase().includes(q) || (w.location || "").toLowerCase().includes(q);
    }
    return true;
  });

  const totalBudget = works.reduce((s, w) => s + (w.budget || 0), 0);
  const completedCount = works.filter((w) => w.status === "COMPLETED").length;
  const inProgressCount = works.filter((w) => w.status === "IN_PROGRESS" || w.status === "ONGOING").length;

  const barData = SECTORS.map(s => ({
    name: s,
    budget: works.filter(w => w.sector === s).reduce((acc, w) => acc + (w.budget || 0), 0)
  })).filter(d => d.budget > 0);

  const pieData = STATUSES.map(s => ({
    name: s.replace(/_/g, ' '),
    value: works.filter(w => w.status === s).length,
    color: {
      PROPOSED: "#64748b", APPROVED: "#3b82f6", IN_PROGRESS: "#f59e0b",
      ONGOING: "#f59e0b", COMPLETED: "#10b981", DELAYED: "#ef4444", CANCELLED: "#6b7280"
    }[s] || "#ccc"
  })).filter(d => d.value > 0);

  if (viewMode === "detail" && selected) {
    const w = selected;
    const theme = STATUS_THEMES[w.status] || STATUS_THEMES.APPROVED;
    const progressPct = w.progress_pct || w.progressPct || (w.status === "COMPLETED" ? 100 : 0);

    return (
      <div className="space-y-6 pb-12">
        {/* Modern Header with Glassmorphism Overlay */}
        <div className="relative group rounded-3xl overflow-hidden shadow-2xl transition-all duration-500">
           <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-90`} />
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
           
           <div className="relative p-8 md:p-12 text-white">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4 max-w-3xl">
                  <Button 
                    variant="ghost" 
                    onClick={() => setViewMode("list")} 
                    className="text-white hover:bg-white/10 -ml-2 gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Projects
                  </Button>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md px-3 py-1">
                        {w.sector}
                      </Badge>
                      {w.mpladsProject && (
                        <Badge className="bg-purple-500/80 text-white border-purple-400 backdrop-blur-md px-3 py-1 shadow-lg">
                          MPLADS Project
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                      {w.title}
                    </h1>
                    {w.location && (
                      <div className="flex items-center gap-2 text-white/80 font-medium">
                        <MapPin className="h-4 w-4" /> {w.location}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-xl min-w-[180px]">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" className="stroke-white/20 fill-none" strokeWidth="8" />
                      <motion.circle 
                        cx="50" cy="50" r="45"
                        className="stroke-white fill-none"
                        strokeWidth="8"
                        strokeDasharray="283"
                        initial={{ strokeDashoffset: 283 }}
                        animate={{ strokeDashoffset: 283 - (283 * progressPct) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl">
                      {progressPct}%
                    </div>
                  </div>
                  <div className="text-center">
                    <StatusBadge status={w.status} size="md" />
                    <p className="text-[10px] uppercase font-bold tracking-widest mt-2 text-white/60">Overall Progress</p>
                  </div>
                </div>
              </div>
           </div>
        </div>

        {/* Project Navigation Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-100/50 backdrop-blur-sm p-1.5 rounded-2xl w-full sm:w-auto h-auto">
            <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md gap-2">
              <Info className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="media" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md gap-2">
              <ImageIcon className="h-4 w-4" /> Progress Media
            </TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md gap-2">
              <Calendar className="h-4 w-4" /> Timeline
            </TabsTrigger>
            <TabsTrigger value="location" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md gap-2">
              <MapPin className="h-4 w-4" /> Map & GPS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" /> Project Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      {[
                        { label: "Total Budget", value: formatCurrency(w.budget || 0), icon: <DollarSign className="h-3.5 w-3.5" />, color: "text-emerald-600" },
                        { label: "Fund Source", value: w.fundSource || "State Fund", icon: <Building2 className="h-3.5 w-3.5" /> },
                        { label: "Contractor", value: w.contractor || "N/A", icon: <Activity className="h-3.5 w-3.5" /> },
                        { label: "Start Date", value: w.startDate ? formatDate(w.startDate) : "Pending", icon: <Calendar className="h-3.5 w-3.5" /> },
                        { label: "Village/Area", value: w.location || "N/A", icon: <MapPin className="h-3.5 w-3.5" /> },
                        { label: "Sector", value: w.sector, icon: <LayoutGrid className="h-3.5 w-3.5" />, color: "text-blue-600 font-black" },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            {item.icon} {item.label}
                          </p>
                          <p className={`text-sm font-bold ${item.color || "text-slate-900"} truncate`}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    {w.description && (
                      <div className="pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
                        <p className="text-sm text-slate-600 leading-relaxed italic">"{w.description}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {w.remarks && (
                  <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 shadow-sm flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-amber-600">
                      <Info className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900">Project Remarks</h4>
                      <p className="text-sm text-amber-800/80 mt-1">{w.remarks}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                 {/* Financial summary card */}
                 <Card className="border-none bg-slate-900 text-white shadow-2xl rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />
                    <CardHeader>
                      <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Financial Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                           <p className="text-xs text-slate-400">Total Sanctioned</p>
                           <p className="text-xl font-black">{formatCurrency(w.budget || 0)}</p>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                           <motion.div 
                              className="h-full bg-emerald-400" 
                              initial={{ width: 0 }} 
                              animate={{ width: "100%" }} 
                              transition={{ duration: 1 }}
                           />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Utilized</p>
                            <p className="text-sm font-bold">{formatCurrency(w.budget_used || 0)}</p>
                         </div>
                         <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Balance</p>
                            <p className="text-sm font-bold">{formatCurrency((w.budget || 0) - (w.budget_used || 0))}</p>
                         </div>
                      </div>
                    </CardContent>
                 </Card>

                 {/* GPS Card */}
                 <Card className="border-none shadow-xl rounded-3xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Site Coordinates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {w.latitude && w.longitude ? (
                        <div className="space-y-4">
                           <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 divide-y divide-slate-200/50">
                              <div className="pb-2 flex justify-between items-center">
                                 <span className="text-xs text-slate-500">Latitude</span>
                                 <span className="font-mono text-sm font-bold">{w.latitude}</span>
                              </div>
                              <div className="pt-2 flex justify-between items-center">
                                 <span className="text-xs text-slate-500">Longitude</span>
                                 <span className="font-mono text-sm font-bold">{w.longitude}</span>
                              </div>
                           </div>
                           <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 rounded-2xl h-12 gap-2 shadow-lg">
                              <a href={`https://www.google.com/maps?q=${w.latitude},${w.longitude}`} target="_blank" rel="noopener noreferrer">
                                <Navigation className="h-4 w-4" /> Live Map Navigation
                              </a>
                           </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">No GPS coordinates available</p>
                      )}
                    </CardContent>
                 </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="media">
             {w.media && w.media.length > 0 ? (
               <div className="space-y-8">
                  {(["BEFORE", "DURING", "AFTER"] as const).map((phase) => {
                    const items = w.media.filter((m: any) => m.phase === phase);
                    if (items.length === 0) return null;
                    const meta = { 
                      BEFORE: { label: "Initial Site (Before)", color: "text-blue-600", bg: "bg-blue-50" },
                      DURING: { label: "Current Progress (During)", color: "text-amber-600", bg: "bg-amber-50" },
                      AFTER:  { label: "Final Outcome (After)", color: "text-emerald-600", bg: "bg-emerald-50" }
                    }[phase];

                    return (
                      <div key={phase} className="space-y-4">
                         <div className="flex items-center gap-4">
                           <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${meta.bg} ${meta.color}`}>
                             {meta.label}
                           </div>
                           <div className="h-px flex-1 bg-slate-100" />
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                           {items.map((m: any, idx: number) => (
                             <motion.div 
                               key={m.id} 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ delay: idx * 0.1 }}
                               className="group relative aspect-[4/3] rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300"
                             >
                               <img src={m.fileUrl} alt={m.caption || "work photo"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                 <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="p-4 bg-white rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300 hover:bg-slate-50">
                                   <Maximize2 className="h-6 w-6 text-slate-900" />
                                 </a>
                               </div>
                               {m.caption && (
                                 <div className="absolute bottom-4 left-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg transform translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                   <p className="text-[10px] font-bold text-slate-900 truncate leading-tight">{m.caption}</p>
                                 </div>
                               )}
                             </motion.div>
                           ))}
                         </div>
                      </div>
                    );
                  })}
               </div>
             ) : (
               <EmptyState 
                  icon={<ImageIcon className="h-12 w-12 text-slate-200" />} 
                  title="Photographic Proof Missing" 
                  description="Status updates are recorded, but site photos have not been uploaded by the staff yet." 
               />
             )}
          </TabsContent>

          <TabsContent value="timeline">
             <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                   <div className="relative space-y-12 before:absolute before:inset-0 before:ml-2 before:h-full before:w-1 before:bg-slate-100">
                      {[
                        { label: "Project Identified & Proposed", date: w.createdAt, icon: <Activity className="h-3.5 w-3.5" /> },
                        { label: "Official Work Commencement", date: w.startDate, icon: <Calendar className="h-3.5 w-3.5" /> },
                        { label: "Target Final Completion", date: w.endDate, icon: <Building2 className="h-3.5 w-3.5" /> }
                      ].filter(t=>t.date).map((t, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.15 }}
                          className="relative flex items-start gap-8 pl-10"
                        >
                          <div className={`absolute left-0 w-5 h-5 rounded-full ${i === 0 ? 'bg-blue-600' : 'bg-slate-200'} border-4 border-white shadow-md z-10 flex items-center justify-center`} />
                          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex-1 flex justify-between items-center">
                            <div>
                               <p className="text-sm font-black text-slate-900">{t.label}</p>
                               <p className="text-xs text-slate-400 font-medium">Record Date: {formatDate(t.date)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                               {t.icon}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {w.status === "COMPLETED" && (
                         <div className="relative flex items-start gap-8 pl-10">
                            <div className="absolute left-0 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-md z-10" />
                            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex-1">
                               <p className="text-sm font-black text-emerald-900">Project Fully Completed</p>
                               <p className="text-xs text-emerald-600/70 font-medium">Infrastructure verified and in usage.</p>
                            </div>
                         </div>
                      )}
                   </div>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PageHeader 
          title="Constituency Progress" 
          description="Monitoring development works, infrastructure projects, and constituency growth markers." 
        />
        <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={() => setViewMode("list")}
             className={cn("rounded-xl px-4 gap-2", viewMode !== "analytics" ? "bg-white shadow-sm text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900")}
           >
             <ListIcon className="h-4 w-4" /> Grid View
           </Button>
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={() => setViewMode("analytics")}
             className={cn("rounded-xl px-4 gap-2", viewMode === "analytics" ? "bg-white shadow-sm text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900")}
           >
             <BarChart2 className="h-4 w-4" /> Analytics
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Project Reach" value={works.length} icon={<Building2 className="h-5 w-5 text-blue-600" />} description="+12% this quarter" />
        <StatCard title="Active Progress" value={inProgressCount} icon={<Activity className="h-5 w-5 text-amber-600" />} description="8 critical assets" />
        <StatCard title="Total Outcomes" value={completedCount} icon={<Building2 className="h-5 w-5 text-emerald-600" />} description="High impact" />
        <StatCard title="Investment" value={formatCurrency(totalBudget)} icon={<DollarSign className="h-5 w-5 text-indigo-600" />} description="Public value" />
      </div>

      <div className="sticky top-0 z-30 pt-4 bg-white/50 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              className="pl-11 h-12 bg-white rounded-2xl border-slate-200 focus:ring-2 focus:ring-blue-500 shadow-sm" 
              placeholder="Search by project name, location or keyword..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-[150px] h-12 rounded-2xl border-slate-200 bg-white"><SelectValue placeholder="All Sectors" /></SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200">
                <SelectItem value="ALL">All Sectors</SelectItem>
                {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-12 rounded-2xl border-slate-200 bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200">
                <SelectItem value="ALL">All Status</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {viewMode === "analytics" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
           <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
             <CardHeader>
               <CardTitle className="text-lg text-slate-800">Budget by Sector</CardTitle>
             </CardHeader>
             <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickFormatter={(v) => `₹${v/100000}L`} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="budget" fill="#3b82f6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
             </CardContent>
           </Card>

           <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
             <CardHeader>
               <CardTitle className="text-lg text-slate-800">Projects by Status</CardTitle>
             </CardHeader>
             <CardContent className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
             </CardContent>
           </Card>
        </div>
      ) : loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState 
           icon={<Building2 className="h-16 w-16 text-slate-100" />} 
           title="No matches found" 
           description="We couldn't find any projects matching your current filters. Try resetting the search." 
           action={<Button variant="outline" className="rounded-full mt-4" onClick={() => { setSearchQuery(""); setSectorFilter("ALL"); setStatusFilter("ALL"); }}>Reset all filters</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((w, idx) => {
              const theme = STATUS_THEMES[w.status] || STATUS_THEMES.APPROVED;
              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                >
                  <Card 
                    className="group border border-slate-100 shadow-md hover:shadow-2xl hover:border-blue-200 transition-all duration-500 cursor-pointer rounded-[32px] overflow-hidden bg-white" 
                    onClick={() => { setSelected(w); setViewMode("detail"); window.scrollTo(0,0); }}
                  >
                    <CardContent className="p-0">
                      {/* Thumbnail mockup if no media */}
                      <div className="relative h-48 overflow-hidden bg-slate-50">
                        {w.media && w.media[0] ? (
                          <img src={w.media[0].fileUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${theme.gradient} opacity-20 flex items-center justify-center`}>
                             <Building2 className="h-12 w-12 text-slate-300" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4 flex gap-2">
                           <StatusBadge status={w.status} size="sm" />
                        </div>
                        {w.mpladsProject && (
                           <div className="absolute top-4 right-4 animate-pulse">
                              <Badge className="bg-purple-600 border-none px-2 shadow-lg">MPLADS</Badge>
                           </div>
                        )}
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <LayoutGrid className="h-3 w-3" /> {w.sector}
                          </div>
                          <h3 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors text-lg line-clamp-2 leading-tight h-12">
                            {w.title}
                          </h3>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                           <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                               <MapPin className="h-4 w-4 text-slate-400" />
                             </div>
                             <span className="truncate">{w.location || "Location shared privately"}</span>
                           </div>

                           <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Sanctioned Budget</p>
                                <p className="text-sm font-black text-slate-900">{w.budget ? formatCurrency(w.budget) : "—"}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Photos</p>
                                <p className="text-sm font-black text-slate-900 flex items-center justify-end gap-1">
                                  {(w.media || []).length} <ImageIcon className="h-3 w-3 text-slate-300" />
                                </p>
                              </div>
                           </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                           <span>View Details</span>
                           <ArrowLeft className="h-3 w-3 rotate-180 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
