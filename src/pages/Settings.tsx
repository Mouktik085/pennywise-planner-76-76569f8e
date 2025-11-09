import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings as SettingsIcon, Bell, Shield, Palette, Database, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Settings = () => {
  const [smsSync, setSmsSync] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [categories, setCategories] = useState([
    { id: 1, name: "Food & Dining", icon: "🍔", type: "expense" },
    { id: 2, name: "Transport", icon: "🚗", type: "expense" },
    { id: 3, name: "Salary", icon: "💼", type: "income" },
  ]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Category added successfully!");
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

        {/* Budget Settings */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-xl">Budget Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure your monthly budget limits
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="monthly-budget">Monthly Budget Limit (₹)</Label>
                  <Input id="monthly-budget" type="number" defaultValue={50000} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="savings-goal">Monthly Savings Target (₹)</Label>
                  <Input id="savings-goal" type="number" defaultValue={15000} />
                </div>

                <Button className="w-full">Save Budget Settings</Button>
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
