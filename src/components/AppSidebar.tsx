import { Home, Building2, Users, DollarSign, Receipt, Settings, CreditCard, Bell, Calculator, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const adminMenuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Properties", url: "/properties", icon: Building2 },
  { title: "Tenants", url: "/tenants", icon: Users },
  { title: "Rent Management", url: "/rent", icon: DollarSign },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminPaymentItems = [
  { title: "Payment Management", url: "/admin/payments", icon: CreditCard },
  { title: "Notifications", url: "/admin/notifications", icon: Bell },
  { title: "Tax Accountability", url: "/admin/tax", icon: Calculator },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { userRole, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-6">
          {open ? (
            <h1 className="text-xl font-bold text-sidebar-foreground">YoRent</h1>
          ) : (
            <Building2 className="h-6 w-6 text-sidebar-foreground" />
          )}
        </div>

        {userRole === 'admin' && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/70">
                Main Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent"
                          activeClassName="bg-sidebar-accent font-medium"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/70">
                Payment & Tax Management
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminPaymentItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent"
                          activeClassName="bg-sidebar-accent font-medium"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <div className="mt-auto p-4">
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-5 w-5 mr-3" />
            {open && <span>Sign Out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
