import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Notifications = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [savingsAlerts, setSavingsAlerts] = useState(true);
  const [expenseAlerts, setExpenseAlerts] = useState(true);
  const [billAlerts, setBillAlerts] = useState(true);
  const [goalAlerts, setGoalAlerts] = useState(true);
  const [reminderAlerts, setReminderAlerts] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

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
        setSavingsAlerts(data.notification_savings_milestones ?? true);
        setExpenseAlerts(data.notification_expenses ?? true);
        setBillAlerts(data.notification_bills ?? true);
        setGoalAlerts(data.notification_goals ?? true);
        setReminderAlerts(data.notification_transaction_reminders ?? true);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load notification settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          notification_budget_alerts: budgetAlerts,
          notification_savings_milestones: savingsAlerts,
          notification_expenses: expenseAlerts,
          notification_bills: billAlerts,
          notification_goals: goalAlerts,
          notification_transaction_reminders: reminderAlerts,
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      toast.success("Notification settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save notification settings");
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("Browser notifications enabled!");
      } else {
        toast.error("Please enable notifications in your browser settings");
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
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Notification Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage how you receive alerts</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5" />
              Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={requestNotificationPermission} className="w-full" size="sm">
              Enable Browser Notifications
            </Button>
            <p className="text-xs md:text-sm text-muted-foreground">
              Get instant alerts when you're near your budget limit or savings goals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Alert Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="budget-alerts" className="text-sm font-medium">Budget Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when you're near your budget limit
                </p>
              </div>
              <Switch
                id="budget-alerts"
                checked={budgetAlerts}
                onCheckedChange={setBudgetAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="savings-alerts" className="text-sm font-medium">Savings Goal Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when you're close to reaching your savings goals
                </p>
              </div>
              <Switch
                id="savings-alerts"
                checked={savingsAlerts}
                onCheckedChange={setSavingsAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="expense-alerts" className="text-sm font-medium">Expense Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified about large expenses
                </p>
              </div>
              <Switch
                id="expense-alerts"
                checked={expenseAlerts}
                onCheckedChange={setExpenseAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="bill-alerts" className="text-sm font-medium">Bill Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Get reminded about upcoming bills
                </p>
              </div>
              <Switch
                id="bill-alerts"
                checked={billAlerts}
                onCheckedChange={setBillAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="goal-alerts" className="text-sm font-medium">Goal Milestones</Label>
                <p className="text-xs text-muted-foreground">
                  Celebrate when you reach financial goals
                </p>
              </div>
              <Switch
                id="goal-alerts"
                checked={goalAlerts}
                onCheckedChange={setGoalAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="reminder-alerts" className="text-sm font-medium">Transaction Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Get reminded to log your transactions
                </p>
              </div>
              <Switch
                id="reminder-alerts"
                checked={reminderAlerts}
                onCheckedChange={setReminderAlerts}
              />
            </div>

            <Button onClick={handleSave} className="w-full mt-4" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save Notification Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 text-sm md:text-base">📱 Mobile Optimized</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              This app is optimized for mobile devices. Install it as an APK for the best experience with SMS auto-import!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
