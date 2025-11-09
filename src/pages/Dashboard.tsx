import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, TrendingUp, TrendingDown, PiggyBank, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  // Mock data - will be replaced with actual data
  const totalIncome = 45000;
  const totalExpenses = 28500;
  const totalSavings = 12000;
  const balance = totalIncome - totalExpenses;

  const recentTransactions = [
    { id: 1, type: "expense", category: "Food", amount: 450, date: "2025-01-15", description: "Grocery shopping" },
    { id: 2, type: "income", category: "Salary", amount: 45000, date: "2025-01-10", description: "Monthly salary" },
    { id: 3, type: "expense", category: "Transport", amount: 200, date: "2025-01-12", description: "Uber rides" },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Budget Manager</h1>
            <p className="text-muted-foreground mt-1">Track your finances with ease</p>
          </div>
          <Link to="/add-transaction">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </Link>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Balance</p>
                <h3 className="text-2xl font-bold">₹{balance.toLocaleString()}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-income to-income/80 text-income-foreground border-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Income</p>
                <h3 className="text-2xl font-bold">₹{totalIncome.toLocaleString()}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-expense to-expense/80 text-expense-foreground border-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Expenses</p>
                <h3 className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-savings to-savings/80 text-savings-foreground border-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
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

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recent Transactions</h2>
            <Link to="/transactions">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>
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
                    <p className="font-semibold">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">{transaction.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      transaction.type === "income" ? "text-income" : "text-expense"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{transaction.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
