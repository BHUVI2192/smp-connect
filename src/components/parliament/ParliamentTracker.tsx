"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Building2,
  Tag,
  ChevronRight,
  ArrowUpRight,
  FileSearch
} from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

interface ParliamentItem {
  id: string;
  referenceNo: string | null;
  subject: string;
  ministry: string | null;
  dateRaised: string;
  expectedResponseDate: string | null;
  priority: string | null;
  letterCategory: string | null;
  status: string;
  documentUrl: string | null;
  type: "LETTER" | "QUESTION";
}

export default function ParliamentTracker() {
  const pathname = usePathname();
  const isStaff = pathname?.includes('/staff');
  const [items, setItems] = useState<ParliamentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [selectedViewItem, setSelectedViewItem] = useState<ParliamentItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/parliament");
      const result = await res.json();
      
      // The API returns { data: { letters: [], questions: [] } }
      if (result.data && Array.isArray(result.data.letters)) {
        // For now, mapping both to the tracker format
        const letters = result.data.letters.map((l: any) => ({
          ...l,
          type: "LETTER"
        }));
        
        const questions = (result.data.questions || []).map((q: any) => ({
          ...q,
          id: q.id,
          referenceNo: q.questionNo,
          subject: q.subject,
          ministry: q.ministry,
          dateRaised: q.questionDate,
          expectedResponseDate: null, // Questions might not have this yet
          status: q.answers && q.answers.length > 0 ? "RESOLVED" : "PENDING",
          type: "QUESTION"
        }));

        setItems([...letters, ...questions]);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to fetch parliament items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (item: ParliamentItem) => {
    if (item.status === "RESOLVED") return { label: "Responded", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 };
    
    if (item.expectedResponseDate) {
      const expectedDate = new Date(item.expectedResponseDate);
      if (isBefore(expectedDate, new Date())) {
        return { label: "Overdue", color: "bg-rose-100 text-rose-700", icon: AlertCircle };
      }
      if (isBefore(expectedDate, addDays(new Date(), 7))) {
        return { label: "Due Soon", color: "bg-amber-100 text-amber-700", icon: Clock };
      }
    }
    
    return { label: "In Progress", color: "bg-indigo-100 text-indigo-700", icon: Clock };
  };

  const filteredItems = (Array.isArray(items) ? items : []).filter(item => {
    const matchesSearch = 
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.referenceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (item.ministry?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesPriority = !filterPriority || item.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Tracked", value: items.length, color: "bg-white", icon: Tag, iconColor: "text-gray-400" },
          { label: "Pending Response", value: items.filter(i => i.status !== "RESOLVED").length, color: "bg-indigo-50", icon: Clock, iconColor: "text-indigo-600" },
          { label: "Overdue", value: items.filter(i => i.expectedResponseDate && isBefore(new Date(i.expectedResponseDate), new Date()) && i.status !== "RESOLVED").length, color: "bg-rose-50", icon: AlertCircle, iconColor: "text-rose-600" },
          { label: "Responded", value: items.filter(i => i.status === "RESOLVED").length, color: "bg-emerald-50", icon: CheckCircle2, iconColor: "text-emerald-600" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={cn("border border-gray-100 shadow-sm rounded-xl overflow-hidden", stat.color)}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  </div>
                  <div className={cn("p-2 rounded-lg bg-white shadow-sm border border-gray-50", stat.iconColor)}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Tracker Table */}
      <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardHeader className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Parliamentary Tracker</CardTitle>
              <CardDescription className="text-gray-500 text-sm mt-0.5">Real-time status of letters and questions.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search..." 
                  className="pl-9 h-10 w-[240px] rounded-lg bg-gray-50 border-gray-200 focus-visible:ring-indigo-600 focus-visible:ring-1 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg border-gray-200 p-0">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-transparent">
                <TableHead className="w-[120px] pl-6 py-3 text-xs font-semibold text-gray-500">Ref No.</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-500">Subject & Ministry</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-500 text-center">Timeline</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-500 text-center">Status</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-500 text-center">Priority</TableHead>
                <TableHead className="pr-6 py-3 text-right text-xs font-semibold text-gray-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Loading entries...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center">
                          <Search className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No matching entries found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item, index) => {
                    const status = getStatus(item);
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow 
                        key={item.id} 
                        className="group border-gray-50 hover:bg-indigo-50/30 transition-colors"
                      >
                        <TableCell className="pl-6 py-4">
                          <code className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                            {item.referenceNo || "N/A"}
                          </code>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {item.subject}
                              </span>
                              <Badge variant="outline" className={cn(
                                "text-[10px] font-bold px-1.5 py-0 h-4 border-none",
                                item.type === "LETTER" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                              )}>
                                {item.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Building2 className="w-3.5 h-3.5" />
                              <span className="text-xs">{item.ministry}</span>
                              {item.documentUrl && (
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-emerald-100 text-emerald-700 border-none font-bold ml-1">
                                  DOC
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center justify-center gap-3">
                            <div className="text-center">
                              <p className="text-[10px] font-medium text-gray-400 uppercase">Sent</p>
                              <p className="text-xs font-semibold text-gray-600">{format(new Date(item.dateRaised), "MMM dd")}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                            <div className="text-center">
                              <p className="text-[10px] font-medium text-gray-400 uppercase">Due</p>
                              <p className={cn(
                                "text-xs font-bold",
                                item.expectedResponseDate && isBefore(new Date(item.expectedResponseDate), new Date()) ? "text-rose-600" : "text-indigo-600"
                              )}>
                                {item.expectedResponseDate ? format(new Date(item.expectedResponseDate), "MMM dd") : "TBD"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex justify-center">
                            <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-transparent", status.color)}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span className="text-xs font-semibold">{status.label}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex justify-center">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "rounded-full px-2.5 py-0.5 font-bold text-[10px]",
                                item.priority === 'HIGH' ? "text-rose-600 border-rose-100 bg-rose-50" :
                                item.priority === 'MEDIUM' ? "text-amber-600 border-amber-100 bg-amber-50" :
                                "text-emerald-600 border-emerald-100 bg-emerald-50"
                              )}
                            >
                              {item.priority}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:text-indigo-600 shadow-none border-none">
                                <MoreHorizontal className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-2xl border-gray-100 shadow-xl p-2">
                              <DropdownMenuItem 
                                className="h-12 rounded-xl focus:bg-indigo-50 cursor-pointer gap-3 font-bold text-gray-700"
                                onClick={() => item.documentUrl && window.open(item.documentUrl, '_blank')}
                                disabled={!item.documentUrl}
                              >
                                <FileSearch className={cn("w-4 h-4", item.documentUrl ? "text-indigo-600" : "text-gray-300")} /> View Document
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="h-12 rounded-xl focus:bg-indigo-50 cursor-pointer gap-3 font-bold text-gray-700"
                                onClick={() => setSelectedViewItem(item)}
                              >
                                <Eye className="w-4 h-4 text-gray-400" /> View Details
                              </DropdownMenuItem>
                              {isStaff && (
                                <>
                                  <DropdownMenuItem className="h-12 rounded-xl focus:bg-indigo-50 cursor-pointer gap-3 font-bold text-gray-700">
                                    <Edit2 className="w-4 h-4 text-gray-400" /> Edit Entry
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-gray-50 my-2" />
                                  <DropdownMenuItem className="h-12 rounded-xl focus:bg-rose-50 cursor-pointer gap-3 font-bold text-rose-600">
                                    <AlertCircle className="w-4 h-4" /> Mark Overdue
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Legend / Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-600" />
            <span className="text-xs text-gray-500 font-medium">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-600" />
            <span className="text-xs text-gray-500 font-medium">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-xs text-gray-500 font-medium">Responded</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-indigo-600 font-semibold transition-all">
          Sync Ministry Data
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedViewItem} onOpenChange={(open) => !open && setSelectedViewItem(null)}>
        <DialogContent className="max-w-xl bg-white p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          {selectedViewItem && (
            <>
              <div className="bg-indigo-50/50 p-6 border-b border-indigo-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className={cn(
                      "font-bold px-2 py-0.5 border-none",
                      selectedViewItem.type === "LETTER" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    )}>
                      {selectedViewItem.type}
                    </Badge>
                    <Badge variant="outline" className={cn(
                      "rounded-full px-2.5 py-0.5 font-bold text-[10px]",
                      selectedViewItem.priority === 'HIGH' ? "text-rose-600 border-rose-100 bg-rose-50" :
                      selectedViewItem.priority === 'MEDIUM' ? "text-amber-600 border-amber-100 bg-amber-50" :
                      "text-emerald-600 border-emerald-100 bg-emerald-50"
                    )}>
                      {selectedViewItem.priority} Priority
                    </Badge>
                    <span className="text-xs font-semibold text-gray-500">
                      Ref: {selectedViewItem.referenceNo || "N/A"}
                    </span>
                  </div>
                  <DialogTitle className="text-xl font-bold text-gray-900 leading-tight">
                    {selectedViewItem.subject}
                  </DialogTitle>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1">Ministry</h4>
                      <p className="font-semibold text-gray-800 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        {selectedViewItem.ministry || "Not Specified"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1">Date Sent / Raised</h4>
                      <p className="font-semibold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        {selectedViewItem.dateRaised ? format(new Date(selectedViewItem.dateRaised), "PPP") : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1">Status</h4>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const status = getStatus(selectedViewItem);
                          const StatusIcon = status.icon;
                          return (
                            <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-transparent", status.color)}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span className="text-xs font-semibold">{status.label}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1">Expected Response</h4>
                      <p className={cn("font-semibold flex items-center gap-2", 
                        selectedViewItem.expectedResponseDate && isBefore(new Date(selectedViewItem.expectedResponseDate), new Date()) && selectedViewItem.status !== "RESOLVED"
                          ? "text-rose-600" 
                          : "text-gray-800"
                      )}>
                        <Clock className="w-4 h-4 text-current" />
                        {selectedViewItem.expectedResponseDate ? format(new Date(selectedViewItem.expectedResponseDate), "PPP") : "TBD"}
                      </p>
                    </div>
                  </div>
                </div>
                
                {selectedViewItem.documentUrl && (
                  <div className="mt-8 border-t border-gray-100 pt-6">
                    <Button 
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold h-12 rounded-xl"
                      onClick={() => window.open(selectedViewItem.documentUrl!, '_blank')}
                    >
                      <FileSearch className="w-5 h-5 mr-2" />
                      View Uploaded Document
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
