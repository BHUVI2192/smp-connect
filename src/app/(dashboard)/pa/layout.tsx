import { requireAuth } from "@/lib/auth";
import { roleConfig } from "@/lib/role-config";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

export default async function PALayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth(["PA"]);

  return (
    <SidebarLayout user={session} navItems={roleConfig.PA.navItems}>
      {children}
    </SidebarLayout>
  );
}
