import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight } from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [fromType, setFromType] = useState<"account" | "savings">("account");
  const [toAccountId, setToAccountId] = useState("");
  const [toType, setToType] = useState<"account" | "savings">("account");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

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
      // Check source balance
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
        const { error } = await supabase
          .from("accounts")
          .update({ balance: fromBalance - transferAmount })
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
          .select("balance")
          .eq("id", toAccountId)
          .single();
        const { error } = await supabase
          .from("accounts")
          .update({ balance: (toAccount?.balance || 0) + transferAmount })
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

      // Record transfer
      const { error: transferError } = await supabase
        .from("transfers")
        .insert([{
          user_id: user?.id,
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          amount: transferAmount,
          description: description || `Transfer from ${fromType} to ${toType}`,
          date: new Date().toISOString().split('T')[0],
        }]);

      if (transferError) throw transferError;

      toast({
        title: "Success",
        description: "Transfer completed successfully",
      });

      navigate("/transactions");
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

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Transfer Between Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={fromType} onValueChange={(v) => { setFromType(v as any); setFromAccountId(""); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="savings">Savings Goal</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fromAccountId} onValueChange={setFromAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {fromType === "account" 
                    ? accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} (₹{account.balance.toFixed(2)})
                        </SelectItem>
                      ))
                    : savingsGoals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.icon} {goal.name} (₹{goal.current_amount.toFixed(2)})
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To</Label>
              <Select value={toType} onValueChange={(v) => { setToType(v as any); setToAccountId(""); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="savings">Savings Goal</SelectItem>
                </SelectContent>
              </Select>
              <Select value={toAccountId} onValueChange={setToAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {toType === "account" 
                    ? accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} (₹{account.balance.toFixed(2)})
                        </SelectItem>
                      ))
                    : savingsGoals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.icon} {goal.name} (₹{goal.current_amount.toFixed(2)})
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount (₹)</Label>
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
              <Label>Description (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this transfer for?"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Processing..." : "Transfer Money"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transfer;
