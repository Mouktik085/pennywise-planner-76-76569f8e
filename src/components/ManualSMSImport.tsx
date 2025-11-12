import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Loader2 } from "lucide-react";
import { SMSParser } from "@/services/smsParser";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const ManualSMSImport = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!smsText.trim()) {
      toast.error("Please enter SMS text");
      return;
    }

    setImporting(true);
    try {
      const parsed = SMSParser.parseSMS(smsText);
      
      if (!parsed) {
        toast.error("Could not parse this SMS. Please check the format.");
        setImporting(false);
        return;
      }

      // Check for duplicate
      const { data: existing } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("amount", parsed.amount)
        .eq("category", parsed.category)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        toast.error("This transaction already exists in your records");
        setImporting(false);
        return;
      }

      // Insert transaction
      const { error } = await supabase.from("transactions").insert({
        user_id: user?.id,
        type: parsed.type,
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description,
        date: parsed.date.toISOString().split('T')[0],
        is_recurring: false,
        is_planned: false,
      });

      if (error) throw error;

      toast.success("Transaction imported successfully!");
      setSmsText("");
      setOpen(false);
    } catch (error: any) {
      console.error("Error importing SMS:", error);
      toast.error("Failed to import transaction");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Manual SMS Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import SMS Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Paste your bank transaction SMS below:
            </p>
            <Textarea
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="Your account has been debited by Rs. 500.00 on 15-Jan-2024..."
              rows={6}
              className="font-mono text-sm"
            />
          </div>
          <Button 
            onClick={handleImport} 
            className="w-full"
            disabled={importing}
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Transaction"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
