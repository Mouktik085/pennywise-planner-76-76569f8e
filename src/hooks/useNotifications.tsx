import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/lib/notificationService';

interface NotificationSettings {
  notification_budget_alerts: boolean;
  notification_transaction_reminders: boolean;
  notification_savings_milestones: boolean;
  reminder_days_before: number;
  email_notifications: boolean;
  sms_notifications: boolean;
  phone_number: string | null;
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
          .select('notification_budget_alerts, notification_transaction_reminders, notification_savings_milestones, reminder_days_before, email_notifications, sms_notifications, phone_number')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile) return;

        const settings: NotificationSettings = {
          notification_budget_alerts: profile.notification_budget_alerts ?? true,
          notification_transaction_reminders: profile.notification_transaction_reminders ?? true,
          notification_savings_milestones: profile.notification_savings_milestones ?? true,
          reminder_days_before: profile.reminder_days_before || 2,
          email_notifications: profile.email_notifications ?? true,
          sms_notifications: profile.sms_notifications ?? false,
          phone_number: profile.phone_number
        };

        // Check budget alerts
        if (settings.notification_budget_alerts) {
          await checkBudgetAlerts(settings);
        }

        // Check upcoming transactions
        if (settings.notification_transaction_reminders) {
          await checkUpcomingTransactions(settings.reminder_days_before, settings);
        }

        // Check savings goals
        if (settings.notification_savings_milestones) {
          await checkSavingsGoals(settings);
        }

        // Check credit card dues
        await checkCreditCardDues(settings);

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

  const sendMultiChannelNotification = async (
    type: 'budget_alert' | 'transaction_reminder' | 'savings_milestone' | 'credit_card_due',
    data: any,
    settings: NotificationSettings
  ) => {
    // Email notification
    if (settings.email_notifications && user?.email) {
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            to: user.email,
            subject: getEmailSubject(type),
            type,
            data
          }
        });
      } catch (error) {
        console.error('Error sending email notification:', error);
      }
    }

    // SMS notification
    if (settings.sms_notifications && settings.phone_number) {
      try {
        await supabase.functions.invoke('send-notification-sms', {
          body: {
            to: settings.phone_number,
            type,
            data
          }
        });
      } catch (error) {
        console.error('Error sending SMS notification:', error);
      }
    }
  };

  const getEmailSubject = (type: string): string => {
    switch (type) {
      case 'budget_alert': return 'Budget Alert';
      case 'transaction_reminder': return 'Transaction Reminder';
      case 'savings_milestone': return 'Savings Milestone Reached!';
      case 'credit_card_due': return 'Credit Card Payment Due';
      default: return 'Notification';
    }
  };

  const checkBudgetAlerts = async (settings: NotificationSettings) => {
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
        
        // Send multi-channel notification
        await sendMultiChannelNotification('budget_alert', {
          spent: budget.current_spent,
          limit: budget.monthly_limit,
          category: 'Overall'
        }, settings);
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
            
            // Send multi-channel notification
            await sendMultiChannelNotification('budget_alert', {
              spent: catBudget.spent_amount,
              limit: catBudget.allocated_amount,
              category: catBudget.category
            }, settings);
          }
        }
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  };

  const checkUpcomingTransactions = async (daysBefore: number, settings: NotificationSettings) => {
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
          
          // Send multi-channel notification
          await sendMultiChannelNotification('transaction_reminder', {
            description: transaction.description || transaction.category,
            amount: transaction.amount,
            dueDate: transDate.toLocaleDateString()
          }, settings);
        }
      }
    } catch (error) {
      console.error('Error checking upcoming transactions:', error);
    }
  };

  const checkSavingsGoals = async (settings: NotificationSettings) => {
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
            
            // Send multi-channel notification
            await sendMultiChannelNotification('savings_milestone', {
              goalName: goal.name,
              currentAmount: goal.current_amount || 0,
              targetAmount: goal.target_amount
            }, settings);
          }
        }
      }
    } catch (error) {
      console.error('Error checking savings goals:', error);
    }
  };

  const checkCreditCardDues = async (settings: NotificationSettings) => {
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
            
            // Send multi-channel notification
            const today = new Date();
            const dueDate = new Date(today.getFullYear(), today.getMonth(), card.due_date);
            await sendMultiChannelNotification('credit_card_due', {
              amount: card.credit_used,
              dueDate: dueDate.toLocaleDateString()
            }, settings);
          }
        }
      }
    } catch (error) {
      console.error('Error checking credit card dues:', error);
    }
  };
};
