import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { addDays, format, isAfter, isBefore, parseISO } from "date-fns";
import { CurrencyAmount } from "@/components/CurrencyAmount";

interface UpcomingTransaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  recurring_frequency: string | null;
}

export const UpcomingReminders = () => {
  const { user } = useAuth();
  const [upcomingTransactions, setUpcomingTransactions] = useState<UpcomingTransaction[]>([]);
  const [reminderDays, setReminderDays] = useState(2);

  useEffect(() => {
    if (user) {
      fetchUpcomingTransactions();
    }
  }, [user]);

  const fetchUpcomingTransactions = async () => {
    try {
      // Get user's reminder preference
      const { data: profileData } = await supabase
        .from("profiles")
        .select("reminder_days_before")
        .eq("user_id", user?.id)
        .maybeSingle();

      const days = profileData?.reminder_days_before || 2;
      setReminderDays(days);

      // Get recurring transactions
      const { data: recurringData, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_recurring", true)
        .order("date", { ascending: true });

      if (error) throw error;

      // Filter transactions that are within the reminder window
      const today = new Date();
      const reminderDate = addDays(today, days);
      
      const upcoming = (recurringData || []).filter(transaction => {
        const transactionDate = parseISO(transaction.date);
        return isAfter(transactionDate, today) && isBefore(transactionDate, reminderDate);
      });

      setUpcomingTransactions(upcoming);
    } catch (error) {
      console.error("Error fetching upcoming transactions:", error);
    }
  };

  if (upcomingTransactions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Bell className="h-5 w-5" />
          Upcoming Reminders ({upcomingTransactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-blue-100 dark:border-blue-900"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    transaction.type === "income"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  }`}
                >
                  {transaction.type === "income" ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {transaction.description || transaction.category}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {format(parseISO(transaction.date), "MMM dd, yyyy")}</span>
                    {transaction.recurring_frequency && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                        {transaction.recurring_frequency}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold text-sm ${
                    transaction.type === "income"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  <CurrencyAmount 
                    amount={transaction.type === "expense" ? -Number(transaction.amount) : Number(transaction.amount)} 
                    showSign 
                  />
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Showing transactions due within {reminderDays} days
        </p>
      </CardContent>
    </Card>
  );
};
