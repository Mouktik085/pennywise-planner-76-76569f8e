import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

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

interface EditTransferDialogProps {
  transfer: Transfer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditTransferDialog = ({ transfer, open, onOpenChange, onSuccess }: EditTransferDialogProps) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transfer) {
      setAmount(transfer.amount.toString());
      setDate(transfer.date);
      setDescription(transfer.description || "");
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

      // Update the transfer record
      const { error: transferError } = await supabase
        .from("transfers")
        .update({
          amount: newAmount,
          date,
          description,
        })
        .eq("id", transfer.id);

      if (transferError) throw transferError;

      // Update account balances based on transfer type
      if (transfer.from_type === "account") {
        const { data: fromAccount } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", transfer.from_id)
          .single();

        if (fromAccount) {
          await supabase
            .from("accounts")
            .update({ balance: fromAccount.balance - amountDifference })
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
          .select("balance")
          .eq("id", transfer.to_id)
          .single();

        if (toAccount) {
          await supabase
            .from("accounts")
            .update({ balance: toAccount.balance + amountDifference })
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
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
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
