import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, MessageSquare } from "lucide-react";

const Notifications = () => {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(false);
  const [savingsAlerts, setSavingsAlerts] = useState(false);
  const [smsPermission, setSmsPermission] = useState(false);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You will now receive notifications",
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

  const requestSMSPermission = async () => {
    // Note: SMS reading requires native mobile capabilities via Capacitor
    // This is a placeholder for the permission UI
    toast({
      title: "SMS Reading",
      description: "SMS auto-reading requires the mobile app version. Coming soon!",
    });
    setSmsPermission(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground">Manage how you receive alerts and notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={requestNotificationPermission} className="w-full">
            Enable Browser Notifications
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Get instant alerts when you're near your budget limit or savings goals
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notif">Email Notifications</Label>
            <Switch
              id="email-notif"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Receive email alerts for budget and savings milestones
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            SMS Notifications & Auto-Reading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sms-notif">SMS Notifications</Label>
            <Switch
              id="sms-notif"
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
            />
          </div>
          <Button onClick={requestSMSPermission} variant="outline" className="w-full">
            Enable SMS Auto-Reading (Mobile App)
          </Button>
          <p className="text-sm text-muted-foreground">
            Automatically read bank transaction SMS and record them in your app.
            This feature requires the mobile app version with Capacitor.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="budget-alerts">Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">
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
            <div>
              <Label htmlFor="savings-alerts">Savings Goal Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when you're close to reaching your savings goals
              </p>
            </div>
            <Switch
              id="savings-alerts"
              checked={savingsAlerts}
              onCheckedChange={setSavingsAlerts}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/10">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">📱 Mobile App Coming Soon!</h3>
          <p className="text-sm text-muted-foreground">
            The full SMS auto-reading feature will be available in the mobile app version.
            It will automatically detect bank transaction SMS using AI and record them for you.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
