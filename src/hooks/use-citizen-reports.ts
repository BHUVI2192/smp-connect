import { useState, useEffect } from "react";

export interface CitizenReport {
  id: string;
  referenceNo?: string;
  subject: string;
  createdAt: string;
  status: string;
}

const STORAGE_KEY = "mp_connect_citizen_submissions";

export function useCitizenReports() {
  const [reports, setReports] = useState<CitizenReport[]>([]);

  useEffect(() => {
    // Load from local storage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setReports(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse citizen reports:", err);
      }
    }
  }, []);

  const addReport = (report: CitizenReport) => {
    const updated = [report, ...reports];
    setReports(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const removeReport = (id: string) => {
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { reports, addReport, removeReport };
}
