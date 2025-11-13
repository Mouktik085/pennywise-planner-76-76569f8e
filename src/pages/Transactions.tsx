import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Calendar as CalendarIcon, TrendingUp, TrendingDown, Trash2, ArrowLeftRight, Edit, Edit2, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { EditTransferDialog } from "@/components/EditTransferDialog";
import { ManualSMSImport } from "@/components/ManualSMSImport";
import { CurrencyAmount } from "@/components/CurrencyAmount";
import { useTranslation } from "@/hooks/useTranslation";

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  date: string;
  description: string | null;
  account_id: string | null;
  accounts?: {
    name: string;
  };
}

interface Transfer {
  id: string;
  from_id: string;
  to_id: string;
  from_type: string;
  to_type: string;
  amount: number;
  date: string;
  description: string | null;
}

const Transactions = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [date, setDate] = useState<Date>();
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [showEditTransferDialog, setShowEditTransferDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchTransfers();
    }
  }, [user, typeFilter, date, searchQuery]);

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from("transactions")
        .select("*, accounts(name)")
        .order("date", { ascending: false });

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      if (date) {
        query = query.eq("date", format(date, "yyyy-MM-dd"));
      }

      if (searchQuery) {
        query = query.or(`description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter out transfer-related transactions to avoid duplicates
      const filteredData = (data || []).filter(t => 
        t.category !== "Savings Transfer" && 
        t.category !== "Savings Withdrawal"
      );

      setTransactions(filteredData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransfers = async () => {
    try {
      let query = supabase
        .from("transfers")
        .select("*")
        .order("date", { ascending: false });

      if (date) {
        query = query.eq("date", format(date, "yyyy-MM-dd"));
      }

      if (searchQuery) {
        query = query.ilike("description", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransfers(data || []);
    } catch (error) {
      console.error("Error fetching transfers:", error);
    }
  };

  const handleDelete = async (id: string, accountId?: string) => {
    try {
      // Get transaction details before deleting
      const { data: transactionData } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .single();
      
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update account balance if transaction had an account
      if (transactionData && accountId) {
        const { data: accountData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", accountId)
          .single();

        if (accountData) {
          const newBalance = transactionData.type === "expense" 
            ? accountData.balance + transactionData.amount 
            : accountData.balance - transactionData.amount;
          
          await supabase
            .from("accounts")
            .update({ balance: newBalance })
            .eq("id", accountId);
        }
      }

      // Update budget if it was an expense
      if (transactionData && transactionData.type === "expense") {
        const transDate = new Date(transactionData.date);
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
          await supabase
            .from("budget")
            .update({ current_spent: Math.max(0, budgetData.current_spent - transactionData.amount) })
            .eq("id", budgetData.id);
        }
      }

      toast.success("Transaction deleted successfully");
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditDialog(true);
  };

  const handleEditTransfer = (transfer: Transfer) => {
    setEditingTransfer(transfer);
    setShowEditTransferDialog(true);
  };

  const handleDeleteTransfer = async (id: string) => {
    try {
      const { error } = await supabase
        .from("transfers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Transfer deleted successfully");
      fetchTransfers();
    } catch (error) {
      console.error("Error deleting transfer:", error);
      toast.error("Failed to delete transfer");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">{t('transactions')}</h1>
            <p className="text-muted-foreground mt-1">{t('manageIncomeExpenses')}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <ManualSMSImport />
            <Link to="/add-transaction" className="flex-1 sm:flex-none">
              <Button className="gap-2 w-full">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Add</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="income">Income Only</SelectItem>
                <SelectItem value="expense">Expenses Only</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-full",
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
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {date && (
              <Button variant="outline" onClick={() => setDate(undefined)} className="w-full">
                Clear Date
              </Button>
            )}
          </div>
        </Card>

        {/* Transfers List */}
        {transfers.length > 0 && typeFilter === "all" && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Transfer History</h2>
            <div className="space-y-3">
              {transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/20 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 sm:p-3 rounded-full bg-primary/20 text-primary flex-shrink-0">
                      <ArrowLeftRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{transfer.description || "Transfer"}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {transfer.from_type === 'account' ? 'Account' : 'Savings'} → {transfer.to_type === 'account' ? 'Account' : 'Savings'}
                      </p>
                      <p className="text-xs text-muted-foreground">{transfer.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    <p className="font-bold text-primary text-lg">
                      <CurrencyAmount amount={Number(transfer.amount)} />
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTransfer(transfer)}
                        className="text-primary hover:text-primary h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTransfer(transfer.id)}
                        className="text-destructive hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Transactions List */}
        <Card className="p-6">
          {transactions.length === 0 && transfers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No transactions found. Start adding your income and expenses!
              </p>
              <Link to="/add-transaction">
                <Button>Add Your First Transaction</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${
                        transaction.type === "income"
                          ? "bg-income-light text-income"
                          : "bg-expense-light text-expense"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{transaction.description || "No description"}</p>
                      <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-center text-xs sm:text-sm text-muted-foreground">
                        <p className="truncate">{transaction.category}</p>
                        {transaction.accounts?.name && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <p className="truncate">{transaction.accounts.name}</p>
                          </>
                        )}
                        <span className="hidden sm:inline">•</span>
                        <p>{transaction.date}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    <p
                      className="font-bold text-lg"
                    >
                      <CurrencyAmount 
                        amount={transaction.type === "expense" ? -Number(transaction.amount) : Number(transaction.amount)} 
                        showSign 
                      />
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transaction)}
                        className="text-primary hover:text-primary h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id, transaction.account_id || undefined)}
                        className="text-destructive hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <EditTransactionDialog
        transaction={editingTransaction}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={fetchTransactions}
      />

      <EditTransferDialog
        transfer={editingTransfer}
        open={showEditTransferDialog}
        onOpenChange={setShowEditTransferDialog}
        onSuccess={fetchTransfers}
      />
    </div>
  );
};

export default Transactions;
