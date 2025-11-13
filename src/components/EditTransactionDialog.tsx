import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  date: string;
  description: string | null;
  account_id?: string | null;
}

interface Account {
  id: string;
  name: string;
}

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditTransactionDialog = ({ transaction, open, onOpenChange, onSuccess }: EditTransactionDialogProps) => {
  const { user } = useAuth();
  const [type, setType] = useState(transaction?.type || "expense");
  const [category, setCategory] = useState(transaction?.category || "");
  const [amount, setAmount] = useState(transaction?.amount.toString() || "");
  const [date, setDate] = useState(transaction?.date || "");
  const [description, setDescription] = useState(transaction?.description || "");
  const [accountId, setAccountId] = useState(transaction?.account_id || "");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchAccounts();
    }
  }, [open, user]);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setCategory(transaction.category);
      setAmount(transaction.amount.toString());
      setDate(transaction.date);
      setDescription(transaction.description || "");
      setAccountId(transaction.account_id || "");
    }
  }, [transaction]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const categories = {
    income: ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"],
    expense: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other"],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    setLoading(true);

    try {
      const newAmount = parseFloat(amount);
      const oldAmount = transaction.amount;
      const amountDiff = newAmount - oldAmount;
      
      // Update the transaction
      const { error } = await supabase
        .from("transactions")
        .update({
          type,
          category,
          amount: newAmount,
          date,
          description,
          account_id: accountId || null,
        })
        .eq("id", transaction.id);

      if (error) throw error;

      // Update old account balance if it existed and changed
      if (transaction.account_id && transaction.account_id !== accountId) {
        const { data: oldAccount } = await supabase
          .from("accounts")
          .select("balance, is_credit_card, credit_used")
          .eq("id", transaction.account_id)
          .single();

        if (oldAccount) {
          const revertedBalance = transaction.type === "expense"
            ? oldAccount.balance + oldAmount
            : oldAccount.balance - oldAmount;
          
          const updateData: any = { balance: revertedBalance };
          
          if (oldAccount.is_credit_card) {
            const revertedCreditUsed = transaction.type === "expense"
              ? Math.max(0, oldAccount.credit_used - oldAmount)
              : oldAccount.credit_used + oldAmount;
            updateData.credit_used = revertedCreditUsed;
          }
          
          await supabase
            .from("accounts")
            .update(updateData)
            .eq("id", transaction.account_id);
        }
      }

      // Update new account balance
      if (accountId) {
        const { data: newAccount } = await supabase
          .from("accounts")
          .select("balance, is_credit_card, credit_used")
          .eq("id", accountId)
          .single();

        if (newAccount) {
          let newBalance = newAccount.balance;
          
          // If account changed, apply full amount, otherwise apply difference
          if (transaction.account_id === accountId) {
            newBalance = type === "expense"
              ? newAccount.balance - amountDiff
              : newAccount.balance + amountDiff;
          } else {
            newBalance = type === "expense"
              ? newAccount.balance - newAmount
              : newAccount.balance + newAmount;
          }
          
          const updateData: any = { balance: newBalance };
          
          if (newAccount.is_credit_card) {
            let newCreditUsed = newAccount.credit_used;
            
            if (transaction.account_id === accountId) {
              newCreditUsed = type === "expense"
                ? newAccount.credit_used + amountDiff
                : newAccount.credit_used - amountDiff;
            } else {
              newCreditUsed = type === "expense"
                ? newAccount.credit_used + newAmount
                : Math.max(0, newAccount.credit_used - newAmount);
            }
            
            updateData.credit_used = Math.max(0, newCreditUsed);
          }
          
          await supabase
            .from("accounts")
            .update(updateData)
            .eq("id", accountId);
        }
      }

      // Update budget if type changed or amount changed
      if (type === "expense" || transaction.type === "expense") {
        const transDate = new Date(date);
        const month = transDate.getMonth() + 1;
        const year = transDate.getFullYear();

        const { data: budgetData } = await supabase
          .from("budget")
          .select("*")
          .eq("user_id", user?.id)
          .eq("month", month)
          .eq("year", year)
          .maybeSingle();

        if (budgetData) {
          let newSpent = budgetData.current_spent;
          
          if (transaction.type === "expense" && type === "expense") {
            // Both expense, apply difference
            newSpent += amountDiff;
          } else if (transaction.type === "expense" && type !== "expense") {
            // Changed from expense to income, subtract old amount
            newSpent -= oldAmount;
          } else if (transaction.type !== "expense" && type === "expense") {
            // Changed from income to expense, add new amount
            newSpent += newAmount;
          }

          await supabase
            .from("budget")
            .update({ current_spent: Math.max(0, newSpent) })
            .eq("id", budgetData.id);
        }
      }

      toast.success("Transaction updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories[type as keyof typeof categories].map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Account</Label>
            <Select value={accountId || "none"} onValueChange={(value) => setAccountId(value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select account (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Account</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
