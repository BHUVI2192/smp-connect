"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, ShieldCheck, Zap } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden min-h-[90vh] flex items-center">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-200/40 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-100/50 rounded-full blur-[100px] -z-10 -translate-x-1/4 translate-y-1/4" />

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-sm mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              Digital Bridge to Your Representative
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-8xl leading-[1.1] mb-8 text-gray-900"
            >
              Direct Connect <br />
              <span className="text-orange-600 italic">Redefined.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 max-w-xl leading-relaxed"
            >
              Submit your queries, report local issues, and track resolutions in real-time. MP Connect is your official portal for direct communication with your Member of Parliament.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center lg:justify-start gap-4"
            >
              <Link href="#report-section">
                <Button size="lg" className="h-16 px-8 text-lg bg-orange-600 hover:bg-orange-700 shadow-2xl shadow-orange-500/40 rounded-2xl group">
                  Report an Issue
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#track-section">
                <Button size="lg" variant="outline" className="h-16 px-8 text-lg border-2 rounded-2xl group">
                  Track Complaint
                  <ChevronRight className="ml-2 group-hover:rotate-90 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-60"
            >
              <div>
                <p className="text-2xl text-gray-900">1.2K+</p>
                <p className="text-sm text-gray-500">Issues Resolved</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-2xl text-gray-900">24/7</p>
                <p className="text-sm text-gray-500">Citizen Support</p>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 50, rotate: 5 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ type: "spring", damping: 15, delay: 0.4 }}
            className="flex-1 relative"
          >
            {/* Main Visual Image Container */}
            <div className="relative z-10 w-full aspect-square max-w-[500px] mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-400 to-amber-300 rounded-[60px] blur-[20px] opacity-20 transform translate-y-4" />
              <div className="relative h-full w-full rounded-[60px] overflow-hidden border-8 border-white shadow-2xl">
                <Image 
                   src="/by.png" 
                   alt="MP Connect Platform" 
                   fill 
                   sizes="(max-width: 768px) 100vw, 500px"
                   className="object-contain bg-white" 
                   unoptimized
                   priority
                />
              </div>
              
              {/* Floating UI Elements */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-10 -right-10 bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-orange-100 z-20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheck className="text-green-600 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 tracking-tight">Verified</p>
                    <p className="text-[10px] text-gray-500 uppercase">Government Portal</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -bottom-10 -left-10 bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-orange-100 z-20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Zap className="text-orange-600 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 tracking-tight">Fast Resolution</p>
                    <p className="text-[10px] text-gray-500 uppercase">Priority Status</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
