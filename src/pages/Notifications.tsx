import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Mail, MessageSquare, Save, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Notifications = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Notification settings from database
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [transactionReminders, setTransactionReminders] = useState(true);
  const [savingsMilestones, setSavingsMilestones] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(2);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchSettings();
  }, [user, navigate]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setBudgetAlerts(data.notification_budget_alerts ?? true);
        setTransactionReminders(data.notification_transaction_reminders ?? true);
        setSavingsMilestones(data.notification_savings_milestones ?? true);
        setReminderDaysBefore(data.reminder_days_before || 2);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load notification settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          notification_budget_alerts: budgetAlerts,
          notification_transaction_reminders: transactionReminders,
          notification_savings_milestones: savingsMilestones,
          reminder_days_before: reminderDaysBefore,
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You will now receive browser notifications",
        });
      } else {
        toast({
          title: "Notifications Denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
      }
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold">Notification Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your alerts and reminders</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Browser Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={requestNotificationPermission} className="w-full">
              Enable Browser Notifications
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Get instant alerts in your browser when important events happen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alert Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <Label htmlFor="budget-alerts" className="text-base font-semibold">Budget Alerts</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Get notified when you're approaching your budget limit
                </p>
              </div>
              <Switch
                id="budget-alerts"
                checked={budgetAlerts}
                onCheckedChange={setBudgetAlerts}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <Label htmlFor="transaction-reminders" className="text-base font-semibold">Transaction Reminders</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Get reminders for upcoming recurring transactions and bills
                </p>
              </div>
              <Switch
                id="transaction-reminders"
                checked={transactionReminders}
                onCheckedChange={setTransactionReminders}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <Label htmlFor="savings-alerts" className="text-base font-semibold">Savings Milestones</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Celebrate when you reach your savings goals
                </p>
              </div>
              <Switch
                id="savings-alerts"
                checked={savingsMilestones}
                onCheckedChange={setSavingsMilestones}
              />
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <Label htmlFor="reminder-days" className="text-base font-semibold">Reminder Window</Label>
              <p className="text-sm text-muted-foreground mb-2">
                How many days before a recurring transaction to show reminders
              </p>
              <Input
                id="reminder-days"
                type="number"
                min="1"
                max="7"
                value={reminderDaysBefore}
                onChange={(e) => setReminderDaysBefore(parseInt(e.target.value) || 2)}
                className="w-24"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">SMS Auto-Import</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Automatically import bank transaction SMS messages.
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Configure SMS settings in the Settings page under "SMS Auto-Import"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave} 
          className="w-full gap-2"
          disabled={saving}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Notification Settings"}
        </Button>
      </div>
    </div>
  );
};

export default Notifications;
