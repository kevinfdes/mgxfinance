import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Wallet, CreditCard, LineChart, ArrowRightLeft, Settings, LogOut, Globe } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { title: "Overview", url: "/portal", icon: LayoutDashboard },
  { title: "Accounts", url: "/portal", icon: Wallet, hash: "accounts" },
  { title: "Cards", url: "/portal", icon: CreditCard, hash: "cards" },
  { title: "Investments", url: "/portal", icon: LineChart, hash: "investments" },
  { title: "Cash flow", url: "/portal", icon: ArrowRightLeft, hash: "cashflow" },
  { title: "Open Finance", url: "/open-finance", icon: Globe },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link to="/portal" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            $
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            Ledger
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={path === item.url && !item.hash}>
                    <Link
                      to={item.url}
                      hash={item.hash}
                      className="flex items-center gap-2"
                    >
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
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/mfa" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Security</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => supabase.auth.signOut()}>
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}