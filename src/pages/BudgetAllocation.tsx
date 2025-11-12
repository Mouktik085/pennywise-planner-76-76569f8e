import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Save, PieChart, TrendingDown, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CategoryBudget {
  id?: string;
  category: string;
  percentage: number;
  allocated_amount: number;
  spent_amount: number;
  emoji: string;
}

const expenseCategories = [
  { name: "Food", emoji: "🍔" },
  { name: "Transport", emoji: "🚗" },
  { name: "Shopping", emoji: "🛍️" },
  { name: "Entertainment", emoji: "🎬" },
  { name: "Bills", emoji: "💡" },
  { name: "Healthcare", emoji: "🏥" },
  { name: "Education", emoji: "📚" },
  { name: "Other", emoji: "📦" },
];

const BudgetAllocation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>(
    expenseCategories.map(cat => ({
      category: cat.name,
      percentage: 0,
      allocated_amount: 0,
      spent_amount: 0,
      emoji: cat.emoji,
    }))
  );

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchBudgetData();
  }, [user, navigate]);

  const fetchBudgetData = async () => {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Fetch total monthly budget
      const { data: budgetData } = await supabase
        .from("budget")
        .select("*")
        .eq("user_id", user?.id)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      if (budgetData) {
        setMonthlyBudget(budgetData.monthly_limit);
      }

      // Fetch category budgets
      const { data: categoryData, error } = await supabase
        .from("category_budgets")
        .select("*")
        .eq("user_id", user?.id)
        .eq("month", month)
        .eq("year", year);

      if (error) throw error;

      // Fetch actual spending per category
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("category, amount")
        .eq("user_id", user?.id)
        .eq("type", "expense")
        .gte("date", `${year}-${String(month).padStart(2, '0')}-01`)
        .lte("date", `${year}-${String(month).padStart(2, '0')}-31`);

      // Calculate spent amounts per category
      const spentByCategory: Record<string, number> = {};
      transactionsData?.forEach(t => {
        spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Number(t.amount);
      });

      // Update category budgets with fetched data
      const updatedBudgets = expenseCategories.map(cat => {
        const existing = categoryData?.find(cb => cb.category === cat.name);
        return {
          id: existing?.id,
          category: cat.name,
          percentage: existing?.percentage || 0,
          allocated_amount: existing?.allocated_amount || 0,
          spent_amount: spentByCategory[cat.name] || 0,
          emoji: cat.emoji,
        };
      });

      setCategoryBudgets(updatedBudgets);
    } catch (error) {
      console.error("Error fetching budget data:", error);
      toast.error("Failed to load budget data");
    } finally {
      setLoading(false);
    }
  };

  const handlePercentageChange = (category: string, newPercentage: number) => {
    setCategoryBudgets(prev => prev.map(cb => 
      cb.category === category 
        ? { 
            ...cb, 
            percentage: newPercentage,
            allocated_amount: (monthlyBudget * newPercentage) / 100
          }
        : cb
    ));
  };

  const handleSave = async () => {
    // Validate total percentage
    const totalPercentage = categoryBudgets.reduce((sum, cb) => sum + cb.percentage, 0);
    if (totalPercentage > 100) {
      toast.error(`Total percentage is ${totalPercentage}%. Must be 100% or less.`);
      return;
    }

    if (monthlyBudget === 0) {
      toast.error("Please set a monthly budget first");
      return;
    }

    setSaving(true);
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Update or insert total budget
      const { error: budgetError } = await supabase
        .from("budget")
        .upsert({
          user_id: user?.id,
          month,
          year,
          monthly_limit: monthlyBudget,
          current_spent: 0,
        }, {
          onConflict: 'user_id,month,year'
        });

      if (budgetError) throw budgetError;

      // Save category budgets
      const categoriesToSave = categoryBudgets
        .filter(cb => cb.percentage > 0)
        .map(cb => ({
          id: cb.id,
          user_id: user?.id,
          category: cb.category,
          percentage: cb.percentage,
          allocated_amount: cb.allocated_amount,
          spent_amount: cb.spent_amount,
          month,
          year,
        }));

      const { error: categoryError } = await supabase
        .from("category_budgets")
        .upsert(categoriesToSave, {
          onConflict: 'user_id,category,month,year'
        });

      if (categoryError) throw categoryError;

      toast.success("Budget allocation saved successfully!");
      fetchBudgetData();
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Failed to save budget allocation");
    } finally {
      setSaving(false);
    }
  };

  const totalPercentage = categoryBudgets.reduce((sum, cb) => sum + cb.percentage, 0);
  const remainingPercentage = 100 - totalPercentage;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/budget">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Budget Allocation</h1>
            <p className="text-muted-foreground mt-1">Set spending percentages for each category</p>
          </div>
        </div>

        {/* Monthly Budget */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Monthly Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monthly-budget">Total Monthly Budget (₹)</Label>
                <Input
                  id="monthly-budget"
                  type="number"
                  step="100"
                  value={monthlyBudget}
                  onChange={(e) => {
                    const newBudget = parseFloat(e.target.value) || 0;
                    setMonthlyBudget(newBudget);
                    // Recalculate allocated amounts
                    setCategoryBudgets(prev => prev.map(cb => ({
                      ...cb,
                      allocated_amount: (newBudget * cb.percentage) / 100
                    })));
                  }}
                  placeholder="50000"
                  className="text-2xl font-bold"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Allocated</p>
                  <p className="text-2xl font-bold text-primary">{totalPercentage.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className={`text-2xl font-bold ${remainingPercentage < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {remainingPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              {remainingPercentage < 0 && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">Total exceeds 100%! Please adjust allocations.</p>
                </div>
              )}

              <Progress value={totalPercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Category Allocations */}
        <div className="grid gap-4 md:grid-cols-2">
          {categoryBudgets.map((cb) => {
            const spentPercentage = cb.allocated_amount > 0 
              ? (cb.spent_amount / cb.allocated_amount) * 100 
              : 0;

            return (
              <Card key={cb.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-2xl">{cb.emoji}</span>
                    {cb.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Allocation</Label>
                      <span className="text-sm font-bold">{cb.percentage.toFixed(1)}%</span>
                    </div>
                    <Slider
                      value={[cb.percentage]}
                      onValueChange={([value]) => handlePercentageChange(cb.category, value)}
                      max={100}
                      step={1}
                      className="py-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Allocated</span>
                      <span className="font-semibold">₹{cb.allocated_amount.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className={`font-semibold ${spentPercentage > 100 ? 'text-destructive' : 'text-green-600'}`}>
                        ₹{cb.spent_amount.toFixed(0)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(spentPercentage, 100)} 
                      className={`h-2 ${spentPercentage > 100 ? '[&>div]:bg-destructive' : ''}`}
                    />
                    {spentPercentage > 100 && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        Over budget by ₹{(cb.spent_amount - cb.allocated_amount).toFixed(0)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          className="w-full gap-2"
          size="lg"
          disabled={saving || remainingPercentage < 0 || monthlyBudget === 0}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Budget Allocation"}
        </Button>
      </div>
    </div>
  );
};

export default BudgetAllocation;
