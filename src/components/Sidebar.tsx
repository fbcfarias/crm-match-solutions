import { NavLink, useLocation } from "react-router-dom";
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
import { useUserRole } from "@/hooks/useUserRole";
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

export function Sidebar() {
  const { signOut, user } = useAuth();
  const { role, isAdmin } = useUserRole();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const menuItems = [
    { 
      title: "Dashboard", 
      url: isAdmin ? "/admin/dashboard" : "/dashboard", 
      icon: LayoutDashboard,
      showFor: ["admin", "vendedor"]
    },
    { 
      title: "CRM - Leads", 
      url: "/crm", 
      icon: Users,
      showFor: ["vendedor"]
    },
    { 
      title: "Campanhas", 
      url: "/campanhas", 
      icon: Send,
      showFor: ["admin"]
    },
    { 
      title: "Chat", 
      url: "/chat", 
      icon: MessageSquare,
      showFor: ["vendedor"]
    },
    { 
      title: "Analytics", 
      url: "/analytics", 
      icon: BarChart3,
      showFor: ["admin", "vendedor"]
    },
  ];

  const visibleMenuItems = menuItems.filter(item => 
    role && item.showFor.includes(role)
  );

  const roleLabel = isAdmin ? "Administrador" : "Vendedor";

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
              {visibleMenuItems.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="text-sidebar-foreground hover:!bg-transparent hover:!text-inherit data-[active=true]:!bg-primary data-[active=true]:!text-primary-foreground"
                    >
                      <NavLink to={item.url} end className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
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