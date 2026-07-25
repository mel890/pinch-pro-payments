import { Link, useRouterState } from "@tanstack/react-router";
import {
  Users,
  ShoppingBag,
  Handshake,
  CheckCircle2,
  Star,
  RefreshCw,
  LayoutDashboard,
  Wrench,
  Home,
  Dumbbell,
  User,
  Smartphone,
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
  { title: "Demo home", url: "/", icon: Home },
  { title: "1. Launch campaign", url: "/trainer-capacity", icon: Users },
  { title: "2. Alex buys Kickstart", url: "/pay", icon: ShoppingBag },
  { title: "3. Sarah accepts", url: "/opportunity", icon: Handshake },
  { title: "4. Deliver 3 sessions", url: "/journey/alex", icon: CheckCircle2 },
  { title: "5. Review progress", url: "/review", icon: Star },
  { title: "6. Convert to 2× weekly", url: "/ongoing", icon: RefreshCw },
  { title: "7. Manager impact", url: "/dashboard", icon: LayoutDashboard },
  { title: "8. Pinch console", url: "/demo-console", icon: Wrench },
];

const otherItems = [
  { title: "Member confirmation", url: "/confirm-session/demo", icon: Smartphone },
  { title: "Trainer home", url: "/trainer", icon: Dumbbell },
  { title: "Client home", url: "/me", icon: User },
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
            <div className="text-xs text-muted-foreground">Alex's journey</div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Guided demo</SidebarGroupLabel>
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
