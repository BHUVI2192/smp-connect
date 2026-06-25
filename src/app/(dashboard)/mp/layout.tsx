import { requireAuth } from "@/lib/auth";
import { roleConfig } from "@/lib/role-config";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

export default async function MPLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth(["MP"]);

  return (
    <SidebarLayout user={session} navItems={roleConfig.MP.navItems}>
      {children}
    </SidebarLayout>
  );
}
