import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyAmount } from "@/components/CurrencyAmount";

const Statistics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { format: formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [viewPeriod, setViewPeriod] = useState<"day" | "week" | "month" | "year">("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const chartColors = [
    "hsl(175, 75%, 55%)", // Turquoise (Food)
    "hsl(145, 75%, 50%)", // Bright Green (Bills)
    "hsl(50, 95%, 55%)",  // Yellow (Entertainment)
    "hsl(260, 70%, 60%)", // Purple (Living)
    "hsl(0, 85%, 62%)",   // Red (Transport)
    "hsl(330, 85%, 65%)", // Pink (Additional)
    "hsl(30, 95%, 55%)",  // Orange (Additional)
  ];

  useEffect(() => {
    if (user) {
      fetchStatistics();
    }
  }, [user, viewPeriod, currentDate]);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      switch (viewPeriod) {
        case 'day':
          newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
          break;
        case 'week':
          newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'month':
          newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
          break;
        case 'year':
          newDate.setFullYear(prev.getFullYear() + (direction === 'next' ? 1 : -1));
          break;
      }
      return newDate;
    });
  };

  const getPeriodLabel = () => {
    switch (viewPeriod) {
      case 'day':
        return currentDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      case 'year':
        return currentDate.getFullYear().toString();
    }
  };

  const getDateRange = () => {
    let startDate: Date, endDate: Date;
    
    switch (viewPeriod) {
      case 'day':
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - currentDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        endDate = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
    }
    
    return { startDate, endDate };
  };

  const fetchStatistics = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .gte("date", startDateStr)
        .lte("date", endDateStr);

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

      // Group by appropriate time period
      let chartData: any[] = [];
      
      if (viewPeriod === 'day') {
        const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
        chartData = [{ period: 'Today', income: totalIncome, expenses: totalExpenses }];
      } else if (viewPeriod === 'week') {
        const weekStats: { [key: string]: { income: number; expenses: number } } = {};
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        transactions.forEach((t) => {
          const date = new Date(t.date);
          const dayName = days[date.getDay()];
          if (!weekStats[dayName]) {
            weekStats[dayName] = { income: 0, expenses: 0 };
          }
          if (t.type === "income") {
            weekStats[dayName].income += Number(t.amount);
          } else {
            weekStats[dayName].expenses += Number(t.amount);
          }
        });
        chartData = days.map(day => ({
          period: day,
          income: weekStats[day]?.income || 0,
          expenses: weekStats[day]?.expenses || 0,
        }));
      } else if (viewPeriod === 'month') {
        const dailyStats: { [key: string]: { income: number; expenses: number } } = {};
        transactions.forEach((t) => {
          const day = t.date.substring(8, 10);
          if (!dailyStats[day]) {
            dailyStats[day] = { income: 0, expenses: 0 };
          }
          if (t.type === "income") {
            dailyStats[day].income += Number(t.amount);
          } else {
            dailyStats[day].expenses += Number(t.amount);
          }
        });
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        chartData = Array.from({ length: Math.min(daysInMonth, 30) }, (_, i) => {
          const day = String(i + 1).padStart(2, '0');
          return {
            period: String(i + 1),
            income: dailyStats[day]?.income || 0,
            expenses: dailyStats[day]?.expenses || 0,
          };
        });
      } else if (viewPeriod === 'year') {
        const monthlyStats: { [key: string]: { income: number; expenses: number } } = {};
        transactions.forEach((t) => {
          const month = t.date.substring(5, 7);
          if (!monthlyStats[month]) {
            monthlyStats[month] = { income: 0, expenses: 0 };
          }
          if (t.type === "income") {
            monthlyStats[month].income += Number(t.amount);
          } else {
            monthlyStats[month].expenses += Number(t.amount);
          }
        });
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        chartData = months.map((monthName, i) => {
          const monthNum = String(i + 1).padStart(2, '0');
          return {
            period: monthName,
            income: monthlyStats[monthNum]?.income || 0,
            expenses: monthlyStats[monthNum]?.expenses || 0,
          };
        });
      }

      setMonthlyData(chartData);

      // Savings trend
      const savingsTrend = chartData.map((m) => ({
        month: m.period,
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Statistics</h1>
            <p className="text-muted-foreground mt-1">Visualize your financial data</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigatePeriod('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[180px]">
              <p className="font-semibold text-sm md:text-base">{getPeriodLabel()}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigatePeriod('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Select value={viewPeriod} onValueChange={(v) => setViewPeriod(v as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
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
                    <XAxis dataKey="period" />
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
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
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
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
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
