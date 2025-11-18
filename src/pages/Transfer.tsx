import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Calendar as CalendarIcon } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  is_credit_card?: boolean;
  credit_limit?: number;
  credit_used?: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  current_amount: number;
  icon?: string;
}

const Transfer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { format: formatCurrency } = useCurrency();
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [fromType, setFromType] = useState<"account" | "savings">("account");
  const [toAccountId, setToAccountId] = useState("");
  const [toType, setToType] = useState<"account" | "savings">("account");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPlanned, setIsPlanned] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchSavingsGoals();
    }
  }, [user]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user?.id)
        .order("name");

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchSavingsGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("id, name, current_amount, icon")
        .eq("user_id", user?.id)
        .order("name");

      if (error) throw error;
      setSavingsGoals(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromAccountId || !toAccountId) {
      toast({
        title: "Error",
        description: "Please select both source and destination",
        variant: "destructive",
      });
      return;
    }

    if (fromAccountId === toAccountId && fromType === toType) {
      toast({
        title: "Error",
        description: "Cannot transfer to the same place",
        variant: "destructive",
      });
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check source balance only if not planned
      if (!isPlanned) {
        let fromBalance = 0;
        if (fromType === "account") {
          const { data: fromAccount } = await supabase
            .from("accounts")
            .select("balance")
            .eq("id", fromAccountId)
            .single();
          fromBalance = fromAccount?.balance || 0;
        } else {
          const { data: fromGoal } = await supabase
            .from("savings_goals")
            .select("current_amount")
            .eq("id", fromAccountId)
            .single();
          fromBalance = fromGoal?.current_amount || 0;
        }

        if (fromBalance < transferAmount) {
          throw new Error("Insufficient balance");
        }

        // Update source
        if (fromType === "account") {
          const { data: fromAccount } = await supabase
            .from("accounts")
            .select("balance, is_credit_card, credit_used")
            .eq("id", fromAccountId)
            .single();
          
          const updateData: any = { balance: fromBalance - transferAmount };
          
          // If it's a credit card, also update credit_used (paying with card increases credit_used)
          if (fromAccount?.is_credit_card) {
            updateData.credit_used = (fromAccount.credit_used || 0) + transferAmount;
          }
          
          const { error } = await supabase
            .from("accounts")
            .update(updateData)
            .eq("id", fromAccountId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("savings_goals")
            .update({ current_amount: fromBalance - transferAmount })
            .eq("id", fromAccountId);
          if (error) throw error;
        }

        // Update destination
        if (toType === "account") {
          const { data: toAccount } = await supabase
            .from("accounts")
            .select("balance, is_credit_card, credit_used")
            .eq("id", toAccountId)
            .single();
          
          const updateData: any = { balance: (toAccount?.balance || 0) + transferAmount };
          
          // If it's a credit card, decrease credit_used (making payment reduces what you owe)
          if (toAccount?.is_credit_card) {
            updateData.credit_used = Math.max(0, (toAccount.credit_used || 0) - transferAmount);
          }
          
          const { error } = await supabase
            .from("accounts")
            .update(updateData)
            .eq("id", toAccountId);
          if (error) throw error;
        } else {
          const { data: toGoal } = await supabase
            .from("savings_goals")
            .select("current_amount")
            .eq("id", toAccountId)
            .single();
          const { error } = await supabase
            .from("savings_goals")
            .update({ current_amount: (toGoal?.current_amount || 0) + transferAmount })
            .eq("id", toAccountId);
          if (error) throw error;
        }
      }

      // Calculate next occurrence date if recurring
      let nextOccurrence = null;
      if (isRecurring && !isPlanned) {
        const transferDate = new Date(date);
        switch (recurringFrequency) {
          case "daily":
            nextOccurrence = new Date(transferDate.setDate(transferDate.getDate() + 1));
            break;
          case "weekly":
            nextOccurrence = new Date(transferDate.setDate(transferDate.getDate() + 7));
            break;
          case "monthly":
            nextOccurrence = new Date(transferDate.setMonth(transferDate.getMonth() + 1));
            break;
          case "yearly":
            nextOccurrence = new Date(transferDate.setFullYear(transferDate.getFullYear() + 1));
            break;
        }
      }

      // Record transfer in transfers table with proper type tracking
      const { error: transferError } = await supabase
        .from("transfers")
        .insert([{
          user_id: user?.id,
          from_id: fromAccountId,
          to_id: toAccountId,
          from_type: fromType,
          to_type: toType,
          amount: transferAmount,
          description: description || `Transfer from ${fromType} to ${toType}`,
          date: format(date, "yyyy-MM-dd"),
          is_recurring: isRecurring,
          recurring_frequency: isRecurring ? recurringFrequency : null,
          next_occurrence_date: nextOccurrence ? format(nextOccurrence, "yyyy-MM-dd") : null,
          is_planned: isPlanned,
        }]);

      if (transferError) throw transferError;

      // Only update budget and create transactions if not planned
      if (!isPlanned) {
        // Update budget only when transferring account -> savings or savings -> account
        // Reduce budget when: account -> savings goal
        if (fromType === "account" && toType === "savings") {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const { data: budgetData } = await supabase
          .from("budget")
          .select("current_spent, id")
          .eq("month", currentMonth)
          .eq("year", currentYear)
          .maybeSingle();

        if (budgetData) {
          await supabase
            .from("budget")
            .update({ current_spent: Number(budgetData.current_spent) + transferAmount })
            .eq("id", budgetData.id);
        }
      }
      
      // Increase budget when: savings goal -> account (reduces spent)
      if (fromType === "savings" && toType === "account") {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const { data: budgetData } = await supabase
          .from("budget")
          .select("current_spent, id")
          .eq("month", currentMonth)
          .eq("year", currentYear)
          .maybeSingle();

        if (budgetData && budgetData.current_spent > 0) {
          await supabase
            .from("budget")
            .update({ 
              current_spent: Math.max(0, Number(budgetData.current_spent) - transferAmount) 
            })
            .eq("id", budgetData.id);
        }
      }

      // Only create transaction records for account <-> savings transfers (not account <-> account)
      const isAccountToSavings = fromType === 'account' && toType === 'savings';
      const isSavingsToAccount = fromType === 'savings' && toType === 'account';
      
      if (isAccountToSavings || isSavingsToAccount) {
        const transactionDate = new Date().toISOString().split('T')[0];
        const transactions = [];
        
        if (isAccountToSavings) {
          // Expense for the account when transferring to savings
          transactions.push({
            user_id: user?.id,
            type: "expense",
            category: "Savings Transfer",
            amount: transferAmount,
            date: transactionDate,
            description: `Transfer to savings goal: ${savingsGoals.find(g => g.id === toAccountId)?.name}`,
            account_id: fromAccountId,
          });
        } else if (isSavingsToAccount) {
          // Income for the account when receiving from savings
          transactions.push({
            user_id: user?.id,
            type: "income",
            category: "Savings Withdrawal",
            amount: transferAmount,
            date: transactionDate,
            description: `Withdrawal from savings: ${savingsGoals.find(g => g.id === fromAccountId)?.name}`,
            account_id: toAccountId,
          });
        }

        if (transactions.length > 0) {
          const { error: txnError } = await supabase
            .from("transactions")
            .insert(transactions);

          if (txnError) console.error("Error creating transaction:", txnError);
        }
      }
      }

      toast({
        title: "Success",
        description: "Transfer completed successfully",
      });

      // Reset form
      setFromAccountId("");
      setToAccountId("");
      setAmount("");
      setDescription("");
      setDate(new Date());
      setIsRecurring(false);
      setIsPlanned(false);
      setRecurringFrequency("monthly");

      // Navigate after a short delay to ensure state updates
      setTimeout(() => {
        navigate("/transactions");
      }, 500);
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete transfer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            {t('transferBetweenAccounts')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('from')}</Label>
              <Select value={fromType} onValueChange={(v) => { setFromType(v as any); setFromAccountId(""); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">{t('account')}</SelectItem>
                  <SelectItem value="savings">{t('savingsGoal')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fromAccountId} onValueChange={setFromAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectSource')} />
                </SelectTrigger>
                <SelectContent>
                  {fromType === "account" 
                    ? accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({formatCurrency(account.balance)})
                        </SelectItem>
                      ))
                    : savingsGoals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.icon} {goal.name} ({formatCurrency(goal.current_amount)})
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('to')}</Label>
              <Select value={toType} onValueChange={(v) => { setToType(v as any); setToAccountId(""); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">{t('account')}</SelectItem>
                  <SelectItem value="savings">{t('savingsGoal')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={toAccountId} onValueChange={setToAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectDestination')} />
                </SelectTrigger>
                <SelectContent>
                  {toType === "account" 
                    ? accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({formatCurrency(account.balance)})
                        </SelectItem>
                      ))
                    : savingsGoals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.icon} {goal.name} ({formatCurrency(goal.current_amount)})
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('amount')}</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t('descriptionOptional')}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('whatsThisFor')}
              />
            </div>

            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="planned-transfer">Planned Transfer</Label>
                <Switch
                  id="planned-transfer"
                  checked={isPlanned}
                  onCheckedChange={setIsPlanned}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="recurring-transfer">Recurring Transfer</Label>
                <Switch
                  id="recurring-transfer"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                  disabled={isPlanned}
                />
              </div>

              {isRecurring && !isPlanned && (
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? t('processing') : t('transferMoney')}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                {t('cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transfer;
