"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, LoadingSpinner, EmptyState, StatCard } from "@/components/shared/page-helpers";
import { StatusBadge } from "@/components/shared/status-badge";
import { 
  Calendar, CheckCircle2, Clock, MapPin, 
  ClipboardCheck, FileText, AlertCircle, 
  ChevronRight, Search, FileEdit
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { TPDocumentationForm } from "@/components/shared/tp-documentation-form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StaffEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "document">("list");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [search, setSearch] = useState("");

  const fetchEvents = () => {
    setLoading(true);
    fetch("/api/plan-today")
      .then((r) => r.json())
      .then((d) => setEvents(d.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDocument = (event: any) => {
    setSelectedEvent(event);
    setView("document");
  };

  const handleBackToList = () => {
    setSelectedEvent(null);
    setView("list");
  };

  const handleSuccess = () => {
    fetchEvents();
    setView("list");
    setSelectedEvent(null);
  };

  // Filter only finalized items (PA has sent them to TP)
  const tpEvents = events.filter(e => e.isFinalized || e.is_finalized);
  
  const pending = tpEvents.filter(e => e.status === "CONFIRMED");
  const completed = tpEvents.filter(e => e.status === "COMPLETED");

  const filteredPending = pending.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCompleted = completed.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  if (view === "document" && selectedEvent) {
    return (
      <div className="-m-6 bg-slate-50 min-h-screen">
        <TPDocumentationForm 
          event={selectedEvent}
          open={true}
          onOpenChange={handleBackToList}
          onSuccess={handleSuccess}
          isInline={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Tracking Project (TP)" 
        description="Comprehensive event documentation and archive."
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search reports..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[240px] bg-white border-slate-200 shadow-sm"
            />
          </div>
          <Button variant="outline" onClick={fetchEvents} size="icon" className="bg-white hover:bg-slate-50 border-slate-200 shadow-sm">
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Action Required" value={pending.length} icon={<AlertCircle className="h-5 w-5 text-amber-500" />} />
        <StatCard title="Completed Today" value={completed.length} icon={<ClipboardCheck className="h-5 w-5 text-emerald-600" />} />
        <StatCard title="Total TP Records" value={tpEvents.length} icon={<FileText className="h-5 w-5 text-indigo-600" />} />
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6">
            Pending Action ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6">
            Completed Reports ({completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? <LoadingSpinner /> : filteredPending.length === 0 ? (
            <EmptyState 
              icon={<CheckCircle2 className="h-12 w-12 text-slate-200" />} 
              title="No pending tasks" 
              description="All finalized events from the PA have been documented." 
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredPending.map((event) => (
                <Card key={event.id} className="group hover:border-indigo-200 transition-all shadow-sm border-slate-200">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                            {event.title}
                          </h3>
                          <StatusBadge status="CONFIRMED" />
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-indigo-400" /> {formatDate(event.eventDate)}</span>
                          {event.startTime && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-indigo-400" /> {event.startTime}</span>}
                          {event.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-indigo-400" /> {event.location}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleDocument(event)} 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6 rounded-lg transition-all active:scale-95"
                        >
                          <FileEdit className="h-4 w-4 mr-2" /> Document Event
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {loading ? <LoadingSpinner /> : filteredCompleted.length === 0 ? (
            <EmptyState 
              icon={<FileText className="h-12 w-12 text-slate-200" />} 
              title="No reports yet" 
              description="Documented events will appear here in the archive." 
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredCompleted.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((event) => (
                <Card key={event.id} className="opacity-90 hover:opacity-100 transition-all border-slate-200 shadow-sm border-l-4 border-l-emerald-500 bg-white/50">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-700 truncate max-w-[400px]">
                            {event.title}
                          </h3>
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none font-bold uppercase text-[9px]">COMPLETED</Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Documented on {new Date(event.updatedAt || event.updated_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleDocument(event)} 
                          className="text-slate-500 hover:text-indigo-600 font-semibold"
                        >
                          View Report <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
