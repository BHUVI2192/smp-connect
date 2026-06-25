"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Search, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    title: "Instant Complaints",
    description: "Submit your grievances directly to the MP's office with real-time tracking.",
    icon: MessageSquare,
    color: "from-orange-500 to-amber-500"
  },
  {
    title: "Query Resolution",
    description: "Ask questions about local developments and get verified responses.",
    icon: Search,
    color: "from-amber-500 to-yellow-500"
  },
  {
    title: "Secure Access",
    description: "Your data is protected with state-of-the-art encryption and privacy.",
    icon: ShieldCheck,
    color: "from-orange-600 to-red-500"
  },
  {
    title: "Rapid Action",
    description: "Prioritized handling for critical constituency issues.",
    icon: Zap,
    color: "from-yellow-400 to-orange-400"
  }
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl mb-4 text-gray-900"
          >
            Empowering Every <span className="text-orange-600">Citizen</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            We've built a platform that bridges the gap between you and your representatives through technology and transparency.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="relative p-8 rounded-3xl border border-orange-50 bg-gradient-to-b from-white to-orange-50/30 shadow-xl shadow-orange-500/5 overflow-hidden group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform`}>
                <feature.icon className="text-white w-7 h-7" />
              </div>
              <h3 className="text-xl mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              
              <div className="absolute -bottom-1 -right-1 w-24 h-24 bg-orange-100/50 rounded-full blur-3xl group-hover:bg-orange-200/50 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
