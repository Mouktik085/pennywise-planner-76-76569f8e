import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import { useNotifications } from "./hooks/useNotifications";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AddTransaction from "./pages/AddTransaction";
import Savings from "./pages/Savings";
import Statistics from "./pages/Statistics";
import Budget from "./pages/Budget";
import BudgetAllocation from "./pages/BudgetAllocation";
import FullCalendar from "./pages/FullCalendar";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Install from "./pages/Install";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Accounts from "./pages/Accounts";
import Transfer from "./pages/Transfer";

const queryClient = new QueryClient();

const AppRoutes = () => {
  useTheme();
  useNotifications();
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/install" element={<Install />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/add-transaction" element={<AddTransaction />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/budget/allocation" element={<BudgetAllocation />} />
        <Route path="/calendar" element={<FullCalendar />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/transfer" element={<Transfer />} />
      </Route>
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
