"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/shared/page-helpers";
import { Calendar, CheckCircle2, CheckCircle, Mic, Play, Search } from "lucide-react";
import { EventDocumentationDialog } from "@/components/shared/event-documentation-dialog";
import { toast } from "sonner";

export default function StaffPlanTodayPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [docDialogOpen, setDocDialogOpen] = useState(false);

  const fetchEvents = () => {
    setLoading(true);
    fetch(`/api/plan-today?date=${selectedDate}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.data || []))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load events");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  const handleDocumentClick = (event: any) => {
    setSelectedEvent(event);
    setDocDialogOpen(true);
  };

  const statusColors: Record<string, string> = { 
    DRAFT: "bg-gray-100 text-gray-700", 
    CONFIRMED: "bg-blue-100 text-blue-700", 
    COMPLETED: "bg-green-100 text-green-700", 
    CANCELLED: "bg-red-100 text-red-700" 
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="TP Documentation" description="Document and complete events planned for today">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search TP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/50 border-gray-200 focus-visible:ring-green-500"
            />
          </div>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[150px] bg-white/50" />
        </div>
      </PageHeader>
      
      {loading ? (
        <LoadingSpinner />
      ) : filteredEvents.length === 0 ? (
        <EmptyState 
          icon={<Calendar className="h-12 w-12 text-gray-300" />} 
          title={searchQuery ? "No matching results" : "No TP"} 
          description={searchQuery ? `We couldn't find any events matching "${searchQuery}"` : "No finalized TP for this date."} 
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvents.map((event) => (
            <Card 
              key={event.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleDocumentClick(event)}
            >
              <CardContent className="py-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{event.title}</h3>
                    
                    {event.startTime && (
                      <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-1">
                        {selectedDate} at {event.startTime}{event.endTime ? ` — ${event.endTime}` : ""}
                      </p>
                    )}
                    
                    {event.location && (
                      <p className="text-sm text-gray-500 mt-1">
                        {event.location}
                      </p>
                    )}

                    {/* PA original notes & media */}
                    {(event.description || event.paVoiceUrl || (event.paMediaUrls && (event.paMediaUrls as any[]).length > 0)) && (
                      <div className="mt-3 p-3 bg-blue-50/30 rounded-lg border border-blue-100/50">
                        <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Mic className="h-3 w-3" /> PA Notes & Media
                        </p>
                        
                        {event.description && (
                          <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                        )}
                        
                        {event.paVoiceUrl && (
                          <div className="flex items-center gap-2 mb-2 p-1.5 bg-white rounded border border-blue-100 w-fit">
                            <audio src={event.paVoiceUrl} controls className="h-8 max-w-[200px]" />
                          </div>
                        )}
                        
                        {event.paMediaUrls && (event.paMediaUrls as any[]).length > 0 && (
                          <div className="flex gap-2 overflow-x-auto py-1">
                            {(event.paMediaUrls as any[]).map((url: string, i: number) => (
                              <div key={i} className="h-16 w-16 rounded border bg-white overflow-hidden shrink-0">
                                <img src={url} alt="PA Media" className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {event.documentation && (
                       <div className="mt-3 p-3 bg-green-50/50 rounded-lg border border-green-100">
                          <p className="text-xs font-bold text-green-800 uppercase mb-1">Documentation</p>
                          <p className="text-sm text-green-900 line-clamp-2">{event.documentation}</p>
                       </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className={`${statusColors[event.status] || ""} font-bold px-3 py-1`}>
                      {event.status}
                    </Badge>
                    
                    <Button 
                      variant="outline"
                      size="sm" 
                      className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDocumentClick(event);
                      }}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {event.documentation ? "Update" : "Complete"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedEvent && (
        <EventDocumentationDialog
          event={selectedEvent}
          open={docDialogOpen}
          onOpenChange={setDocDialogOpen}
          onSuccess={fetchEvents}
        />
      )}
    </div>
  );
}
