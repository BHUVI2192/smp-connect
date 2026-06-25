import type { Role } from "@prisma/client";

export interface UserSession {
  id: string;
  authId: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl: string | null;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchResult {
  id: string;
  type: "contact" | "complaint" | "letter" | "development_work" | "speech";
  title: string;
  subtitle: string;
  link: string;
}

export interface LocationSelection {
  stateId?: number;
  districtId?: number;
  talukId?: number;
  panchayatId?: number;
  villageId?: number;
}

export type RoleConfig = {
  [key in Role]: {
    label: string;
    color: string;
    bgColor: string;
    navItems: NavItem[];
  };
};
