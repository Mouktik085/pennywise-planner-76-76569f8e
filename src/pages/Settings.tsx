import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings as SettingsIcon, Bell, Shield, Palette, Database, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SMSPermissionHandler } from "@/components/SMSPermissionHandler";

interface Account {
  id: string;
  name: string;
  bank_name: string | null;
}

const Settings = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [smsSync, setSmsSync] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [currency, setCurrency] = useState("INR");
  const [language, setLanguage] = useState("en");
  
  // Notification settings
  const [notifBudgetAlerts, setNotifBudgetAlerts] = useState(true);
  const [notifTransactionReminders, setNotifTransactionReminders] = useState(true);
  const [notifSavingsMilestones, setNotifSavingsMilestones] = useState(true);
  
  // Security settings
  const [securityAppLock, setSecurityAppLock] = useState(false);
  const [securityHideBalance, setSecurityHideBalance] = useState(false);
  
  const [categories, setCategories] = useState([
    { id: 1, name: "Food & Dining", icon: "🍔", type: "expense" },
    { id: 2, name: "Transport", icon: "🚗", type: "expense" },
    { id: 3, name: "Salary", icon: "💼", type: "income" },
  ]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchSettings();
    }
  }, [user]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name, bank_name")
        .eq("user_id", user?.id);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUsername(data.username || "");
        setSmsSync(data.sms_auto_import || false);
        setSelectedAccount(data.default_account_id || "");
        setPrimaryColor(data.theme_primary_color || "#8B5CF6");
        setCurrency(data.preferred_currency || "INR");
        setLanguage(data.preferred_language || "en");
        setNotifBudgetAlerts(data.notification_budget_alerts ?? true);
        setNotifTransactionReminders(data.notification_transaction_reminders ?? true);
        setNotifSavingsMilestones(data.notification_savings_milestones ?? true);
        setSecurityAppLock(data.security_app_lock || false);
        setSecurityHideBalance(data.security_hide_balance || false);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Category added successfully!");
  };

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim() || null,
          sms_auto_import: smsSync,
          default_account_id: selectedAccount || null,
          theme_primary_color: primaryColor,
          preferred_currency: currency,
          preferred_language: language,
          notification_budget_alerts: notifBudgetAlerts,
          notification_transaction_reminders: notifTransactionReminders,
          notification_savings_milestones: notifSavingsMilestones,
          security_app_lock: securityAppLock,
          security_hide_balance: securityHideBalance,
        })
        .eq("user_id", user?.id);

      if (error) throw error;
      toast.success("Settings saved successfully! Refresh the page to see changes.");
      // Refresh settings to show saved values
      await fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your app preferences</p>
        </div>

        {/* Profile Settings */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-xl">Profile</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Update your personal information
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="username">Display Name</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background"
                    >
                      <option value="INR">₹ Indian Rupee (INR)</option>
                      <option value="USD">$ US Dollar (USD)</option>
                      <option value="EUR">€ Euro (EUR)</option>
                      <option value="GBP">£ British Pound (GBP)</option>
                      <option value="JPY">¥ Japanese Yen (JPY)</option>
                      <option value="PLN">zł Polish Zloty (PLN)</option>
                      <option value="AUD">A$ Australian Dollar (AUD)</option>
                      <option value="CAD">C$ Canadian Dollar (CAD)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="fr">Français (French)</option>
                      <option value="de">Deutsch (German)</option>
                      <option value="zh">中文 (Chinese)</option>
                      <option value="ja">日本語 (Japanese)</option>
                      <option value="pt">Português (Portuguese)</option>
                    </select>
                  </div>
                </div>
                
                <Button className="w-full" onClick={handleSaveSettings}>Save Profile</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* SMS Auto-Import */}
        <SMSPermissionHandler />

        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-xl">Notifications</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your notification preferences
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Budget Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when approaching budget limits</p>
                  </div>
                  <Switch checked={notifBudgetAlerts} onCheckedChange={setNotifBudgetAlerts} />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Transaction Reminders</Label>
                    <p className="text-sm text-muted-foreground">Remind to log daily expenses</p>
                  </div>
                  <Switch checked={notifTransactionReminders} onCheckedChange={setNotifTransactionReminders} />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Savings Milestones</Label>
                    <p className="text-sm text-muted-foreground">Celebrate when you reach savings goals</p>
                  </div>
                  <Switch checked={notifSavingsMilestones} onCheckedChange={setNotifSavingsMilestones} />
                </div>
                
                <Button className="w-full" onClick={handleSaveSettings}>Save Notification Settings</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Categories Management */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl">Categories</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customize your transaction categories
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cat-name">Category Name</Label>
                        <Input id="cat-name" placeholder="e.g., Pet Care" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cat-icon">Icon/Emoji</Label>
                        <Input id="cat-icon" placeholder="🐾" maxLength={2} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cat-type">Type</Label>
                        <select
                          id="cat-type"
                          className="w-full px-3 py-2 rounded-md border border-input bg-background"
                          required
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                      </div>
                      <Button type="submit" className="w-full">Add Category</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <p className="font-semibold">{category.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{category.type}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Theme Customization */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-xl">Theme & Appearance</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Customize the look and feel of your app
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <Input 
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-12 w-24" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Background Style</Label>
                  <select className="w-full px-3 py-2 rounded-md border border-input bg-background">
                    <option value="ocean">Ocean (Default)</option>
                    <option value="minimal">Minimal White</option>
                    <option value="dark">Dark Mode</option>
                    <option value="sunset">Sunset</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Auto Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Switch theme based on time</p>
                  </div>
                  <Switch />
                </div>

                <Button className="w-full" onClick={handleSaveSettings}>Apply Theme</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Default Account */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-xl">Transaction Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Set your preferred defaults
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Default Account</Label>
                  <select 
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                  >
                    <option value="">Select default account for transactions</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} {account.bank_name ? `(${account.bank_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <Button className="w-full" onClick={handleSaveSettings}>Save Settings</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-xl">Security</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Protect your financial data
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>App Lock</Label>
                    <p className="text-sm text-muted-foreground">Require PIN/biometric to open app</p>
                  </div>
                  <Switch 
                    checked={securityAppLock} 
                    onCheckedChange={(checked) => {
                      setSecurityAppLock(checked);
                      toast.success(checked ? "App Lock enabled" : "App Lock disabled");
                    }} 
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Hide Balance</Label>
                    <p className="text-sm text-muted-foreground">Hide amounts on home screen</p>
                  </div>
                  <Switch 
                    checked={securityHideBalance} 
                    onCheckedChange={(checked) => {
                      setSecurityHideBalance(checked);
                      toast.success(checked ? "Balance will be hidden" : "Balance will be visible");
                    }} 
                  />
                </div>
                
                <Button className="w-full" onClick={handleSaveSettings}>Save Security Settings</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
