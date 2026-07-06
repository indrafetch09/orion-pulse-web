import { useState, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  Activity,
  LayoutDashboard,
  Network,
  ScrollText,
  Brain,
  Settings,
  Menu,
  Bell,
  LogOut,
  ChevronLeft,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Ports", icon: Network, path: "/dashboard/ports" },
  { label: "Logs", icon: ScrollText, path: "/dashboard/logs" },
  { label: "AI Insights", icon: Brain, path: "/dashboard/ai-insights" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  const item = navItems.find((n) => n.path === pathname);
  return item?.label ?? "Orionpulse";
}

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { isConnected } = useSocket();

  return (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Activity className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-lg font-bold tracking-tight text-foreground whitespace-nowrap">
              Orionpulse
            </span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
          </div>
        )}
      </div>

      <Separator className="mx-4 w-auto" />

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.path === "/dashboard"
              ? location.pathname === "/dashboard" ||
                location.pathname === "/dashboard/"
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border-l-2  bg-muted text-foreground "
                  : "border-l-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {!collapsed && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: Connection status */}
      <div className="px-4 pb-4">
        <Separator className="mb-4" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isConnected
                ? "bg-success shadow-[0_0_6px] shadow-success/50"
                : "bg-destructive shadow-[0_0_6px] shadow-destructive/50",
            )}
          />
          {!collapsed && (
            <span>{isConnected ? "Socket Connected" : "Disconnected"}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { alerts } = useSocket();

  const pageTitle = useMemo(
    () => getPageTitle(location.pathname),
    [location.pathname],
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userInitials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "OP";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col glass border-r border-border transition-all duration-300 ease-in-out shrink-0",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} side="left">
        <div className="pt-12">
          <SidebarContent
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="relative z-50 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Desktop collapse toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft
                className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  collapsed && "rotate-180",
                )}
              />
            </Button>

            <h1 className="text-lg font-semibold text-foreground">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Bell className="h-5 w-5" />
                {alerts.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {alerts.length > 9 ? "9+" : alerts.length}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {alerts.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  alerts.slice(0, 5).map((alert, i) => (
                    <DropdownMenuItem
                      key={i}
                      className="flex-col items-start gap-1"
                    >
                      <span className="text-xs font-medium">{alert.type}</span>
                      <span className="text-xs text-muted-foreground">
                        {alert.message}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {user?.username ?? "User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email ?? ""}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <User className="h-4 w-4" />
                  Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
