"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Landmark, ArrowLeft } from "lucide-react";
import ParliamentEntryForm from "@/components/parliament/ParliamentEntryForm";
import ParliamentTracker from "@/components/parliament/ParliamentTracker";
import { motion, AnimatePresence } from "framer-motion";

export default function PAParliamentPage() {
  const [view, setView] = useState<"tracker" | "entry">("tracker");

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AnimatePresence mode="wait">
        {view === "tracker" ? (
          <motion.div
            key="tracker"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Landmark className="w-8 h-8 text-indigo-600" />
                  Parliamentary Hub
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Manage and track parliamentary letters and questions.
                </p>
              </div>
              <Button 
                onClick={() => setView("entry")} 
                size="lg" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm rounded-lg transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Entry
              </Button>
            </div>

            <ParliamentTracker />
          </motion.div>
        ) : (
          <motion.div
            key="entry"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-6">
              <button 
                onClick={() => setView("tracker")}
                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium text-sm transition-all group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Tracker
              </button>
            </div>
            
            <ParliamentEntryForm 
              onSuccess={() => setView("tracker")}
              onCancel={() => setView("tracker")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
