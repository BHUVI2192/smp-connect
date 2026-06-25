"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-orange-100"
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-orange-200 bg-white group-hover:border-orange-500 transition-colors shadow-sm">
            <Image src="/logo.png" alt="MP Connect Logo" fill sizes="48px" className="object-contain p-1 group-hover:rotate-12 transition-transform" priority />
          </div>
          <span className="text-2xl bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">MP CONNECT</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="#report-section" className="text-orange-600 font-bold hover:scale-105 transition-transform">Report a Problem</Link>
          <Link href="#track-section" className="hover:text-amber-600 transition-colors">Track Status</Link>
          <Link href="#features" className="hover:text-orange-600 transition-colors">Services</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="#report-section">
            <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-xl shadow-orange-500/20 px-6 rounded-full font-bold">
              Report Now
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
