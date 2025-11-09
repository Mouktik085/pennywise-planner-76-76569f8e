import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Receipt, PiggyBank, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/transactions", icon: Receipt, label: "Transactions" },
    { path: "/savings", icon: PiggyBank, label: "Savings" },
    { path: "/statistics", icon: BarChart3, label: "Statistics" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-card border-t md:border-b md:border-t-0 border-border z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around md:justify-start md:gap-8 py-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs md:text-sm font-medium">{item.label}</span>
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
