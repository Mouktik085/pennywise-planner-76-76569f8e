import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  date: string;
  description: string | null;
}

const FullCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<"month" | "week" | "day" | "year">("month");

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getTransactionsForDate = (date: string) => {
    return transactions.filter(t => t.date === date);
  };

  const calculateDailyTotal = (date: string) => {
    const dayTransactions = getTransactionsForDate(date);
    const income = dayTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = dayTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense, total: income - expense };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];
    const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 min-h-[100px] bg-muted/20"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTxns = getTransactionsForDate(dateStr);
      const { income, expense, total } = calculateDailyTotal(dateStr);
      const isToday = new Date().toDateString() === new Date(dateStr).toDateString();

      days.push(
        <div
          key={day}
          className={`p-2 min-h-[100px] border border-border rounded-lg ${
            isToday ? 'bg-primary/10 border-primary' : 'bg-card'
          } hover:bg-muted/50 transition-colors`}
        >
          <div className={`text-sm font-bold mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
            {day}
          </div>
          {dayTxns.length > 0 && (
            <div className="space-y-1">
              {income > 0 && (
                <div className="text-xs text-income flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>₹{income.toFixed(0)}</span>
                </div>
              )}
              {expense > 0 && (
                <div className="text-xs text-expense flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  <span>₹{expense.toFixed(0)}</span>
                </div>
              )}
              <div className={`text-xs font-semibold ${total >= 0 ? 'text-income' : 'text-expense'}`}>
                Net: ₹{total.toFixed(0)}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">{monthName}</h2>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const renderTransactionSummary = () => {
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthTransactions = transactions.filter(t => t.date.startsWith(monthKey));
    const income = monthTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = monthTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Income</p>
              <p className="text-2xl font-bold text-income">₹{income.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="text-2xl font-bold text-expense">₹{expense.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Net</p>
              <p className={`text-2xl font-bold ${income - expense >= 0 ? 'text-income' : 'text-expense'}`}>
                ₹{(income - expense).toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            <h3 className="font-semibold mb-3">Recent Transactions</h3>
            {monthTransactions.slice(0, 5).map(txn => (
              <div key={txn.id} className="flex justify-between items-center p-2 rounded bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{txn.description || "No description"}</p>
                  <p className="text-xs text-muted-foreground">{txn.category} • {txn.date}</p>
                </div>
                <p className={`font-bold ${txn.type === "income" ? "text-income" : "text-expense"}`}>
                  {txn.type === "income" ? "+" : "-"}₹{Number(txn.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Calendar</h1>
          <p className="text-muted-foreground">View your transactions in calendar format</p>
        </div>
        <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="day">Daily</TabsTrigger>
            <TabsTrigger value="week">Weekly</TabsTrigger>
            <TabsTrigger value="month">Monthly</TabsTrigger>
            <TabsTrigger value="year">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {renderCalendar()}
      {renderTransactionSummary()}
    </div>
  );
};

export default FullCalendar;
