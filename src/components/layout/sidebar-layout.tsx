"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard, CalendarDays, BookOpen, Building2, Send, Navigation, Mail,
  Gift, Image as ImageIcon, Mic, Landmark, Train, MapPin, BarChart3, MessageSquare,
  Calendar, Users, Upload, Menu, X, Bell, Search, LogOut, ChevronLeft,
} from "lucide-react";
import type { NavItem, UserSession } from "@/types";
import { GlobalSearch } from "@/components/shared/global-search";
import { NotificationPanel } from "@/components/shared/notification-panel";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, CalendarDays, BookOpen, Building2, Send, Navigation, Mail,
  Gift, Image: ImageIcon, Mic, Landmark, Train, MapPin, BarChart3, MessageSquare,
  Calendar, Users, Upload,
};

interface SidebarLayoutProps {
  children: React.ReactNode;
  user: UserSession;
  navItems: NavItem[];
}

export function SidebarLayout({ children, user, navItems }: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const roleColors: Record<string, string> = {
    MP: "bg-mp",
    PA: "bg-pa",
    STAFF: "bg-staff",
  };

  const roleLightColors: Record<string, string> = {
    MP: "bg-mp-light text-mp",
    PA: "bg-pa-light text-pa",
    STAFF: "bg-staff-light text-staff",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link href={`/${user.role.toLowerCase()}`} className="flex items-center gap-3">
            <div className="relative h-10 w-10 flex-shrink-0 rounded-full overflow-hidden border bg-white">
              <Image src="/logo.png" alt="MP Connect Logo" fill sizes="40px" className="object-contain p-1" priority />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-none">MP CONNECT</h1>
              <p className="text-[10px] text-gray-500 mt-1">Constituency Management</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3">
          <div className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", roleLightColors[user.role])}>
            {user.role === "MP" ? "Member of Parliament" : user.role === "PA" ? "Personal Assistant" : "Office Staff"}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1 py-2">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? cn("text-white", roleColors[user.role])
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                  {item.badge ? (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User section */}
        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-gray-100 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={cn("text-white text-xs", roleColors[user.role])}>
                    {user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action="/api/auth/signout" method="POST">
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b bg-white px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1 max-w-xl">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-2">
            <NotificationPanel userId={user.id} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
