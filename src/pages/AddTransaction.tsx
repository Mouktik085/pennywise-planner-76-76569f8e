import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Account {
  id: string;
  name: string;
  balance: number;
  icon?: string;
  is_credit_card?: boolean;
  credit_limit?: number;
  credit_used?: number;
}

const AddTransaction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPlanned, setIsPlanned] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [transactionType, setTransactionType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name, balance, icon, is_credit_card, credit_limit, credit_used")
        .eq("user_id", user?.id)
        .order("name");

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to add a transaction");
      return;
    }

    if (!amount || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionAmount = parseFloat(amount);
      
      // Check for duplicates
      const { data: recentTransactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("amount", transactionAmount)
        .eq("category", category)
        .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());
      
      if (recentTransactions && recentTransactions.length > 0) {
        const confirmDuplicate = confirm("A similar transaction was added recently. Do you want to continue?");
        if (!confirmDuplicate) {
          setIsSubmitting(false);
          return;
        }
      }
      
      // Insert transaction
      const { error: transError } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: transactionType,
        amount: transactionAmount,
        category,
        description: description || null,
        date: format(date, "yyyy-MM-dd"),
        is_recurring: isRecurring,
        is_planned: isPlanned,
        recurring_frequency: isRecurring ? recurringFrequency : null,
        account_id: accountId || null,
      });

      if (transError) throw transError;

      // Update account balance if account selected
      if (accountId) {
        const account = accounts.find(a => a.id === accountId);
        if (account) {
          if (account.is_credit_card) {
            // For credit cards, update credit_used
            const newCreditUsed = transactionType === "expense" 
              ? (account.credit_used || 0) + transactionAmount 
              : (account.credit_used || 0) - transactionAmount;
            
            const { error: accountError } = await supabase
              .from("accounts")
              .update({ credit_used: Math.max(0, newCreditUsed) })
              .eq("id", accountId);
            
            if (accountError) throw accountError;
          } else {
            // For regular accounts, update balance
            const newBalance = transactionType === "income" 
              ? account.balance + transactionAmount 
              : account.balance - transactionAmount;
            
            const { error: accountError } = await supabase
              .from("accounts")
              .update({ balance: newBalance })
              .eq("id", accountId);
            
            if (accountError) throw accountError;
          }
        }
      }

      // Update budget if expense (not from credit card)
      if (transactionType === "expense") {
        const account = accounts.find(a => a.id === accountId);
        if (!account?.is_credit_card) {
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth() + 1;
          const currentYear = currentDate.getFullYear();

          const { data: budgetData, error: budgetFetchError } = await supabase
            .from("budget")
            .select("*")
            .eq("user_id", user.id)
            .eq("month", currentMonth)
            .eq("year", currentYear)
            .maybeSingle();

          if (budgetFetchError) throw budgetFetchError;

          if (budgetData) {
            const { error: budgetUpdateError } = await supabase
              .from("budget")
              .update({ current_spent: budgetData.current_spent + transactionAmount })
              .eq("id", budgetData.id);

            if (budgetUpdateError) throw budgetUpdateError;
          }
        }
      }

      toast.success("Transaction added successfully!");
      navigate("/transactions");
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      toast.error(error.message || "Failed to add transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Add Transaction</h1>
            <p className="text-muted-foreground mt-1">Record your income or expense</p>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="expense" onValueChange={setTransactionType} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expense">Expense</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
              </TabsList>

              <TabsContent value="expense" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="text-2xl font-bold"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Food">🍔 Food & Dining</SelectItem>
                      <SelectItem value="Transport">🚗 Transport</SelectItem>
                      <SelectItem value="Shopping">🛍️ Shopping</SelectItem>
                      <SelectItem value="Entertainment">🎬 Entertainment</SelectItem>
                      <SelectItem value="Bills">💡 Bills & Utilities</SelectItem>
                      <SelectItem value="Healthcare">🏥 Healthcare</SelectItem>
                      <SelectItem value="Education">📚 Education</SelectItem>
                      <SelectItem value="Transfer">🔄 Transfer</SelectItem>
                      <SelectItem value="Other">📦 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">Account (Optional)</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.icon} {account.name} {account.is_credit_card ? `(Available: ₹${((account.credit_limit || 0) - (account.credit_used || 0)).toFixed(2)})` : `(₹${account.balance.toFixed(2)})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add notes about this transaction..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="recurring">Recurring Transaction</Label>
                    <p className="text-sm text-muted-foreground">Repeat this transaction automatically</p>
                  </div>
                  <Switch
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>

                {isRecurring && (
                  <div className="space-y-2">
                    <Label>Recurring Frequency</Label>
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

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="planned">Planned Transaction</Label>
                    <p className="text-sm text-muted-foreground">Schedule for future date</p>
                  </div>
                  <Switch
                    id="planned"
                    checked={isPlanned}
                    onCheckedChange={setIsPlanned}
                  />
                </div>
              </TabsContent>

              <TabsContent value="income" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="income-amount">Amount (₹)</Label>
                  <Input
                    id="income-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="text-2xl font-bold"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income-category">Category</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Salary">💼 Salary</SelectItem>
                      <SelectItem value="Freelance">💻 Freelance</SelectItem>
                      <SelectItem value="Investment">📈 Investment</SelectItem>
                      <SelectItem value="Bonus">🎁 Bonus</SelectItem>
                      <SelectItem value="Gift">🎉 Gift</SelectItem>
                      <SelectItem value="Transfer">🔄 Transfer</SelectItem>
                      <SelectItem value="Other">💰 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income-account">Account (Optional)</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.icon} {account.name} {account.is_credit_card ? `(Available: ₹${((account.credit_limit || 0) - (account.credit_used || 0)).toFixed(2)})` : `(₹${account.balance.toFixed(2)})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income-description">Description</Label>
                  <Textarea
                    id="income-description"
                    placeholder="Add notes about this income..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="income-recurring">Recurring Income</Label>
                    <p className="text-sm text-muted-foreground">Regular income source</p>
                  </div>
                  <Switch
                    id="income-recurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Transaction"}
              </Button>
              <Link to="/" className="flex-1">
                <Button type="button" variant="outline" className="w-full">Cancel</Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AddTransaction;
