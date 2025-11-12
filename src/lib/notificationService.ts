export class NotificationService {
  private static instance: NotificationService;
  
  private constructor() {}
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }
  
  async sendNotification(title: string, options?: NotificationOptions) {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } else if (Notification.permission !== 'denied') {
      const permission = await this.requestPermission();
      if (permission) {
        this.sendNotification(title, options);
      }
    }
  }
  
  async sendBudgetAlert(spent: number, limit: number, category?: string) {
    const percentage = (spent / limit) * 100;
    const categoryText = category ? ` for ${category}` : '';
    
    if (percentage >= 90) {
      await this.sendNotification(
        '⚠️ Budget Alert!',
        {
          body: `You've spent ${percentage.toFixed(0)}% of your budget${categoryText}. You've used ₹${spent.toLocaleString()} of ₹${limit.toLocaleString()}.`,
          tag: `budget-alert-${category || 'main'}`,
          requireInteraction: true
        }
      );
    } else if (percentage >= 75) {
      await this.sendNotification(
        '💡 Budget Warning',
        {
          body: `You've spent ${percentage.toFixed(0)}% of your budget${categoryText}. Consider tracking your expenses closely.`,
          tag: `budget-warning-${category || 'main'}`
        }
      );
    }
  }
  
  async sendTransactionReminder(description: string, amount: number, daysUntil: number) {
    await this.sendNotification(
      '📅 Upcoming Transaction',
      {
        body: `${description} (₹${amount.toLocaleString()}) is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
        tag: 'transaction-reminder'
      }
    );
  }
  
  async sendSavingsGoalAlert(goalName: string, currentAmount: number, targetAmount: number) {
    const percentage = (currentAmount / targetAmount) * 100;
    
    if (percentage >= 100) {
      await this.sendNotification(
        '🎉 Goal Achieved!',
        {
          body: `Congratulations! You've reached your savings goal: ${goalName}`,
          tag: `savings-goal-${goalName}`,
          requireInteraction: true
        }
      );
    } else if (percentage >= 75) {
      await this.sendNotification(
        '🎯 Almost There!',
        {
          body: `You're ${percentage.toFixed(0)}% towards your goal: ${goalName}. Keep it up!`,
          tag: `savings-progress-${goalName}`
        }
      );
    }
  }
  
  async sendCreditCardDueAlert(cardName: string, dueAmount: number, dueDate: number) {
    const today = new Date().getDate();
    const daysUntil = dueDate >= today ? dueDate - today : (30 - today) + dueDate;
    
    if (daysUntil <= 3 && daysUntil >= 0) {
      await this.sendNotification(
        '💳 Credit Card Payment Due!',
        {
          body: `${cardName}: Pay ₹${dueAmount.toLocaleString()} by the ${dueDate}th (${daysUntil} day${daysUntil !== 1 ? 's' : ''} left)`,
          tag: `credit-due-${cardName}`,
          requireInteraction: true
        }
      );
    }
  }
}

export const notificationService = NotificationService.getInstance();
