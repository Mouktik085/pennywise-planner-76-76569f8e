import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Wallet, TrendingDown, Calendar } from "lucide-react";

interface Budget {
  id: string;
  monthly_limit: number;
  current_spent: number;
  month: number;
  year: number;
}

const Budget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (user) {
      fetchBudget();
    }
  }, [user]);

  const fetchBudget = async () => {
    try {
      const { data, error } = await supabase
        .from("budget")
        .select("*")
        .eq("user_id", user?.id)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .single();

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

  const calculateCurrentSpent = async () => {
    const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user?.id)
      .eq("type", "expense")
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) throw error;

    return data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(monthlyLimit);

    if (limit <= 0) {
      toast({
        title: "Invalid amount",
        description: "Budget limit must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentSpent = await calculateCurrentSpent();

      if (budget) {
        const { error } = await supabase
          .from("budget")
          .update({ monthly_limit: limit, current_spent: currentSpent })
          .eq("id", budget.id);

        if (error) throw error;
        toast({ title: "Budget updated successfully" });
      } else {
        const { error } = await supabase
          .from("budget")
          .insert([{
            user_id: user?.id,
            monthly_limit: limit,
            current_spent: currentSpent,
            month: currentMonth,
            year: currentYear,
          }]);

        if (error) throw error;
        toast({ title: "Budget created successfully" });
      }

      fetchBudget();
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
      <div>
        <h1 className="text-3xl font-bold">Monthly Budget</h1>
        <p className="text-muted-foreground">Set and track your spending limits</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Limit</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{budget?.monthly_limit.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-expense">₹{budget?.current_spent.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remaining >= 0 ? 'text-income' : 'text-expense'}`}>
              ₹{remaining.toFixed(2)}
            </div>
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
              <Label>Monthly Limit (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="50000"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {budget ? "Update Budget" : "Create Budget"}
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
    </div>
  );
};

export default Budget;
