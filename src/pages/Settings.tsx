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

interface Account {
  id: string;
  name: string;
  bank_name: string | null;
}

const Settings = () => {
  const { user } = useAuth();
  const [smsSync, setSmsSync] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
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
        .single();

      if (error) throw error;
      if (data) {
        setSmsSync(data.sms_auto_import || false);
        setSelectedAccount(data.default_account_id || "");
        setPrimaryColor(data.theme_primary_color || "#8B5CF6");
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
          sms_auto_import: smsSync,
          default_account_id: selectedAccount || null,
          theme_primary_color: primaryColor,
        })
        .eq("user_id", user?.id);

      if (error) throw error;
      toast.success("Settings saved successfully!");
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

        {/* SMS Auto-Import */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-xl">SMS Auto-Import</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically read and import transactions from SMS (UPI, bank, card payments)
                </p>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="sms-sync">Enable SMS Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Requires SMS permission on mobile device
                  </p>
                </div>
                <Switch
                  id="sms-sync"
                  checked={smsSync}
                  onCheckedChange={(checked) => {
                    setSmsSync(checked);
                    if (checked) {
                      toast.info("SMS sync enabled. Grant permission when prompted.");
                    } else {
                      toast.info("SMS sync disabled");
                    }
                  }}
                />
              </div>

              {smsSync && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm font-semibold text-primary mb-2">📱 Setup Required</p>
                  <p className="text-sm text-muted-foreground">
                    To enable auto-import, you'll need to:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                    <li>Grant SMS read permission</li>
                    <li>Allow the app to run in background</li>
                    <li>Configure trusted sender patterns</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>

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
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Transaction Reminders</Label>
                    <p className="text-sm text-muted-foreground">Remind to log daily expenses</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Savings Milestones</Label>
                    <p className="text-sm text-muted-foreground">Celebrate when you reach savings goals</p>
                  </div>
                  <Switch defaultChecked />
                </div>
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

                <Button className="w-full">Apply Theme</Button>
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
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Hide Balance</Label>
                    <p className="text-sm text-muted-foreground">Hide amounts on home screen</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
