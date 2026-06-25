import { requireAuth } from "@/lib/auth";
import { roleConfig } from "@/lib/role-config";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth(["STAFF"]);

  return (
    <SidebarLayout user={session} navItems={roleConfig.STAFF.navItems}>
      {children}
    </SidebarLayout>
  );
}
