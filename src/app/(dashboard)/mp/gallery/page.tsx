"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/shared/page-helpers";
import { Image as ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function MPGalleryPage() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((d) => setAlbums(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Photo Gallery" description="Browse event photo albums" />
      {albums.length === 0 ? (
        <EmptyState icon={<ImageIcon className="h-12 w-12" />} title="No albums yet" description="Photo albums will appear here once uploaded." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((album) => (
            <Card key={album.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-gray-300" />
                )}
              </div>
              <CardContent className="py-3">
                <h3 className="font-medium text-sm">{album.title}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">{album._count?.photos || 0} photos</span>
                  {album.eventDate && <span className="text-xs text-gray-400">{formatDate(album.eventDate)}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
