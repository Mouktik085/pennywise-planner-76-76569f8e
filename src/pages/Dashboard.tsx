import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, TrendingUp, TrendingDown, PiggyBank, Bot, Settings, Calendar as CalendarIconComponent, Repeat } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AIChat } from "@/components/AIChat";
import { CalendarWidget } from "@/components/CalendarWidget";

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [totalAccountBalance, setTotalAccountBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [recurringTransactions, setRecurringTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch transactions
      const { data: transactionsData, error: transError } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(5);

      if (transError) throw transError;

      setTransactions(transactionsData || []);

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

      // Fetch account balances
      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("balance");

      if (accountsError) throw accountsError;

      const totalAccountBalance = accountsData?.reduce((sum, a) => sum + Number(a.balance), 0) || 0;

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
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-cyan-50/20 dark:from-background dark:via-blue-950/10 dark:to-cyan-950/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/settings">
              <Button
                size="icon"
                variant="outline"
                title="Settings"
                className="hover:bg-primary/10"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/calendar">
              <Button
                size="icon"
                variant="outline"
                title="Calendar"
                className="hover:bg-primary/10"
              >
                <CalendarIconComponent className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setShowAIChat(!showAIChat)}
              title="AI Assistant"
              className="hover:bg-primary/10"
            >
              <Bot className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Budget Manager</h1>
              <p className="text-muted-foreground mt-1">Track your finances with ease</p>
            </div>
          </div>
          <Link to="/add-transaction">
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </Link>
        </div>

        {/* Widgets */}
        {showAIChat && <AIChat onClose={() => setShowAIChat(false)} />}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground border-0 shadow-xl shadow-primary/30">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Total Balance</p>
                <h3 className="text-2xl font-bold">₹{totalAccountBalance.toLocaleString()}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-income via-income/90 to-income/70 text-income-foreground border-0 shadow-xl shadow-income/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Income</p>
                <h3 className="text-2xl font-bold">₹{totalIncome.toLocaleString()}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-expense via-expense/90 to-expense/70 text-expense-foreground border-0 shadow-xl shadow-expense/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Expenses</p>
                <h3 className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-savings via-savings/90 to-savings/70 text-savings-foreground border-0 shadow-xl shadow-savings/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <PiggyBank className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Savings</p>
                <h3 className="text-2xl font-bold">₹{totalSavings.toLocaleString()}</h3>
              </div>
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

          <Link to="/savings">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Savings Goals</h3>
              <p className="text-sm text-muted-foreground">Track your savings targets</p>
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
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet. Add your first transaction to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
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
