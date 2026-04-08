import * as React from "react";
import {
  IconChartBar,
  IconDashboard,
  IconListDetails,
  IconRefresh,
  IconReport,
  IconShieldLock,
} from "@tabler/icons-react";

import { NavDocuments } from "./nav-documents";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { useAppRouter } from "@/shared/lib/app-router";
import { appEnv } from "@/shared/lib/env";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Beban",
      url: "/beban",
      icon: IconChartBar,
    },
    {
      title: "Gangguan",
      url: "/gangguan",
      icon: IconListDetails,
    },
    {
      title: "Sync",
      url: "/sync",
      icon: IconRefresh,
    },
  ],
  documents: [
    {
      name: "Laporan",
      url: "/laporan",
      icon: IconReport,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { navigate, currentUser } = useAppRouter();
  const displayName = currentUser?.email.split("@")[0] ?? "User";
  const displayEmail = currentUser?.email ?? "Signed out";
  const user = {
    name: displayName,
    email: displayEmail,
    avatar: "/avatars/shadcn.jpg",
  };
  const isAdmin = currentUser?.isAdmin ?? false;
  const navMain = isAdmin
    ? [
        ...data.navMain,
        {
          title: "Admin",
          url: "/admin",
          icon: IconShieldLock,
        },
      ]
    : data.navMain;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              className="data-[slot=sidebar-menu-button]:p-2! h-10"
              onClick={() => navigate("/")}
            >
              <span className="text-xl">⚡️</span>
              <span className="text-base font-semibold">{appEnv.appBrandName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={data.documents} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
