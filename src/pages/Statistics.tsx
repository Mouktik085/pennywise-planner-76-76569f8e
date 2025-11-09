import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";

const Statistics = () => {
  const expenseData = [
    { name: "Food", value: 8500, color: "hsl(var(--chart-1))" },
    { name: "Transport", value: 4200, color: "hsl(var(--chart-2))" },
    { name: "Entertainment", value: 3800, color: "hsl(var(--chart-3))" },
    { name: "Bills", value: 6000, color: "hsl(var(--chart-4))" },
    { name: "Shopping", value: 6000, color: "hsl(var(--chart-5))" },
  ];

  const monthlyData = [
    { month: "Jan", income: 45000, expenses: 28500 },
    { month: "Feb", income: 48000, expenses: 31000 },
    { month: "Mar", income: 45000, expenses: 29500 },
    { month: "Apr", income: 50000, expenses: 32000 },
    { month: "May", income: 45000, expenses: 28500 },
    { month: "Jun", income: 47000, expenses: 30000 },
  ];

  const trendData = [
    { month: "Jan", savings: 16500 },
    { month: "Feb", savings: 17000 },
    { month: "Mar", savings: 15500 },
    { month: "Apr", savings: 18000 },
    { month: "May", savings: 16500 },
    { month: "Jun", savings: 17000 },
  ];

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
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4">Monthly Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-income-light rounded-lg">
                  <p className="text-sm text-income font-semibold">Average Income</p>
                  <p className="text-2xl font-bold text-income">₹46,500</p>
                </div>
                <div className="p-4 bg-expense-light rounded-lg">
                  <p className="text-sm text-expense font-semibold">Average Expenses</p>
                  <p className="text-2xl font-bold text-expense">₹29,917</p>
                </div>
                <div className="p-4 bg-savings-light rounded-lg">
                  <p className="text-sm text-savings font-semibold">Average Savings</p>
                  <p className="text-2xl font-bold text-savings">₹16,583</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6 mt-6">
            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4">Expense Breakdown</h3>
              <div className="space-y-4">
                {expenseData.map((item) => {
                  const total = expenseData.reduce((sum, i) => sum + i.value, 0);
                  const percentage = (item.value / total) * 100;
                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-muted-foreground">₹{item.value.toLocaleString()}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{ width: `${percentage}%`, backgroundColor: item.color }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}% of total expenses</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4">Top Spending Categories</h3>
              <div className="space-y-3">
                {expenseData
                  .sort((a, b) => b.value - a.value)
                  .map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                        <span className="font-semibold">{item.name}</span>
                      </div>
                      <span className="font-bold text-expense">₹{item.value.toLocaleString()}</span>
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
                  <div className="p-4 bg-income-light rounded-lg">
                    <p className="font-semibold text-income">📈 Great Job!</p>
                    <p className="text-sm mt-1">Your savings increased by 8% this month</p>
                  </div>
                  <div className="p-4 bg-expense-light rounded-lg">
                    <p className="font-semibold text-expense">⚠️ Watch Out</p>
                    <p className="text-sm mt-1">Food expenses are 15% higher than usual</p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="font-semibold text-primary">💡 Tip</p>
                    <p className="text-sm mt-1">Try to reduce entertainment spending by 10%</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-xl mb-4">Financial Health Score</h3>
                <div className="flex flex-col items-center justify-center py-8">
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
                        strokeDasharray={`${75 * 2.827} ${100 * 2.827}`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold text-income">75</span>
                    </div>
                  </div>
                  <p className="text-xl font-semibold mt-4">Good</p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    You're managing your finances well. Keep up the good work!
                  </p>
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
