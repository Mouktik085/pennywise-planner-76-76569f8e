import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";

interface Transfer {
  id: string;
  from_id: string;
  to_id: string;
  from_type: string;
  to_type: string;
  amount: number;
  date: string;
  description: string | null;
  is_recurring?: boolean;
  recurring_frequency?: string | null;
  is_planned?: boolean;
}

interface EditTransferDialogProps {
  transfer: Transfer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditTransferDialog = ({ transfer, open, onOpenChange, onSuccess }: EditTransferDialogProps) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPlanned, setIsPlanned] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transfer) {
      setAmount(transfer.amount.toString());
      setDate(parse(transfer.date, "yyyy-MM-dd", new Date()));
      setDescription(transfer.description || "");
      setIsRecurring(transfer.is_recurring || false);
      setIsPlanned(transfer.is_planned || false);
      setRecurringFrequency(transfer.recurring_frequency || "monthly");
    }
  }, [transfer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transfer) return;

    setLoading(true);

    try {
      const oldAmount = transfer.amount;
      const newAmount = parseFloat(amount);
      const amountDifference = newAmount - oldAmount;

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

      // Update the transfer record
      const { error: transferError } = await supabase
        .from("transfers")
        .update({
          amount: newAmount,
          date: format(date, "yyyy-MM-dd"),
          description,
          is_recurring: isRecurring,
          recurring_frequency: isRecurring ? recurringFrequency : null,
          next_occurrence_date: nextOccurrence ? format(nextOccurrence, "yyyy-MM-dd") : null,
          is_planned: isPlanned,
        })
        .eq("id", transfer.id);

      if (transferError) throw transferError;

      // Only update balances if not planned
      if (!isPlanned) {
        // Update account balances based on transfer type
        if (transfer.from_type === "account") {
        const { data: fromAccount } = await supabase
          .from("accounts")
          .select("balance, is_credit_card, credit_used")
          .eq("id", transfer.from_id)
          .single();

        if (fromAccount) {
          const updateData: any = { balance: fromAccount.balance - amountDifference };
          
          // If it's a credit card, update credit_used (more spending = more credit_used)
          if (fromAccount.is_credit_card) {
            updateData.credit_used = (fromAccount.credit_used || 0) - amountDifference;
          }
          
          await supabase
            .from("accounts")
            .update(updateData)
            .eq("id", transfer.from_id);
        }
      } else if (transfer.from_type === "savings") {
        const { data: fromGoal } = await supabase
          .from("savings_goals")
          .select("current_amount")
          .eq("id", transfer.from_id)
          .single();

        if (fromGoal) {
          await supabase
            .from("savings_goals")
            .update({ current_amount: fromGoal.current_amount - amountDifference })
            .eq("id", transfer.from_id);
        }
      }

      if (transfer.to_type === "account") {
        const { data: toAccount } = await supabase
          .from("accounts")
          .select("balance, is_credit_card, credit_used")
          .eq("id", transfer.to_id)
          .single();

        if (toAccount) {
          const updateData: any = { balance: toAccount.balance + amountDifference };
          
          // If it's a credit card, decrease credit_used (payment reduces what you owe)
          if (toAccount.is_credit_card) {
            updateData.credit_used = Math.max(0, (toAccount.credit_used || 0) + amountDifference);
          }
          
          await supabase
            .from("accounts")
            .update(updateData)
            .eq("id", transfer.to_id);
        }
      } else if (transfer.to_type === "savings") {
        const { data: toGoal } = await supabase
          .from("savings_goals")
          .select("current_amount")
          .eq("id", transfer.to_id)
          .single();

        if (toGoal) {
          await supabase
            .from("savings_goals")
            .update({ current_amount: toGoal.current_amount + amountDifference })
            .eq("id", transfer.to_id);
        }
      }
      }

      toast.success("Transfer updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update transfer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transfer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-planned-transfer">Planned Transfer</Label>
              <Switch
                id="edit-planned-transfer"
                checked={isPlanned}
                onCheckedChange={setIsPlanned}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-recurring-transfer">Recurring Transfer</Label>
              <Switch
                id="edit-recurring-transfer"
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
