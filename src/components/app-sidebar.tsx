import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Palette, Terminal, MessageSquare, Settings, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
const NAV_ITEMS = [
  { name: "Dashboard", icon: Home, path: "/" },
  { name: "Agent Atelier", icon: Palette, path: "/atelier" },
  { name: "Command Deck", icon: MessageSquare, path: "/deck" },
  { name: "Skill Forge", icon: Terminal, path: "/forge" },
];
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  return (
    <Sidebar className="border-r-0 bg-background/50 backdrop-blur-xl">
      <SidebarHeader className="py-6 px-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <span className="block text-lg font-serif font-bold leading-none">Aether</span>
            <span className="text-2xs text-muted-foreground font-medium uppercase tracking-widest">Command</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2 px-2">
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname === item.path}
                  className={cn(
                    "h-11 px-4 transition-all duration-200",
                    location.pathname === item.path 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md translate-x-1" 
                      : "hover:bg-accent/50"
                  )}
                >
                  <Link to={item.path}>
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="rounded-xl border border-dashed border-primary/30 p-4 bg-primary/5">
          <p className="text-2xs font-bold text-primary uppercase mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium opacity-70">Aether Link Active</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}