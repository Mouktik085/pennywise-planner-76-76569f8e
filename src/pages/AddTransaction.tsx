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

const AddTransaction = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPlanned, setIsPlanned] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Transaction added successfully!");
    navigate("/transactions");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
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
            <Tabs defaultValue="expense" className="w-full">
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
                    placeholder="0.00"
                    className="text-2xl font-bold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">🍔 Food & Dining</SelectItem>
                      <SelectItem value="transport">🚗 Transport</SelectItem>
                      <SelectItem value="shopping">🛍️ Shopping</SelectItem>
                      <SelectItem value="entertainment">🎬 Entertainment</SelectItem>
                      <SelectItem value="bills">💡 Bills & Utilities</SelectItem>
                      <SelectItem value="health">🏥 Healthcare</SelectItem>
                      <SelectItem value="education">📚 Education</SelectItem>
                      <SelectItem value="other">📦 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add notes about this transaction..."
                    rows={3}
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
                    <Label>Frequency</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
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
                    placeholder="0.00"
                    className="text-2xl font-bold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income-category">Category</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">💼 Salary</SelectItem>
                      <SelectItem value="freelance">💻 Freelance</SelectItem>
                      <SelectItem value="investment">📈 Investment</SelectItem>
                      <SelectItem value="bonus">🎁 Bonus</SelectItem>
                      <SelectItem value="gift">🎉 Gift</SelectItem>
                      <SelectItem value="other">💰 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income-description">Description</Label>
                  <Textarea
                    id="income-description"
                    placeholder="Add notes about this income..."
                    rows={3}
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

                {isRecurring && (
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">Save Transaction</Button>
              <Link to="/dashboard" className="flex-1">
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
