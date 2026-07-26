import { Link, useRouterState } from "@tanstack/react-router";
import {
  Megaphone,
  CreditCard,
  Sparkles,
  CircleCheck,
  ScanLine,
  Dumbbell,
  MessageCircle,
  ArrowUpRight,
  RefreshCw,
  ShieldCheck,
  Users,
  Terminal,
  Home,
  User,
  QrCode,
  ClipboardCheck,
  TriangleAlert,
  Activity,
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

type Item = { title: string; url: string; icon: typeof Home };

const journey: Item[] = [
  { title: "Demo home", url: "/", icon: Home },
  { title: "Launch campaign", url: "/campaign", icon: Megaphone },
  { title: "Member purchase", url: "/pay", icon: CreditCard },
  { title: "Trainer match", url: "/match", icon: Sparkles },
  { title: "Trainer acceptance", url: "/opportunity", icon: CircleCheck },
  { title: "Session journey", url: "/journey/alex", icon: Dumbbell },
  { title: "Progress review", url: "/review", icon: ArrowUpRight },
  { title: "Ongoing coaching", url: "/ongoing", icon: RefreshCw },
];

const manager: Item[] = [
  { title: "Impact overview", url: "/dashboard", icon: Activity },
  { title: "Trainer capacity", url: "/trainer-capacity", icon: Users },
  { title: "Session exceptions", url: "/exceptions", icon: TriangleAlert },
];

const trainer: Item[] = [
  { title: "Trainer home", url: "/trainer", icon: ShieldCheck },
  { title: "Scan client QR", url: "/scan", icon: ScanLine },
  { title: "Complete session", url: "/complete-session", icon: ClipboardCheck },
];

const member: Item[] = [
  { title: "Client home", url: "/me", icon: User },
  { title: "Check-in QR", url: "/checkin", icon: QrCode },
  { title: "Session feedback", url: "/confirm-session/demo", icon: MessageCircle },
];

const technical: Item[] = [
  { title: "Pinch integration console", url: "/demo-console", icon: Terminal },
];

export function FlowSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) =>
    path === "/"
      ? currentPath === "/"
      : currentPath === path || currentPath.startsWith(path + "/");

  const group = (label: string, items: Item[]) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel className="text-[11px] font-medium text-muted-foreground">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link
                    to={item.url}
                    className={`relative flex items-center gap-2.5 rounded-lg text-sm transition-colors duration-200 ${
                      active
                        ? "bg-accent/60 font-medium text-primary"
                        : "text-sidebar-foreground hover:bg-white/5"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
                    )}
                    <item.icon className="size-4" strokeWidth={1.75} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {!collapsed && (
          <div className="px-2 py-2">
            <div className="text-sm font-semibold tracking-tight">VezaPT Pay</div>
            <div className="text-xs text-muted-foreground">
              Coaching journey · payments by Pinch
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="gap-1">
        {group("Journey", journey)}
        {group("Manager", manager)}
        {group("Trainer", trainer)}
        {group("Member", member)}
        {group("Technical", technical)}
      </SidebarContent>
    </Sidebar>
  );
}
