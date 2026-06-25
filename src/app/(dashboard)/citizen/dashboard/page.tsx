"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, PlusCircle, History, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CitizenDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 italic">Citizen Portal</h1>
          <p className="text-gray-500">Welcome back! Here's an overview of your interactions with MP Connect.</p>
        </div>
        <Link href="/citizen/complaints/new">
          <Button className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20 px-6 font-bold">
            <PlusCircle className="mr-2 h-5 w-5" />
            Submit New Issue
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -5 }}>
          <Card className="border-orange-100 shadow-sm bg-gradient-to-br from-white to-orange-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">My Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">0</span>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5 }}>
          <Card className="border-amber-100 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">0</span>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5 }}>
          <Card className="border-green-100 shadow-sm bg-gradient-to-br from-white to-green-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">0</span>
                <div className="p-2 bg-green-100 rounded-lg">
                  <History className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="border-gray-100 shadow-xl shadow-gray-200/50">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Track the progress of your submitted queries and complaints.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No activity yet</p>
            <p className="text-sm text-gray-400 max-w-xs mt-1">
              Start by submitting your first query or complaint to interact with your Member of Parliament.
            </p>
            <Link href="/citizen/complaints/new" className="mt-6">
              <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                Submit an Issue
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
