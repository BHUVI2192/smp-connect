"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="bg-gray-50 border-t border-orange-100 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full overflow-hidden border border-orange-200 bg-white shadow-sm">
              <Image src="/logo.png" alt="MP Connect Logo" fill sizes="40px" className="object-contain p-1" />
            </div>
            <span className="text-xl bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">MP CONNECT</span>
          </div>
          
          <div className="flex gap-8 text-sm text-gray-500">
            <Link href="#" className="hover:text-orange-600 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-orange-600 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-orange-600 transition-colors">Contact Support</Link>
          </div>

          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} MP Connect. Digital India Initiative.
          </p>
        </div>
      </div>
    </footer>
  );
}
