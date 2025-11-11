import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, TrendingUp, TrendingDown } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  date: string;
  description: string | null;
}

const Calendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<"day" | "week" | "month" | "year">("month");

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

  const groupByDate = (txns: Transaction[]) => {
    const grouped: { [key: string]: Transaction[] } = {};
    txns.forEach((txn) => {
      if (!grouped[txn.date]) {
        grouped[txn.date] = [];
      }
      grouped[txn.date].push(txn);
    });
    return grouped;
  };

  const groupByWeek = (txns: Transaction[]) => {
    const grouped: { [key: string]: Transaction[] } = {};
    txns.forEach((txn) => {
      const date = new Date(txn.date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!grouped[weekKey]) {
        grouped[weekKey] = [];
      }
      grouped[weekKey].push(txn);
    });
    return grouped;
  };

  const groupByMonth = (txns: Transaction[]) => {
    const grouped: { [key: string]: Transaction[] } = {};
    txns.forEach((txn) => {
      const monthKey = txn.date.substring(0, 7);
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(txn);
    });
    return grouped;
  };

  const groupByYear = (txns: Transaction[]) => {
    const grouped: { [key: string]: Transaction[] } = {};
    txns.forEach((txn) => {
      const yearKey = txn.date.substring(0, 4);
      if (!grouped[yearKey]) {
        grouped[yearKey] = [];
      }
      grouped[yearKey].push(txn);
    });
    return grouped;
  };

  const calculateTotals = (txns: Transaction[]) => {
    const income = txns.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = txns.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderGroupedTransactions = () => {
    let grouped: { [key: string]: Transaction[] } = {};
    
    switch (selectedView) {
      case "day":
        grouped = groupByDate(transactions);
        break;
      case "week":
        grouped = groupByWeek(transactions);
        break;
      case "month":
        grouped = groupByMonth(transactions);
        break;
      case "year":
        grouped = groupByYear(transactions);
        break;
    }

    return Object.entries(grouped).map(([period, txns]) => {
      const { income, expense } = calculateTotals(txns);
      const total = income - expense;

      return (
        <Card key={period} className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                <span>
                  {selectedView === "day" && new Date(period).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  {selectedView === "week" && `Week of ${new Date(period).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  {selectedView === "month" && new Date(period + "-01").toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
                  {selectedView === "year" && period}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-income">+₹{income.toFixed(2)}</span>
                <span className="text-expense">-₹{expense.toFixed(2)}</span>
                <span className={total >= 0 ? "text-income" : "text-expense"}>
                  Net: ₹{total.toFixed(2)}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {txns.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        txn.type === "income"
                          ? "bg-income-light text-income"
                          : "bg-expense-light text-expense"
                      }`}
                    >
                      {txn.type === "income" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{txn.description || "No description"}</p>
                      <p className="text-xs text-muted-foreground">{txn.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        txn.type === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {txn.type === "income" ? "+" : "-"}₹{Number(txn.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{txn.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaction Calendar</h1>
        <p className="text-muted-foreground">View your transactions organized by time</p>
      </div>

      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="space-y-4 mt-6">
          {renderGroupedTransactions()}
        </TabsContent>
        <TabsContent value="week" className="space-y-4 mt-6">
          {renderGroupedTransactions()}
        </TabsContent>
        <TabsContent value="month" className="space-y-4 mt-6">
          {renderGroupedTransactions()}
        </TabsContent>
        <TabsContent value="year" className="space-y-4 mt-6">
          {renderGroupedTransactions()}
        </TabsContent>
      </Tabs>

      {transactions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No transactions yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Calendar;
