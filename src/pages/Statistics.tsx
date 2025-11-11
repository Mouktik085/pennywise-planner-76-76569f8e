import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { useToast } from "@/hooks/use-toast";

const Statistics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  useEffect(() => {
    if (user) {
      fetchStatistics();
    }
  }, [user]);

  const fetchStatistics = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;

      // Group expenses by category
      const expensesByCategory: { [key: string]: number } = {};
      transactions
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Number(t.amount);
        });

      const expenseChartData = Object.entries(expensesByCategory)
        .map(([name, value], index) => ({
          name,
          value,
          fill: chartColors[index % chartColors.length],
        }))
        .sort((a, b) => b.value - a.value);

      setExpenseData(expenseChartData);

      // Group by month for last 6 months
      const monthlyStats: { [key: string]: { income: number; expenses: number } } = {};
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toISOString().substring(0, 7);
      }).reverse();

      transactions.forEach((t) => {
        const month = t.date.substring(0, 7);
        if (last6Months.includes(month)) {
          if (!monthlyStats[month]) {
            monthlyStats[month] = { income: 0, expenses: 0 };
          }
          if (t.type === "income") {
            monthlyStats[month].income += Number(t.amount);
          } else {
            monthlyStats[month].expenses += Number(t.amount);
          }
        }
      });

      const monthlyChartData = last6Months.map((month) => {
        const [year, monthNum] = month.split("-");
        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
        return {
          month: date.toLocaleDateString("en-US", { month: "short" }),
          income: monthlyStats[month]?.income || 0,
          expenses: monthlyStats[month]?.expenses || 0,
        };
      });

      setMonthlyData(monthlyChartData);

      // Savings trend
      const savingsTrend = monthlyChartData.map((m) => ({
        month: m.month,
        savings: m.income - m.expenses,
      }));

      setTrendData(savingsTrend);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
  const monthsWithIncome = monthlyData.filter(m => m.income > 0).length || 1;
  const monthsWithExpenses = monthlyData.filter(m => m.expenses > 0).length || 1;
  const avgIncome = totalIncome / monthsWithIncome;
  const avgExpenses = totalExpenses / monthsWithExpenses;
  const avgSavings = avgIncome - avgExpenses;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Statistics</h1>
            <p className="text-muted-foreground mt-1">Visualize your financial data</p>
          </div>
          <Select defaultValue="this-month">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold text-xl mb-4">Income vs Expenses</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" fill="hsl(var(--income))" name="Income" />
                    <Bar dataKey="expenses" fill="hsl(var(--expense))" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-xl mb-4">Expense Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie 
                      data={expenseData} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={100}
                      label={(entry) => `${entry.name}: ₹${entry.value.toFixed(0)}`}
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4">Monthly Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-income-light rounded-lg">
                  <p className="text-sm text-income font-semibold">Average Income</p>
                  <p className="text-2xl font-bold text-income">
                    ₹{avgIncome.toFixed(0)}
                  </p>
                </div>
                <div className="p-4 bg-expense-light rounded-lg">
                  <p className="text-sm text-expense font-semibold">Average Expenses</p>
                  <p className="text-2xl font-bold text-expense">
                    ₹{avgExpenses.toFixed(0)}
                  </p>
                </div>
                <div className="p-4 bg-savings-light rounded-lg">
                  <p className="text-sm text-savings font-semibold">Average Savings</p>
                  <p className="text-2xl font-bold text-savings">
                    ₹{avgSavings.toFixed(0)}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6 mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Category Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={expenseData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100}
                    label={(entry) => {
                      const total = expenseData.reduce((sum, c) => sum + c.value, 0);
                      const percent = ((entry.value / total) * 100).toFixed(1);
                      return `${entry.name}: ${percent}%`;
                    }}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Expense Breakdown by Category</h3>
              <div className="space-y-4">
                {expenseData.map((category) => {
                  const total = expenseData.reduce((sum, c) => sum + c.value, 0);
                  const percentage = (category.value / total) * 100;
                  return (
                    <div key={category.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{category.name}</span>
                        <span className="font-semibold">₹{category.value.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: category.fill }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Top Spending Categories</h3>
              <div className="space-y-3">
                {expenseData.slice(0, 5).map((category, index) => (
                  <div key={category.name} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: category.fill }}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{category.name}</p>
                      <p className="text-sm text-muted-foreground">₹{category.value.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">₹{category.value.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">{((category.value / expenseData.reduce((sum, c) => sum + c.value, 0)) * 100).toFixed(1)}% of total</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6 mt-6">
            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4">Savings Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    stroke="hsl(var(--savings))"
                    strokeWidth={3}
                    name="Savings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold text-xl mb-4">Insights</h3>
                <div className="space-y-3">
                  {trendData.length >= 2 && trendData[trendData.length - 1].savings > trendData[trendData.length - 2].savings && (
                    <div className="p-4 bg-income-light rounded-lg">
                      <p className="font-semibold text-income">📈 Great Job!</p>
                      <p className="text-sm mt-1">Your savings are improving!</p>
                    </div>
                  )}
                  {expenseData.length > 0 && (
                    <div className="p-4 bg-expense-light rounded-lg">
                      <p className="font-semibold text-expense">Top Expense</p>
                      <p className="text-sm mt-1">
                        {expenseData[0].name}: ₹{expenseData[0].value.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {monthlyData.length > 0 && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="font-semibold text-primary">💡 Insight</p>
                      <p className="text-sm mt-1">
                        {monthlyData[monthlyData.length - 1].income > monthlyData[monthlyData.length - 1].expenses
                          ? "You're spending wisely this month!"
                          : "Consider reviewing your expenses"}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-xl mb-4">Financial Health Score</h3>
                <div className="flex flex-col items-center justify-center py-8">
                  {(() => {
                    const score = totalIncome > 0 ? Math.min(Math.round((1 - totalExpenses / totalIncome) * 100), 100) : 0;
                    return (
                      <>
                        <div className="relative w-40 h-40">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="hsl(var(--muted))"
                              strokeWidth="10"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="hsl(var(--income))"
                              strokeWidth="10"
                              strokeDasharray={`${score * 2.827} ${100 * 2.827}`}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-bold text-income">{score}</span>
                          </div>
                        </div>
                        <p className="text-xl font-semibold mt-4">
                          {score >= 75 ? "Excellent" : score >= 50 ? "Good" : score >= 25 ? "Fair" : "Needs Improvement"}
                        </p>
                        <p className="text-sm text-muted-foreground text-center mt-2">
                          {score >= 75
                            ? "You're managing your finances excellently!"
                            : score >= 50
                            ? "You're doing well, keep it up!"
                            : "Consider reviewing your spending habits"}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Statistics;
