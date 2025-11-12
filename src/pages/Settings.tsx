import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Bell, Shield, Palette, Database, Plus, Trash2, Moon, Sun, Check, X, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/contexts/PreferencesContext";
import { SMSPermissionHandler } from "@/components/SMSPermissionHandler";
import { useTheme } from "next-themes";
import { z } from "zod";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/lib/currencyFormatter";
import { SUPPORTED_LANGUAGES } from "@/lib/translations";
import { useTranslation } from "@/hooks/useTranslation";

interface Account {
  id: string;
  name: string;
  bank_name: string | null;
}

// Validation schemas
const phoneSchema = z.string()
  .regex(/^\+[1-9]\d{1,14}$/, {
    message: "Phone number must be in international format (e.g., +1234567890)"
  })
  .optional()
  .or(z.literal(''));

const settingsSchema = z.object({
  phoneNumber: phoneSchema,
});

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currency: prefCurrency, language: prefLanguage, setCurrency: updateCurrency, setLanguage: updateLanguage } = usePreferences();
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [smsSync, setSmsSync] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [currency, setCurrency] = useState(prefCurrency);
  const [language, setLanguage] = useState(prefLanguage);
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Notification settings
  const [notifBudgetAlerts, setNotifBudgetAlerts] = useState(true);
  const [notifTransactionReminders, setNotifTransactionReminders] = useState(true);
  const [notifSavingsMilestones, setNotifSavingsMilestones] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  
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
        setCurrency(data.preferred_currency || "INR");
        setLanguage(data.preferred_language || "en");
        setPhoneNumber(data.phone_number || "");
        setNotifBudgetAlerts(data.notification_budget_alerts ?? true);
        setNotifTransactionReminders(data.notification_transaction_reminders ?? true);
        setNotifSavingsMilestones(data.notification_savings_milestones ?? true);
        setEmailNotifications(data.email_notifications ?? true);
        setSmsNotifications(data.sms_notifications ?? false);
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

  const isValidPhone = (phone: string): boolean => {
    if (!phone || phone === '') return true; // Empty is valid
    return /^\+[1-9]\d{1,14}$/.test(phone);
  };

  const handleSaveSettings = async () => {
    try {
      // Validate phone number
      const validationResult = settingsSchema.safeParse({
        phoneNumber: phoneNumber,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors;
        if (errors.phoneNumber) {
          toast.error(errors.phoneNumber[0]);
          return;
        }
      }

      // Additional validations
      if (smsNotifications && !phoneNumber.trim()) {
        toast.error("Phone number is required for SMS notifications");
        return;
      }

      if (emailNotifications && !user?.email) {
        toast.error("Email address is required for email notifications");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim() || null,
          sms_auto_import: smsSync,
          default_account_id: selectedAccount || null,
          preferred_currency: currency,
          preferred_language: language,
          phone_number: phoneNumber.trim() || null,
          notification_budget_alerts: notifBudgetAlerts,
          notification_transaction_reminders: notifTransactionReminders,
          notification_savings_milestones: notifSavingsMilestones,
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
          security_app_lock: securityAppLock,
          security_hide_balance: securityHideBalance,
        })
        .eq("user_id", user?.id);

      if (error) throw error;
      
      // Update preferences context
      await updateCurrency(currency);
      await updateLanguage(language);
      
      toast.success("Settings saved successfully!");
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
          <h1 className="text-4xl font-bold text-foreground">{t('settings')}</h1>
          <p className="text-muted-foreground mt-1">{t('managePreferences')}</p>
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
                  <Label htmlFor="username">{t('displayName')}</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={t('enterYourName')}
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
                      {SUPPORTED_CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>
                          {getCurrencySymbol(curr)} {curr}
                        </option>
                      ))}
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
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <Button className="w-full" onClick={handleSaveSettings}>{t('saveProfile')}</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* SMS Auto-Import */}
        <SMSPermissionHandler />

        {/* Dark Mode Toggle */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              {theme === "dark" ? <Moon className="h-6 w-6 text-primary" /> : <Sun className="h-6 w-6 text-primary" />}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-xl">{t('darkMode')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('switchTheme')}
                </p>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label>{t('darkMode')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {theme === "dark" ? t('currentlyDark') : t('currentlyLight')}
                  </p>
                </div>
                <Switch 
                  checked={theme === "dark"} 
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                />
              </div>
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
                <h3 className="font-bold text-xl">{t('notifications')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('notificationPreferences')}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>{t('emailFromAccount')}</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-input">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1">{user?.email || t('noEmail')}</span>
                    {user?.email && (
                      <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-600 border-green-500/20">
                        {t('verified')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('emailWillBeSent')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('phoneForSMS')}</Label>
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`pr-10 ${
                        phoneNumber && !isValidPhone(phoneNumber) 
                          ? 'border-red-500 focus-visible:ring-red-500' 
                          : phoneNumber && isValidPhone(phoneNumber)
                          ? 'border-green-500 focus-visible:ring-green-500'
                          : ''
                      }`}
                    />
                    {phoneNumber && isValidPhone(phoneNumber) && (
                      <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                    {phoneNumber && !isValidPhone(phoneNumber) && (
                      <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format: +[country code][number] (e.g., +12025550123 for US, +919876543210 for India)
                  </p>
                  {phoneNumber && !isValidPhone(phoneNumber) && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      Invalid phone number format. Must start with + followed by country code and number (no spaces or dashes).
                    </p>
                  )}
                  {phoneNumber && isValidPhone(phoneNumber) && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Valid international phone number format
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>{t('emailNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('receiveEmail')}</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>{t('smsNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('receiveSMS')}</p>
                  </div>
                  <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                </div>

                <Separator className="my-2" />

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>{t('budgetAlertsNotif')}</Label>
                    <p className="text-sm text-muted-foreground">{t('budgetAlertsDesc')}</p>
                  </div>
                  <Switch checked={notifBudgetAlerts} onCheckedChange={setNotifBudgetAlerts} />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>{t('transactionReminders')}</Label>
                    <p className="text-sm text-muted-foreground">{t('transactionRemindersDesc')}</p>
                  </div>
                  <Switch checked={notifTransactionReminders} onCheckedChange={setNotifTransactionReminders} />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label>{t('savingsMilestones')}</Label>
                    <p className="text-sm text-muted-foreground">{t('savingsMilestonesDesc')}</p>
                  </div>
                  <Switch checked={notifSavingsMilestones} onCheckedChange={setNotifSavingsMilestones} />
                </div>
                
                <Button className="w-full" onClick={handleSaveSettings}>{t('saveNotificationSettings')}</Button>
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
