"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingSpinner, EmptyState, StatCard } from "@/components/shared/page-helpers";
import { StatusBadge } from "@/components/shared/status-badge";
import { MapPin, Navigation, RefreshCw, Building2, Compass } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function MPBriefingPage() {
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  function getLocation() {
    setLoading(true); setError(null);
    if (!navigator.geolocation) { setError("Geolocation not supported"); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { const lat = pos.coords.latitude; const lng = pos.coords.longitude; setCoords({ lat, lng }); fetchNearby(lat, lng); },
      () => { setError("Location access denied. Enable location services."); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function fetchNearby(lat: number, lng: number) {
    try {
      const res = await fetch(`/api/development-works?lat=${lat}&lng=${lng}&radius=10`);
      const data = await res.json();
      setWorks(data.data || []);
    } catch { setError("Failed to fetch nearby works"); } finally { setLoading(false); }
  }

  useEffect(() => { getLocation(); }, []);

  const completedCount = works.filter((w) => w.status === "COMPLETED").length;
  const inProgressCount = works.filter((w) => w.status === "IN_PROGRESS").length;
  const totalBudget = works.reduce((s, w) => s + (w.budget || 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Live Briefing" description="Development works near your location (10km)">
        <Button onClick={getLocation} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </PageHeader>

      {coords && (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <Compass className="h-4 w-4 text-blue-500" />
          <span>Location: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
          <span className="text-gray-300">|</span>
          <span>{works.length} works within 10km</span>
        </div>
      )}

      {error && <Card className="border-orange-200 bg-orange-50"><CardContent className="py-3"><p className="text-sm text-orange-700">{error}</p></CardContent></Card>}

      {works.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Nearby Works" value={works.length} icon={<MapPin className="h-5 w-5 text-blue-600" />} />
          <StatCard title="In Progress" value={inProgressCount} icon={<Building2 className="h-5 w-5 text-amber-600" />} />
          <StatCard title="Completed" value={completedCount} icon={<Building2 className="h-5 w-5 text-green-600" />} />
          <StatCard title="Total Budget" value={formatCurrency(totalBudget)} />
        </div>
      )}

      {loading ? <LoadingSpinner /> : works.length === 0 && !error ? (
        <EmptyState icon={<MapPin className="h-12 w-12" />} title="No works nearby" description="No development works found within 10km." />
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white"><table className="w-full"><thead><tr className="border-b bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider"><th className="text-left py-3 px-4">Project</th><th className="text-left py-3 px-4 hidden md:table-cell">Sector</th><th className="text-left py-3 px-4 hidden lg:table-cell">Budget</th><th className="text-left py-3 px-4">Status</th></tr></thead><tbody>
          {works.map((w) => (
            <tr key={w.id} className="border-b last:border-0 hover:bg-gray-50/50">
              <td className="py-3 px-4"><p className="font-medium text-sm">{w.title}</p>{w.location && <p className="text-xs text-gray-400">{w.location}</p>}</td>
              <td className="py-3 px-4 hidden md:table-cell text-sm text-gray-600">{w.sector}</td>
              <td className="py-3 px-4 hidden lg:table-cell text-sm font-medium">{w.budget ? formatCurrency(w.budget) : "—"}</td>
              <td className="py-3 px-4"><StatusBadge status={w.status} /></td>
            </tr>
          ))}
        </tbody></table></div>
      )}
    </div>
  );
}
