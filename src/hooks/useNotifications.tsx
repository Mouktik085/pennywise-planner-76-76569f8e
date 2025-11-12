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
          .select('notification_budget_alerts, notification_transaction_reminders, notification_savings_milestones, reminder_days_before, last_notification_check')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile) return;

        // Check if we already checked today
        const lastCheck = profile.last_notification_check ? new Date(profile.last_notification_check) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (lastCheck) {
          lastCheck.setHours(0, 0, 0, 0);
          if (lastCheck.getTime() === today.getTime()) {
            console.log('Notifications already checked today');
            return; // Already checked today, skip
          }
        }

        const settings: NotificationSettings = {
          notification_budget_alerts: profile.notification_budget_alerts ?? true,
          notification_transaction_reminders: profile.notification_transaction_reminders ?? true,
          notification_savings_milestones: profile.notification_savings_milestones ?? true,
          reminder_days_before: profile.reminder_days_before || 2
        };

        // Check budget alerts (once per day)
        if (settings.notification_budget_alerts) {
          await checkBudgetAlerts();
        }

        // Check upcoming transactions (once per day)
        if (settings.notification_transaction_reminders) {
          await checkUpcomingTransactions(settings.reminder_days_before);
        }

        // Check savings goals (once per day)
        if (settings.notification_savings_milestones) {
          await checkSavingsGoals();
        }

        // Check credit card dues (once per day)
        await checkCreditCardDues();

        // Update last check time
        await supabase
          .from('profiles')
          .update({ last_notification_check: new Date().toISOString() })
          .eq('user_id', user.id);

      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    // Check immediately
    checkNotifications();

    // Check once per day (every 24 hours)
    const interval = setInterval(checkNotifications, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const sendMultiChannelNotification = async (
    type: 'budget_alert' | 'transaction_reminder' | 'savings_milestone' | 'credit_card_due',
    data: any
  ) => {
    // Fetch user profile with notification preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_notifications, sms_notifications, phone_number')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (!profile) return;

    // Email notification
    if (profile.email_notifications && user?.email) {
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            to: user.email,
            subject: getEmailSubject(type),
            type,
            data
          }
        });
        console.log('Email notification sent:', type);
        // Add delay to avoid rate limiting (Resend free: 2 req/sec)
        await new Promise(resolve => setTimeout(resolve, 600));
      } catch (error) {
        console.error('Error sending email notification:', error);
      }
    }

    // SMS notification
    if (profile.sms_notifications && profile.phone_number) {
      try {
        await supabase.functions.invoke('send-notification-sms', {
          body: {
            to: profile.phone_number,
            type,
            data
          }
        });
        console.log('SMS notification sent:', type);
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 600));
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
        
        // Send email and SMS notifications
        await sendMultiChannelNotification('budget_alert', {
          spent: budget.current_spent,
          limit: budget.monthly_limit
        });
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
            
            // Send email and SMS notifications
            await sendMultiChannelNotification('budget_alert', {
              spent: catBudget.spent_amount,
              limit: catBudget.allocated_amount,
              category: catBudget.category
            });
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
          
          // Send email and SMS notifications
          await sendMultiChannelNotification('transaction_reminder', {
            description: transaction.description || transaction.category,
            amount: transaction.amount,
            dueDate: transaction.date
          });
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
            
            // Send email and SMS notifications
            await sendMultiChannelNotification('savings_milestone', {
              goalName: goal.name,
              currentAmount: goal.current_amount || 0,
              targetAmount: goal.target_amount
            });
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
            
            // Send email and SMS notifications
            const today = new Date();
            const dueDate = new Date(today.getFullYear(), today.getMonth(), card.due_date);
            await sendMultiChannelNotification('credit_card_due', {
              amount: card.credit_used,
              dueDate: dueDate.toLocaleDateString()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking credit card dues:', error);
    }
  };
};