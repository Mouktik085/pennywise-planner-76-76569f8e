import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Plus, Target, TrendingUp, Calendar, Trash2, Edit, PiggyBank } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CurrencyAmount } from "@/components/CurrencyAmount";
import { useTranslation } from "@/hooks/useTranslation";

const emojiList = [
  "🎯", "💰", "🏠", "🚗", "✈️", "🎓", "💍", "🎉", "🏖️", "🎮",
  "📱", "💻", "🎸", "📚", "🏋️", "🎨", "🍕", "☕", "🌟", "💎",
  "🎁", "🛍️", "🎭", "🏆", "🌈", "🔥", "⚡", "🌸", "🎪", "🚀",
  "🏡", "🌴", "🎯", "🏖", "🎊", "🎀", "🌺", "🎵", "🎬", "📷"
];

interface SavingsGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  icon?: string;
}

const Savings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [addMoneyDialog, setAddMoneyDialog] = useState<SavingsGoal | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target_amount: 0,
    current_amount: 0,
    deadline: "",
    icon: "🎯",
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGoal) {
        const { error } = await supabase
          .from("savings_goals")
          .update({
            ...formData,
            deadline: formData.deadline || null,
          })
          .eq("id", editingGoal.id);

        if (error) throw error;
        toast({ title: "Goal updated successfully" });
      } else {
        const { error } = await supabase
          .from("savings_goals")
          .insert([{
            ...formData,
            deadline: formData.deadline || null,
            user_id: user?.id
          }]);

        if (error) throw error;
        toast({ title: "Goal created successfully" });
      }

      setDialogOpen(false);
      setEditingGoal(null);
      setFormData({ name: "", description: "", target_amount: 0, current_amount: 0, deadline: "", icon: "🎯" });
      fetchGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddMoney = async () => {
    if (!addMoneyDialog) return;
    const amount = parseFloat(addAmount);
    if (amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("savings_goals")
        .update({ current_amount: addMoneyDialog.current_amount + amount })
        .eq("id", addMoneyDialog.id);

      if (error) throw error;
      toast({ title: "Money added successfully" });
      setAddMoneyDialog(null);
      setAddAmount("");
      fetchGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Goal deleted successfully" });
      fetchGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalSaved = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('savingsGoals')}</h1>
          <p className="text-muted-foreground">{t('trackFinancialTargets')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingGoal(null)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('addGoal')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? t('editGoal') : t('createNewGoal')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('icon')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full text-3xl h-16">
                      {formData.icon}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid grid-cols-8 gap-2">
                      {emojiList.map((emoji) => (
                        <Button
                          key={emoji}
                          type="button"
                          variant="ghost"
                          className="text-2xl h-12 w-12 p-0"
                          onClick={() => setFormData({ ...formData, icon: emoji })}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>{t('goalName')}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Emergency Fund"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this goal for?"
                />
              </div>
              <div className="space-y-2">
                <Label>Target Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="100000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Current Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline (Optional)</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingGoal ? t('update') : t('create')} {t('savingsGoals').slice(0, -1)}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyAmount amount={totalSaved} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyAmount amount={totalTarget} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">No savings goals yet</p>
            <Button onClick={() => setDialogOpen(true)}>Create your first goal</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            return (
              <Card key={goal.id} className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="text-6xl p-4 bg-primary/10 rounded-3xl">{goal.icon || "🎯"}</div>
                    <span className="text-2xl">{goal.name}</span>
                  </CardTitle>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Progress</span>
                      <span className="text-primary">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-savings"><CurrencyAmount amount={goal.current_amount} /></span>
                      <span className="text-muted-foreground"><CurrencyAmount amount={goal.target_amount} /></span>
                    </div>
                  </div>
                  {goal.deadline && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="lg"
                      variant="default"
                      className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl"
                      onClick={() => setAddMoneyDialog(goal)}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      {t('addMoney')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingGoal(goal);
                        setFormData({
                          name: goal.name,
                          description: goal.description || "",
                          target_amount: goal.target_amount,
                          current_amount: goal.current_amount,
                          deadline: goal.deadline || "",
                          icon: goal.icon || "🎯",
                        });
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!addMoneyDialog} onOpenChange={() => setAddMoneyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Money to {addMoneyDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="1000"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddMoney} className="flex-1">
                Add Money
              </Button>
              <Button variant="outline" onClick={() => setAddMoneyDialog(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Savings;
