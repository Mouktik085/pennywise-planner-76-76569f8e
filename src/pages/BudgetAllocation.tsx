import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { CurrencyAmount } from "@/components/CurrencyAmount";

interface CategoryBudget {
  id?: string;
  category: string;
  percentage: number;
  allocated_amount: number;
  spent_amount: number;
  icon: string;
}

const defaultCategories = [
  { category: "Food", icon: "🍔" },
  { category: "Transport", icon: "🚗" },
  { category: "Shopping", icon: "🛍️" },
  { category: "Entertainment", icon: "🎬" },
  { category: "Bills", icon: "💡" },
  { category: "Healthcare", icon: "🏥" },
  { category: "Education", icon: "📚" },
  { category: "Other", icon: "📦" },
];

const BudgetAllocation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (user) {
      fetchBudgetData();
    }
  }, [user]);

  const fetchBudgetData = async () => {
    try {
      // Fetch main budget
      const { data: budgetData, error: budgetError } = await supabase
        .from("budget")
        .select("*")
        .eq("user_id", user?.id)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .maybeSingle();

      if (budgetError) throw budgetError;
      
      const totalBudget = budgetData?.monthly_limit || 0;
      setMonthlyBudget(totalBudget);

      // Fetch category budgets
      const { data: categoryData, error: categoryError } = await supabase
        .from("category_budgets")
        .select("*")
        .eq("user_id", user?.id)
        .eq("month", currentMonth)
        .eq("year", currentYear);

      if (categoryError && categoryError.code !== 'PGRST116') throw categoryError;

      // Merge with default categories
      const budgets = defaultCategories.map(def => {
        const existing = categoryData?.find(c => c.category === def.category);
        return {
          id: existing?.id,
          category: def.category,
          icon: def.icon,
          percentage: existing?.percentage || 0,
          allocated_amount: existing?.allocated_amount || 0,
          spent_amount: existing?.spent_amount || 0,
        };
      });

      // Fetch actual spending
      const { data: transactions } = await supabase
        .from("transactions")
        .select("category, amount")
        .eq("user_id", user?.id)
        .eq("type", "expense")
        .gte("date", `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`);

      // Update spent amounts
      budgets.forEach(budget => {
        const spent = transactions
          ?.filter(t => t.category === budget.category)
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        budget.spent_amount = spent;
      });

      setCategoryBudgets(budgets);
    } catch (error) {
      console.error("Error fetching budget data:", error);
      toast.error("Failed to load budget data");
    } finally {
      setLoading(false);
    }
  };

  const handlePercentageChange = (category: string, value: string) => {
    const percentage = parseFloat(value) || 0;
    setCategoryBudgets(prev =>
      prev.map(b =>
        b.category === category
          ? {
              ...b,
              percentage,
              allocated_amount: (monthlyBudget * percentage) / 100,
            }
          : b
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const totalPercentage = categoryBudgets.reduce((sum, b) => sum + b.percentage, 0);
      
      if (totalPercentage > 100) {
        toast.error("Total percentage cannot exceed 100%");
        setSaving(false);
        return;
      }

      // Save or update category budgets
      for (const budget of categoryBudgets) {
        if (budget.percentage > 0) {
          const data = {
            user_id: user?.id,
            category: budget.category,
            percentage: budget.percentage,
            allocated_amount: budget.allocated_amount,
            spent_amount: budget.spent_amount,
            month: currentMonth,
            year: currentYear,
          };

          if (budget.id) {
            await supabase
              .from("category_budgets")
              .update(data)
              .eq("id", budget.id);
          } else {
            await supabase
              .from("category_budgets")
              .insert(data);
          }
        }
      }

      toast.success("Budget allocation saved successfully!");
      fetchBudgetData();
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Failed to save budget allocation");
    } finally {
      setSaving(false);
    }
  };

  const totalAllocated = categoryBudgets.reduce((sum, b) => sum + b.percentage, 0);
  const remaining = 100 - totalAllocated;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/budget">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Budget Allocation</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Set spending percentages for each category
            </p>
          </div>
        </div>

        {/* Monthly Budget Overview */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monthly Budget</p>
                <p className="text-2xl md:text-3xl font-bold"><CurrencyAmount amount={monthlyBudget} /></p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">
                  {totalAllocated >= 100 ? "Fully Allocated" : "Remaining"}
                </p>
                <p className={`text-2xl md:text-3xl font-bold ${remaining < 0 ? "text-red-500" : "text-green-600"}`}>
                  {remaining.toFixed(0)}%
                </p>
              </div>
            </div>
            <Progress value={totalAllocated} className="mt-4 h-3" />
          </CardContent>
        </Card>

        {monthlyBudget === 0 && (
          <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Please set your monthly budget first in the Budget page before allocating to categories.
              </p>
              <Link to="/budget">
                <Button variant="outline" className="mt-3">
                  Go to Budget Page
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Category Allocations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {categoryBudgets.map((budget) => {
            const spendingPercentage = budget.allocated_amount > 0
              ? (budget.spent_amount / budget.allocated_amount) * 100
              : 0;

            return (
              <Card key={budget.category} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <span className="text-xl md:text-2xl">{budget.icon}</span>
                    {budget.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`percentage-${budget.category}`} className="text-sm">
                        Allocation %
                      </Label>
                      <span className="text-sm font-medium">
                        {budget.percentage}%
                      </span>
                    </div>
                    <Input
                      id={`percentage-${budget.category}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={budget.percentage}
                      onChange={(e) =>
                        handlePercentageChange(budget.category, e.target.value)
                      }
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Allocated</span>
                      <span className="font-semibold">
                        <CurrencyAmount amount={budget.allocated_amount} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span
                        className={`font-semibold ${
                          spendingPercentage > 100
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        <CurrencyAmount amount={budget.spent_amount} />
                      </span>
                    </div>
                    <Progress
                      value={Math.min(spendingPercentage, 100)}
                      className="h-2"
                    />
                    {spendingPercentage > 100 && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        Over budget by ₹
                        {(budget.spent_amount - budget.allocated_amount).toFixed(0)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Save Button */}
        <Card className="sticky bottom-3 md:bottom-6 bg-background/95 backdrop-blur-sm border-2">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Allocated: <span className="font-semibold">{totalAllocated.toFixed(1)}%</span>
                </p>
                {remaining < 0 && (
                  <p className="text-xs text-red-600">
                    ⚠️ You've allocated more than 100%
                  </p>
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || remaining < 0}
                className="gap-2 w-full sm:w-auto"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Allocation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BudgetAllocation;
