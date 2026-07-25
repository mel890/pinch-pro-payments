import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Rocket,
  ShoppingBag,
  Handshake,
  CheckCircle2,
  Map,
  LayoutDashboard,
  User,
  Dumbbell,
  Wrench,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const flowItems = [
  { title: "Landing", url: "/", icon: Home },
  { title: "1. Trainer capacity", url: "/trainer-capacity", icon: Rocket },
  { title: "2. Member checkout", url: "/pay", icon: ShoppingBag },
  { title: "3. Trainer opportunity", url: "/opportunity", icon: Handshake },
  { title: "4. Session confirmation", url: "/confirm-session/demo", icon: CheckCircle2 },
  { title: "5. Client journey", url: "/journey/alex", icon: Map },
  { title: "6. Manager dashboard", url: "/dashboard", icon: LayoutDashboard },
];

const otherItems = [
  { title: "Trainer home", url: "/trainer", icon: Dumbbell },
  { title: "Client home", url: "/me", icon: User },
  { title: "Demo console", url: "/demo-console", icon: Wrench },
];

export function FlowSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath === path || currentPath.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {!collapsed && (
          <div className="px-2 py-1.5">
            <div className="text-sm font-semibold">VezaPT Pay</div>
            <div className="text-xs text-muted-foreground">Demo flow</div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Flow</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {flowItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Other views</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
