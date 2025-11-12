import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { Home, Receipt, PiggyBank, BarChart3, Settings, Wallet, DollarSign, Calendar, Bell, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const Layout = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchUsername();
    }
  }, [user]);

  const fetchUsername = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      setUsername(data?.username || "User");
    } catch (error) {
      console.error("Error fetching username:", error);
      setUsername("User");
    }
  };

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
    { path: "/notifications", icon: Bell, label: "Notifications" },
  ];

  const mobileNavItems = navItems.filter(item => 
    !["/settings", "/calendar"].includes(item.path)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header with Username */}
      <div className="fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-b border-border z-50 px-4 py-1.5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-base md:text-lg font-semibold text-foreground">Hello, {username}</h1>
        </div>
      </div>
      
      <nav className="fixed bottom-0 left-0 right-0 md:top-12 md:bottom-auto bg-card border-t md:border-b md:border-t-0 border-border z-40 safe-area-inset-bottom">
        <div className="max-w-7xl mx-auto px-2 md:px-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:justify-start md:gap-6 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Mobile Navigation - Horizontal Scroll */}
          <div className="md:hidden overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 py-2 px-1 min-w-max">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[72px]",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
      <main className="pb-20 pt-14 md:pb-0 md:pt-20">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
