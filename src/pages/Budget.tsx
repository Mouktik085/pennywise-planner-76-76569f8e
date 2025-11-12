import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingDown, Wallet, PiggyBank, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Link } from "react-router-dom";

interface Budget {
  id?: string;
  monthly_limit: number;
  current_spent: number;
  month: number;
  year: number;
}

interface CategoryExpense {
  name: string;
  value: number;
  fill: string;
}

const Budget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [savingsTarget, setSavingsTarget] = useState("");
  const [loading, setLoading] = useState(true);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);

  const chartColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  useEffect(() => {
    if (user) {
      fetchBudget();
      fetchCategoryExpenses();
    }
  }, [user]);

  const fetchBudget = async () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    try {
      const { data, error } = await supabase
        .from("budget")
        .select("*")
        .eq("user_id", user?.id)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setBudget(data);
        setMonthlyLimit(data.monthly_limit.toString());
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryExpenses = async () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = new Date(currentYear, currentMonth, 0);
    const endDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("category, amount")
        .eq("user_id", user?.id)
        .eq("type", "expense")
        .gte("date", startDate)
        .lte("date", endDateStr);

      if (error) throw error;

      const expensesByCategory = (data || []).reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount.toString());
        return acc;
      }, {});

      const categoryData = Object.entries(expensesByCategory)
        .map(([name, value], index) => ({
          name,
          value: value as number,
          fill: chartColors[index % chartColors.length],
        }))
        .sort((a, b) => b.value - a.value);

      setCategoryExpenses(categoryData);
    } catch (error: any) {
      console.error("Error fetching category expenses:", error);
    }
  };

  const calculateCurrentSpent = async () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = new Date(currentYear, currentMonth, 0);
    const endDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user?.id)
      .eq("type", "expense")
      .gte("date", startDate)
      .lte("date", endDateStr);

    if (error) throw error;
    return data?.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!monthlyLimit || parseFloat(monthlyLimit) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid monthly limit",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const currentSpent = await calculateCurrentSpent();

      if (budget) {
        const { error } = await supabase
          .from("budget")
          .update({ 
            monthly_limit: parseFloat(monthlyLimit),
            current_spent: currentSpent 
          })
          .eq("id", budget.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("budget")
          .insert([{
            user_id: user?.id,
            monthly_limit: parseFloat(monthlyLimit),
            current_spent: currentSpent,
            month: currentMonth,
            year: currentYear,
          }]);

        if (error) throw error;
      }

      toast({ title: "Success", description: "Budget updated successfully" });
      fetchBudget();
      fetchCategoryExpenses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const percentage = budget && budget.monthly_limit > 0
    ? (budget.current_spent / budget.monthly_limit) * 100
    : 0;

  const remaining = budget ? budget.monthly_limit - budget.current_spent : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monthly Budget</h1>
          <p className="text-muted-foreground">Set and track your spending limits</p>
        </div>
        <Link to="/budget/allocation">
          <Button className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Category Allocation
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Limit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{budget?.monthly_limit.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Monthly spending limit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{budget?.current_spent.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Total expenses this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{((budget?.monthly_limit || 0) - (budget?.current_spent || 0)).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Available to spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Target</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{savingsTarget || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Monthly savings goal</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Set Monthly Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthly-limit">Monthly Budget Limit (₹)</Label>
              <Input
                id="monthly-limit"
                type="number"
                step="0.01"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="Enter your monthly budget"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="savings-target">Monthly Savings Target (₹)</Label>
              <Input
                id="savings-target"
                type="number"
                step="0.01"
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(e.target.value)}
                placeholder="How much do you want to save monthly?"
              />
            </div>
            <Button type="submit" className="w-full">
              {budget ? "Update Budget" : "Set Budget"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {budget && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Spending Progress</span>
                <span>{percentage.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(percentage, 100)} />
              <p className="text-sm text-muted-foreground">
                {percentage > 100
                  ? `You've exceeded your budget by ₹${Math.abs(remaining).toFixed(2)}`
                  : percentage > 80
                  ? `⚠️ Warning: You're close to your budget limit!`
                  : `You have ₹${remaining.toFixed(2)} remaining this month`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {categoryExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={categoryExpenses} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ₹${entry.value.toFixed(0)}`}
                >
                  {categoryExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {categoryExpenses.map((category) => {
                const total = categoryExpenses.reduce((sum, c) => sum + c.value, 0);
                const percentage = (category.value / total) * 100;
                return (
                  <div key={category.name} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-muted-foreground">₹{category.value.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Budget;
