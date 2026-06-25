import type { RoleConfig } from "@/types";

export const roleConfig: RoleConfig = {
  MP: {
    label: "Member of Parliament",
    color: "text-mp",
    bgColor: "bg-mp",
    navItems: [
      { title: "Dashboard", href: "/mp/dashboard", icon: "LayoutDashboard" },
      { title: "Live Briefing", href: "/mp/briefing", icon: "MapPin" },
      { title: "Tours", href: "/mp/tours", icon: "Navigation" },
      { title: "Development", href: "/mp/development", icon: "Building2" },
      { title: "MPLADS", href: "/mp/mplads", icon: "BarChart3" },
      { title: "Complaints", href: "/mp/complaints", icon: "MessageSquare" },
      { title: "Gallery", href: "/mp/gallery", icon: "Image" },
    ],
  },
  PA: {
    label: "Personal Assistant",
    color: "text-pa",
    bgColor: "bg-pa",
    navItems: [
      { title: "Plan Today", href: "/pa/plan-today", icon: "CalendarDays" },
      { title: "TP", href: "/pa/day-book", icon: "BookOpen" },
      { title: "Complaints", href: "/pa/complaints", icon: "MessageSquare" },
      { title: "Development", href: "/pa/development-works", icon: "Building2" },
      { title: "Dispatch Hub", href: "/pa/dispatch", icon: "Send" },

      { title: "Letters", href: "/pa/letters", icon: "Mail" },
      { title: "Greetings", href: "/pa/greetings", icon: "Gift" },
      { title: "Gallery", href: "/pa/gallery", icon: "Image" },
      { title: "Speeches", href: "/pa/speeches", icon: "Mic" },
      { title: "Parliament", href: "/pa/parliament", icon: "Landmark" },
      { title: "Railway EQ", href: "/pa/railway", icon: "Train" },
    ],
  },
  STAFF: {
    label: "Office Staff",
    color: "text-staff",
    bgColor: "bg-staff",
    navItems: [
      { title: "TP", href: "/staff/events", icon: "Calendar" },
      { title: "Complaints", href: "/staff/complaints", icon: "MessageSquare" },
      { title: "Letters", href: "/staff/letters", icon: "Mail" },
      { title: "MPLADS", href: "/staff/mplads", icon: "BarChart3" },
      { title: "Development", href: "/staff/development-works", icon: "Building2" },
      { title: "Contacts", href: "/staff/contacts", icon: "Users" },
      { title: "Media", href: "/staff/media", icon: "Upload" },
      { title: "Speeches", href: "/staff/speeches", icon: "Mic" },
      { title: "Parliament", href: "/staff/parliament", icon: "Landmark" },
      { title: "Railway EQ", href: "/staff/railway", icon: "Train" },
    ],
  },
  CITIZEN: {
    label: "Citizen",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    navItems: [
      { title: "Dashboard", href: "/citizen/dashboard", icon: "LayoutDashboard" },
      { title: "My Complaints", href: "/citizen/complaints", icon: "MessageSquare" },
      { title: "Submit Issue", href: "/citizen/complaints/new", icon: "PlusCircle" },
    ],
  },
};

export function getRoleHome(role: string): string {
  switch (role) {
    case "MP":
      return "/mp/dashboard";
    case "PA":
      return "/pa/plan-today";
    case "STAFF":
      return "/staff/events";
    case "CITIZEN":
      return "/citizen/dashboard";
    default:
      return "/";
  }
}
