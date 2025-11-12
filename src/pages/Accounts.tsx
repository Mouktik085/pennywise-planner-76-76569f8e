import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, Wallet, CreditCard, PiggyBank, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  bank_name?: string;
  account_number?: string;
  icon?: string;
  color?: string;
  is_credit_card?: boolean;
  credit_limit?: number;
  credit_used?: number;
  bill_date?: number;
  due_date?: number;
}

const Accounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "cash",
    balance: 0,
    bank_name: "",
    account_number: "",
    icon: "💼",
    is_credit_card: false,
    credit_limit: 0,
    bill_date: 1,
    due_date: 5,
  });

  const emojiList = ["💼", "💳", "🏦", "💰", "🪙", "💵", "💴", "💶", "💷", "💸", "🤑", "🏧", "💎", "👛", "👜", "🎯", "📱", "🌟", "⭐", "🎁"];

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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAccount) {
        const { error } = await supabase
          .from("accounts")
          .update(formData)
          .eq("id", editingAccount.id);
        
        if (error) throw error;
        toast({ title: "Account updated successfully" });
      } else {
        const { error } = await supabase
          .from("accounts")
          .insert([{ ...formData, user_id: user?.id }]);
        
        if (error) throw error;
        toast({ title: "Account created successfully" });
      }
      
      setDialogOpen(false);
      setEditingAccount(null);
      setFormData({ name: "", type: "cash", balance: 0, bank_name: "", account_number: "", icon: "💼", is_credit_card: false, credit_limit: 0, bill_date: 1, due_date: 5 });
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    
    try {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast({ title: "Account deleted successfully" });
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "cash": return <Wallet className="w-6 h-6" />;
      case "bank": return <Building className="w-6 h-6" />;
      case "card": return <CreditCard className="w-6 h-6" />;
      case "piggy_bank": return <PiggyBank className="w-6 h-6" />;
      default: return <Wallet className="w-6 h-6" />;
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your payment accounts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAccount(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Edit Account" : "Add New Account"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-2xl">
                      {formData.icon}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2">
                    <div className="grid grid-cols-5 gap-2">
                      {emojiList.map((emoji) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          className="text-2xl h-12 w-12"
                          onClick={() => setFormData({ ...formData, icon: emoji })}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Cash"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="card">Debit Card</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="piggy_bank">Piggy Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.type === "credit_card" && (
                <>
                  <div className="space-y-2">
                    <Label>Credit Limit</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0, is_credit_card: true })}
                      placeholder="50000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bill Generation Date (Day of Month)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.bill_date}
                      onChange={(e) => setFormData({ ...formData, bill_date: parseInt(e.target.value) || 1 })}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Due Date (Day of Month)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: parseInt(e.target.value) || 5 })}
                      placeholder="5"
                    />
                  </div>
                </>
              )}
              
              {(formData.type === "bank" || formData.type === "card" || formData.type === "upi") && (
                <>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      placeholder="HDFC Bank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      placeholder="****1234"
                    />
                  </div>
                </>
              )}
              
              {formData.type !== "credit_card" && (
                <div className="space-y-2">
                  <Label>Initial Balance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              )}
              <Button type="submit" className="w-full">
                {editingAccount ? "Update" : "Create"} Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">No accounts yet</p>
            <Button onClick={() => setDialogOpen(true)}>Create your first account</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{account.icon || "💼"}</span>
                  {account.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {account.is_credit_card ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Used / Limit</span>
                      <span className="text-2xl font-bold">₹{account.credit_used?.toFixed(2)} / ₹{account.credit_limit?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Available</span>
                      <span className="text-lg font-semibold text-green-600">₹{((account.credit_limit || 0) - (account.credit_used || 0)).toFixed(2)}</span>
                    </div>
                    {account.bill_date && (
                      <p className="text-sm text-muted-foreground">Bill Date: {account.bill_date}th of every month</p>
                    )}
                    {account.due_date && (
                      <p className="text-sm text-muted-foreground">Due Date: {account.due_date}th of every month</p>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <span className="text-2xl font-bold">₹{account.balance.toFixed(2)}</span>
                  </div>
                )}
                {account.bank_name && (
                  <p className="text-sm text-muted-foreground">{account.bank_name}</p>
                )}
                {account.account_number && (
                  <p className="text-sm text-muted-foreground">{account.account_number}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingAccount(account);
                      setFormData({
                        name: account.name,
                        type: account.type,
                        balance: account.balance,
                        bank_name: account.bank_name || "",
                        account_number: account.account_number || "",
                        icon: account.icon || "💼",
                        is_credit_card: account.is_credit_card || false,
                        credit_limit: account.credit_limit || 0,
                        bill_date: account.bill_date || 1,
                        due_date: account.due_date || 5,
                      });
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Accounts;
