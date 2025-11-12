import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/lib/notificationService';

interface NotificationSettings {
  notification_budget_alerts: boolean;
  notification_transaction_reminders: boolean;
  notification_savings_milestones: boolean;
  reminder_days_before: number;
}

export const useNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkNotifications = async () => {
      try {
        // Fetch user's notification settings
        const { data: profile } = await supabase
          .from('profiles')
          .select('notification_budget_alerts, notification_transaction_reminders, notification_savings_milestones, reminder_days_before')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile) return;

        const settings: NotificationSettings = {
          notification_budget_alerts: profile.notification_budget_alerts ?? true,
          notification_transaction_reminders: profile.notification_transaction_reminders ?? true,
          notification_savings_milestones: profile.notification_savings_milestones ?? true,
          reminder_days_before: profile.reminder_days_before || 2
        };

        // Check budget alerts
        if (settings.notification_budget_alerts) {
          await checkBudgetAlerts();
        }

        // Check upcoming transactions
        if (settings.notification_transaction_reminders) {
          await checkUpcomingTransactions(settings.reminder_days_before);
        }

        // Check savings goals
        if (settings.notification_savings_milestones) {
          await checkSavingsGoals();
        }

        // Check credit card dues
        await checkCreditCardDues();

      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    // Check immediately
    checkNotifications();

    // Check every 30 minutes
    const interval = setInterval(checkNotifications, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const checkBudgetAlerts = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data: budget } = await supabase
        .from('budget')
        .select('*')
        .eq('user_id', user?.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();

      if (budget && budget.monthly_limit > 0) {
        await notificationService.sendBudgetAlert(
          budget.current_spent,
          budget.monthly_limit
        );
      }

      // Check category budgets
      const { data: categoryBudgets } = await supabase
        .from('category_budgets')
        .select('*')
        .eq('user_id', user?.id)
        .eq('month', currentMonth)
        .eq('year', currentYear);

      if (categoryBudgets) {
        for (const catBudget of categoryBudgets) {
          if (catBudget.allocated_amount > 0) {
            await notificationService.sendBudgetAlert(
              catBudget.spent_amount,
              catBudget.allocated_amount,
              catBudget.category
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  };

  const checkUpcomingTransactions = async (daysBefore: number) => {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysBefore);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_recurring', true)
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', futureDate.toISOString().split('T')[0]);

      if (transactions && transactions.length > 0) {
        for (const transaction of transactions) {
          const transDate = new Date(transaction.date);
          const daysUntil = Math.ceil((transDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          await notificationService.sendTransactionReminder(
            transaction.description || transaction.category,
            transaction.amount,
            daysUntil
          );
        }
      }
    } catch (error) {
      console.error('Error checking upcoming transactions:', error);
    }
  };

  const checkSavingsGoals = async () => {
    try {
      const { data: goals } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user?.id);

      if (goals) {
        for (const goal of goals) {
          if (goal.target_amount > 0) {
            await notificationService.sendSavingsGoalAlert(
              goal.name,
              goal.current_amount || 0,
              goal.target_amount
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking savings goals:', error);
    }
  };

  const checkCreditCardDues = async () => {
    try {
      const { data: creditCards } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_credit_card', true);

      if (creditCards) {
        for (const card of creditCards) {
          if (card.due_date && card.credit_used && card.credit_used > 0) {
            await notificationService.sendCreditCardDueAlert(
              card.name,
              card.credit_used,
              card.due_date
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking credit card dues:', error);
    }
  };
};
