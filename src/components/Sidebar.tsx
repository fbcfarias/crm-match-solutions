import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Send, 
  BarChart3, 
  LogOut,
  Building2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "CRM - Leads", url: "/crm", icon: Users },
  { title: "Campanhas", url: "/campanhas", icon: Send },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const { signOut, user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarComponent collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="p-2 bg-primary rounded-lg">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-sm">Match Solutions</h2>
              <p className="text-xs text-muted-foreground">CRM System</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4 space-y-3 border-t border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Vendedor</p>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size={collapsed ? "icon" : "sm"}
            className="w-full"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </SidebarComponent>
  );
}