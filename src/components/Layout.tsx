import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { Home, Receipt, PiggyBank, BarChart3, Settings, Wallet, DollarSign, Calendar, Bell, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const Layout = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/accounts", icon: Wallet, label: "Accounts" },
    { path: "/transactions", icon: Receipt, label: "Transactions" },
    { path: "/savings", icon: PiggyBank, label: "Savings" },
    { path: "/budget", icon: DollarSign, label: "Budget" },
    { path: "/transfer", icon: ArrowLeftRight, label: "Transfer" },
    { path: "/statistics", icon: BarChart3, label: "Statistics" },
    { path: "/calendar", icon: Calendar, label: "Calendar" },
    { path: "/notifications", icon: Bell, label: "Notifications" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-card border-t md:border-b md:border-t-0 border-border z-50 safe-area-inset-bottom">
        <div className="max-w-7xl mx-auto px-2 md:px-4">
          <div className="flex justify-around md:justify-start md:gap-8 py-2 md:py-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-colors min-w-0 flex-1 md:flex-none",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-[10px] md:text-sm font-medium truncate w-full text-center">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <main className="pb-20 md:pb-0 md:pt-20">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
