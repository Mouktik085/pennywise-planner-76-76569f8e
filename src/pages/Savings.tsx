import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PiggyBank, Plus, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const Savings = () => {
  const [open, setOpen] = useState(false);

  const savingsGoals = [
    {
      id: 1,
      name: "Emergency Fund",
      description: "Save for unexpected expenses and emergencies",
      target: 100000,
      current: 45000,
      icon: "🚨",
    },
    {
      id: 2,
      name: "Vacation to Bali",
      description: "Dream vacation with family",
      target: 150000,
      current: 80000,
      icon: "✈️",
    },
    {
      id: 3,
      name: "New Laptop",
      description: "MacBook Pro for work",
      target: 120000,
      current: 95000,
      icon: "💻",
    },
  ];

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Savings goal added successfully!");
    setOpen(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Savings Goals</h1>
            <p className="text-muted-foreground mt-1">Track and achieve your financial goals</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Savings Goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-name">Goal Name</Label>
                  <Input id="goal-name" placeholder="e.g., New Car" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-icon">Icon/Emoji</Label>
                  <Input id="goal-icon" placeholder="🚗" maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-target">Target Amount (₹)</Label>
                  <Input id="goal-target" type="number" placeholder="500000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-current">Current Amount (₹)</Label>
                  <Input id="goal-current" type="number" placeholder="0" defaultValue={0} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-description">Description</Label>
                  <Textarea id="goal-description" placeholder="Describe your goal..." rows={3} />
                </div>
                <Button type="submit" className="w-full">Create Goal</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-savings to-savings/80 text-savings-foreground border-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <PiggyBank className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Total Saved</p>
                <h3 className="text-2xl font-bold">₹220,000</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Total Target</p>
                <h3 className="text-2xl font-bold">₹370,000</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-income to-income/80 text-income-foreground border-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Progress</p>
                <h3 className="text-2xl font-bold">59%</h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Savings Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savingsGoals.map((goal) => {
            const progress = (goal.current / goal.target) * 100;
            return (
              <Card key={goal.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{goal.icon}</span>
                    <div>
                      <h3 className="font-bold text-xl">{goal.name}</h3>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <p className="text-2xl font-bold text-savings">₹{goal.current.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">of ₹{goal.target.toLocaleString()}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Add Money
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground pt-2">
                    ₹{(goal.target - goal.current).toLocaleString()} remaining
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Tips Card */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-savings/10 border-primary/20">
          <h3 className="font-bold text-lg mb-2">💡 Savings Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Set up automatic transfers to your savings goals</li>
            <li>• Review and adjust your goals monthly</li>
            <li>• Celebrate small milestones along the way</li>
            <li>• Consider setting up multiple goals for different purposes</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Savings;
