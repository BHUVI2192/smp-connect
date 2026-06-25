import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getRoleHome } from "@/lib/role-config";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFooter } from "@/components/landing/LandingFooter";
import ReportProblemForm from "@/components/citizen/ReportProblemForm";
import TrackStatusSearch from "@/components/citizen/TrackStatusSearch";

export default async function HomePage() {
  const session = await getSession();

  // If user is logged in, redirect to their home portal
  if (session) {
    redirect(getRoleHome(session.role));
  }

  // If not logged in, show the stunning landing page
  return (
    <main className="min-h-screen bg-white selection:bg-orange-100 selection:text-orange-900 scroll-smooth">
      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      
      {/* Visual Divider Section */}
      <section className="py-20 bg-orange-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <h2 className="text-3xl md:text-5xl mb-8 italic">"Direct Connectivity, Real Progress."</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Building a stronger constituency through digital transparency and citizen-led governance.
          </p>
        </div>
      </section>

      {/* Tracking Section */}
      <section id="track-section" className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" />
        <div className="container mx-auto px-4">
          <TrackStatusSearch />
        </div>
      </section>

      {/* Public Submission Portal - At the Bottom */}
      <section id="report-section" className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900">Public Reporting Portal</h2>
            <p className="text-gray-600 text-lg">
              Submit your local issues directly to the MP Office. No login required. 
              Fill the form below to get started.
            </p>
          </div>
          
          <ReportProblemForm />
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
