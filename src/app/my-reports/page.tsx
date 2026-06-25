"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCitizenReports } from "@/hooks/use-citizen-reports";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import { MessageSquare, RefreshCw, ChevronRight, LayoutDashboard, Clock } from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import Link from "next/link";

export default function MyReportsPage() {
  const { reports, removeReport } = useCitizenReports();
  const [reportDetails, setReportDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync with actual database to get real-time status
  const refreshStatus = async () => {
    if (reports.length === 0) return;
    setLoading(true);
    try {
      // In a real app, I'd have a bulk status API. 
      // For now, we'll fetch them individually or use a query.
      const promises = reports.map(r => 
        fetch(`/api/complaints/guest/${r.id}`).then(res => res.ok ? res.json() : null)
      );
      const results = await Promise.all(promises);
      setReportDetails(results.filter(Boolean));
    } catch (err) {
      console.error("Failed to refresh status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, [reports]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <LandingHeader />
      
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
              <p className="text-gray-500 mt-1">Status of problems you've reported.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshStatus} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/report">
                <Button size="sm">Report New</Button>
              </Link>
            </div>
          </div>

          {reports.length === 0 ? (
            <Card className="border-none shadow-none bg-transparent">
              <CardContent className="p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">No reports found</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  You haven't submitted any problems from this device yet.
                </p>
                <Link href="/report">
                  <Button className="mt-4">Submit Your First Report</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => {
                const liveData = reportDetails.find(d => d.id === report.id);
                const status = liveData?.status || report.status;
                
                return (
                  <Card key={report.id} className="overflow-hidden hover:shadow-md transition-shadow group border-none shadow-sm">
                    <CardContent className="p-0">
                      <div className="flex items-center p-6 gap-4">
                        <div className="hidden sm:flex w-12 h-12 rounded-xl bg-blue-50 text-blue-600 items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{formatDate(report.createdAt)}</p>
                            <StatusBadge status={status} />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 truncate">{report.subject}</h3>
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-sm text-gray-500 flex items-center">
                              ID: <span className="font-mono text-xs ml-1 bg-gray-100 px-1.5 py-0.5 rounded">{report.id.slice(0, 8)}...</span>
                            </p>
                            {liveData?.category && (
                              <p className="text-sm text-gray-500">
                                Category: <span className="font-medium text-gray-800">{liveData.category}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex gap-4 items-start">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">Private Tracking</h4>
              <p className="text-sm text-amber-800 mt-1 opacity-80">
                These reports are stored locally on your device for your privacy. If you clear your browser data, you'll need the Report ID to track your status again.
              </p>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
