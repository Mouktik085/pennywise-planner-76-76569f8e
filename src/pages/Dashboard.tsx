import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, Settings as SettingsIcon, Calendar as CalendarIcon, MessageSquare, Repeat, LogOut, Sparkles, Bell } from "lucide-react";
import { AIChat } from "@/components/AIChat";
import { UpcomingReminders } from "@/components/UpcomingReminders";

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  date: string;
  description: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [totalAccountBalance, setTotalAccountBalance] = useState(0);
  const [creditCardLiability, setCreditCardLiability] = useState(0);
  const [currency, setCurrency] = useState("₹");
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [dailyInsight, setDailyInsight] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchDailyInsight();
    }
  }, [user]);

  const fetchDailyInsight = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('daily-insights');
      if (error) throw error;
      setDailyInsight(data.insight);
    } catch (error) {
      console.error('Error fetching insight:', error);
      setDailyInsight("💡 Keep tracking your expenses to build better financial habits!");
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch transactions
      const { data: transactionsData, error: transError } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(5);

      if (transError) throw transError;

      setRecentTransactions(transactionsData || []);

      // Fetch recurring transactions
      const { data: recurringData, error: recurringError } = await supabase
        .from("transactions")
        .select("*")
        .eq("is_recurring", true)
        .order("date", { ascending: false })
        .limit(3);

      if (recurringError) throw recurringError;
      setRecurringTransactions(recurringData || []);

      // Calculate totals
      const { data: allTransactions, error: allTransError } = await supabase
        .from("transactions")
        .select("type, amount");

      if (allTransError) throw allTransError;

      const income = allTransactions
        ?.filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const expenses = allTransactions
        ?.filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setTotalIncome(income);
      setTotalExpenses(expenses);

      // Fetch account balances and credit card liability
      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("balance, is_credit_card, credit_used");

      if (accountsError) throw accountsError;

      const regularAccountBalance = accountsData
        ?.filter(a => !a.is_credit_card)
        .reduce((sum, a) => sum + Number(a.balance), 0) || 0;
      
      const creditLiability = accountsData
        ?.filter(a => a.is_credit_card)
        .reduce((sum, a) => sum + Number(a.credit_used), 0) || 0;
      
      setTotalAccountBalance(regularAccountBalance);
      setCreditCardLiability(creditLiability);
      
      // Fetch user currency preference
      const { data: profileData } = await supabase
        .from("profiles")
        .select("preferred_currency")
        .eq("user_id", user?.id)
        .maybeSingle();
      
      if (profileData?.preferred_currency) {
        const currencySymbols: Record<string, string> = {
          'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥'
        };
        setCurrency(currencySymbols[profileData.preferred_currency] || '₹');
      }

      // Fetch savings
      const { data: savingsData, error: savingsError } = await supabase
        .from("savings_goals")
        .select("current_amount");

      if (savingsError) throw savingsError;

      const savings = savingsData?.reduce((sum, s) => sum + Number(s.current_amount), 0) || 0;
      setTotalSavings(savings);
      setTotalAccountBalance(totalAccountBalance);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-cyan-50/20 dark:from-background dark:via-blue-950/10 dark:to-cyan-950/5 p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header with Notifications */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">Budget Manager</h1>
          <Link to="/notifications">
            <Button variant="outline" size="sm" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/settings">
            <Button variant="outline" size="sm" className="gap-2 bg-card hover:bg-card/80 shadow-md">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </Link>
          <Link to="/calendar">
            <Button variant="outline" size="sm" className="gap-2 bg-card hover:bg-card/80 shadow-md">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAIChat(true)}
            className="gap-2 bg-card hover:bg-card/80 shadow-md"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">AI Chat</span>
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive shadow-md"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
          <Link to="/add-transaction">
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </Link>
        </div>

        {/* Daily AI Insight */}
        {dailyInsight && (
          <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-primary mb-1">Today's Financial Tip</h3>
                  <p className="text-sm text-foreground">{dailyInsight}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Reminders */}
        <UpcomingReminders />

        {/* Widgets */}
        {showAIChat && <AIChat onClose={() => setShowAIChat(false)} />}

        {/* Balance Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <Card className="p-4 md:p-6 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground border-0 shadow-xl shadow-primary/30">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Wallet className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <p className="text-xs md:text-sm opacity-90">Balance</p>
              </div>
              <h3 className="text-lg md:text-2xl font-bold">{currency}{totalAccountBalance.toLocaleString()}</h3>
            </div>
          </Card>

          <Card className="p-4 md:p-6 bg-gradient-to-br from-red-500 via-red-500/90 to-red-500/70 text-white border-0 shadow-xl shadow-red-500/20">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingDown className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <p className="text-xs md:text-sm opacity-90">Credit Card Due</p>
              </div>
              <h3 className="text-lg md:text-2xl font-bold">{currency}{creditCardLiability.toLocaleString()}</h3>
            </div>
          </Card>

          <Card className="p-4 md:p-6 bg-gradient-to-br from-income via-income/90 to-income/70 text-income-foreground border-0 shadow-xl shadow-income/20">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <p className="text-xs md:text-sm opacity-90">Income</p>
              </div>
              <h3 className="text-lg md:text-2xl font-bold">{currency}{totalIncome.toLocaleString()}</h3>
            </div>
          </Card>

          <Card className="p-4 md:p-6 bg-gradient-to-br from-expense via-expense/90 to-expense/70 text-expense-foreground border-0 shadow-xl shadow-expense/20">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingDown className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <p className="text-xs md:text-sm opacity-90">Expenses</p>
              </div>
              <h3 className="text-lg md:text-2xl font-bold">{currency}{totalExpenses.toLocaleString()}</h3>
            </div>
          </Card>

          <Card className="p-4 md:p-6 bg-gradient-to-br from-savings via-savings/90 to-savings/70 text-savings-foreground border-0 shadow-xl shadow-savings/20">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <PiggyBank className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <p className="text-xs md:text-sm opacity-90">Savings</p>
              </div>
              <h3 className="text-lg md:text-2xl font-bold">{currency}{totalSavings.toLocaleString()}</h3>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/transactions">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Transactions</h3>
              <p className="text-sm text-muted-foreground">View all your income and expenses</p>
            </Card>
          </Link>

          <Link to="/budget/allocation">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Budget Allocation</h3>
              <p className="text-sm text-muted-foreground">Set spending percentages by category</p>
            </Card>
          </Link>

          <Link to="/statistics">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Statistics</h3>
              <p className="text-sm text-muted-foreground">View charts and insights</p>
            </Card>
          </Link>
        </div>

        {/* Recurring Transactions */}
        {recurringTransactions.length > 0 && (
          <Card className="p-6 bg-gradient-to-br from-card to-blue-50/20 dark:to-blue-950/10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Repeat className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Recurring Transactions</h2>
              </div>
            </div>
            <div className="space-y-3">
              {recurringTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-muted/80 transition-colors border border-primary/10"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-full ${
                        transaction.type === "income"
                          ? "bg-income-light text-income"
                          : "bg-expense-light text-expense"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{transaction.description || "No description"}</p>
                        <Repeat className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        transaction.type === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}₹{Number(transaction.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recent Transactions</h2>
            <Link to="/transactions">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet. Add your first transaction to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-full ${
                        transaction.type === "income"
                          ? "bg-income-light text-income"
                          : "bg-expense-light text-expense"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{transaction.description || "No description"}</p>
                      <p className="text-sm text-muted-foreground">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        transaction.type === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}₹{Number(transaction.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
