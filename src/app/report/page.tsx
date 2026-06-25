import React from "react";
import ReportProblemForm from "@/components/citizen/ReportProblemForm";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <LandingHeader />
      
      <main className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Report a Problem
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Direct access to your MP's office. Tell us what's wrong, and we'll work to fix it. No account required.
          </p>
        </div>

        <ReportProblemForm />
      </main>

      <LandingFooter />
    </div>
  );
}
