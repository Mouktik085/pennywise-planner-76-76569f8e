import { useState } from "react";
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

const AddTransaction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPlanned, setIsPlanned] = useState(false);
  const [transactionType, setTransactionType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: transactionType,
        amount: parseFloat(amount),
        category,
        description: description || null,
        date: format(date, "yyyy-MM-dd"),
        is_recurring: isRecurring,
        is_planned: isPlanned,
      });

      if (error) throw error;

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
                      <SelectItem value="Other">📦 Other</SelectItem>
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
                      <SelectItem value="Other">💰 Other</SelectItem>
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
