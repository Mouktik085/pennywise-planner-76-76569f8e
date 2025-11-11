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

const Transfer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAccounts();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromAccountId || !toAccountId) {
      toast({
        title: "Error",
        description: "Please select both accounts",
        variant: "destructive",
      });
      return;
    }

    if (fromAccountId === toAccountId) {
      toast({
        title: "Error",
        description: "Cannot transfer to the same account",
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
      // Get current balances
      const { data: fromAccount } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", fromAccountId)
        .single();

      if (!fromAccount || fromAccount.balance < transferAmount) {
        throw new Error("Insufficient balance");
      }

      // Create transfer record
      const { error: transferError } = await supabase
        .from("transfers")
        .insert([{
          user_id: user?.id,
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          amount: transferAmount,
          description,
          date: new Date().toISOString().split('T')[0],
        }]);

      if (transferError) throw transferError;

      // Update account balances
      const { error: fromError } = await supabase
        .from("accounts")
        .update({ balance: fromAccount.balance - transferAmount })
        .eq("id", fromAccountId);

      if (fromError) throw fromError;

      const { data: toAccount } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", toAccountId)
        .single();

      const { error: toError } = await supabase
        .from("accounts")
        .update({ balance: (toAccount?.balance || 0) + transferAmount })
        .eq("id", toAccountId);

      if (toError) throw toError;

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
              <Label>From Account</Label>
              <Select value={fromAccountId} onValueChange={setFromAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} (₹{account.balance.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To Account</Label>
              <Select value={toAccountId} onValueChange={setToAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} (₹{account.balance.toFixed(2)})
                    </SelectItem>
                  ))}
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
