"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/shared/page-helpers";
import { Gift, Check, Mail, MessageCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PAGreetingsPage() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/greetings").then((r) => r.json()).then((d) => setReminders(d.data || [])).finally(() => setLoading(false));
  }, []);

  async function markSent(contactId: string, occasion: string) {
    const res = await fetch("/api/greetings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, occasion, sentVia: "manual" }),
    });
    if (res.ok) { toast.success("Greeting logged"); }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Greetings" description="Upcoming birthdays and anniversaries (next 7 days)" />
      {reminders.length === 0 ? (
        <EmptyState icon={<Gift className="h-12 w-12" />} title="No upcoming occasions" description="No birthdays or anniversaries in the next 7 days." />
      ) : (
        <div className="space-y-3">
          {reminders.map((r, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{r.contact.fullName}</h3>
                    <p className="text-sm text-gray-500">{r.occasion} &bull; {r.daysUntil === 0 ? "Today!" : `In ${r.daysUntil} day(s)`}</p>
                    {r.contact.phone && <p className="text-xs text-gray-400">{r.contact.phone}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.daysUntil === 0 ? "destructive" : r.daysUntil <= 2 ? "warning" : "info"}>
                      {r.daysUntil === 0 ? "Today" : `${r.daysUntil}d`}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                      onClick={() => {
                        const text = `Dear ${r.contact.fullName}, wishing you a very happy ${r.occasion}! Best regards, Office of B.Y. Raghavendra.`;
                        if (r.contact.phone) {
                          window.open(`https://wa.me/${r.contact.phone}?text=${encodeURIComponent(text)}`, "_blank");
                          markSent(r.contact.id, r.occasion);
                        } else {
                          toast.error("No phone number available for this contact");
                        }
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                      onClick={() => {
                        const text = `Dear ${r.contact.fullName},\n\nWishing you a very happy ${r.occasion}!\n\nBest regards,\nOffice of B.Y. Raghavendra.`;
                        const subject = `Happy ${r.occasion}!`;
                        if (r.contact.email) {
                          window.open(`mailto:${r.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`, "_blank");
                          markSent(r.contact.id, r.occasion);
                        } else {
                          toast.error("No email available for this contact");
                        }
                      }}
                    >
                      <Mail className="h-4 w-4 mr-1" /> Email
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => markSent(r.contact.id, r.occasion)}>
                      <Check className="h-4 w-4 mr-1" /> Sent
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
