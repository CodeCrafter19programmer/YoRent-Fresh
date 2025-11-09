import { supabase } from '@/integrations/supabase/client';
import { addDays, isBefore, isAfter } from 'date-fns';

interface PaymentNotificationData {
  tenant_id: string;
  user_id: string;
  amount: number;
  due_date: string;
  month: string;
  tenant_name: string;
}

export class NotificationService {
  // Check for upcoming payment deadlines and send notifications
  static async checkPaymentDeadlines() {
    try {
      const today = new Date();
      const sevenDaysFromNow = addDays(today, 7);
      const threeDaysFromNow = addDays(today, 3);
      const oneDayFromNow = addDays(today, 1);

      // Get unpaid payments with upcoming due dates
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          id,
          tenant_id,
          amount,
          due_date,
          month,
          tenants:tenant_id (
            user_id,
            full_name
          )
        `)
        .eq('status', 'unpaid')
        .gte('due_date', today.toISOString().split('T')[0])
        .lte('due_date', sevenDaysFromNow.toISOString().split('T')[0]);

      if (error) throw error;

      for (const payment of payments || []) {
        const dueDate = new Date(payment.due_date);
        const tenant = payment.tenants;
        
        if (!tenant?.user_id) continue;

        let notificationTitle = '';
        let notificationMessage = '';
        let notificationType = '';

        // Determine notification type based on days until due
        if (isBefore(dueDate, oneDayFromNow)) {
          notificationTitle = 'Payment Due Tomorrow!';
          notificationMessage = `Your rent payment of $${payment.amount} for ${payment.month} is due tomorrow. Please make your payment to avoid late fees.`;
          notificationType = 'payment_due_tomorrow';
        } else if (isBefore(dueDate, threeDaysFromNow)) {
          notificationTitle = 'Payment Due in 3 Days';
          notificationMessage = `Your rent payment of $${payment.amount} for ${payment.month} is due in 3 days. Please prepare your payment.`;
          notificationType = 'payment_due_3_days';
        } else if (isBefore(dueDate, sevenDaysFromNow)) {
          notificationTitle = 'Payment Due in 7 Days';
          notificationMessage = `Your rent payment of $${payment.amount} for ${payment.month} is due in 7 days. This is a friendly reminder.`;
          notificationType = 'payment_due_7_days';
        }

        if (notificationTitle) {
          // Check if we already sent this type of notification for this payment
          const { data: existingNotification } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', tenant.user_id)
            .eq('type', notificationType)
            .ilike('message', `%${payment.month}%`)
            .single();

          if (!existingNotification) {
            // Send notification
            await supabase
              .from('notifications')
              .insert({
                user_id: tenant.user_id,
                title: notificationTitle,
                message: notificationMessage,
                type: notificationType
              });
          }
        }
      }
    } catch (error) {
      console.error('Error checking payment deadlines:', error);
    }
  }

  // Check for overdue payments and send notifications
  static async checkOverduePayments() {
    try {
      const today = new Date();

      // Get overdue payments
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          id,
          tenant_id,
          amount,
          due_date,
          month,
          tenants:tenant_id (
            user_id,
            full_name
          )
        `)
        .eq('status', 'unpaid')
        .lt('due_date', today.toISOString().split('T')[0]);

      if (error) throw error;

      for (const payment of payments || []) {
        const tenant = payment.tenants;
        
        if (!tenant?.user_id) continue;

        // Update payment status to overdue
        await supabase
          .from('payments')
          .update({ status: 'overdue' })
          .eq('id', payment.id);

        // Check if we already sent overdue notification for this payment
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', tenant.user_id)
          .eq('type', 'payment_overdue')
          .ilike('message', `%${payment.month}%`)
          .single();

        if (!existingNotification) {
          // Send overdue notification
          await supabase
            .from('notifications')
            .insert({
              user_id: tenant.user_id,
              title: 'Payment Overdue',
              message: `Your rent payment of $${payment.amount} for ${payment.month} is now overdue. Please contact your landlord immediately.`,
              type: 'payment_overdue'
            });
        }
      }
    } catch (error) {
      console.error('Error checking overdue payments:', error);
    }
  }

  // Send payment confirmation notification
  static async sendPaymentConfirmation(paymentId: string) {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .select(`
          amount,
          month,
          tenants:tenant_id (
            user_id,
            full_name
          )
        `)
        .eq('id', paymentId)
        .single();

      if (error) throw error;

      const tenant = payment.tenants;
      if (!tenant?.user_id) return;

      await supabase
        .from('notifications')
        .insert({
          user_id: tenant.user_id,
          title: 'Payment Confirmed',
          message: `Your payment of $${payment.amount} for ${payment.month} has been successfully processed. Thank you!`,
          type: 'payment_confirmed'
        });
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
    }
  }

  // Initialize notification checking (would typically be called by a cron job)
  static async initializeNotificationChecking() {
    // Check immediately
    await this.checkPaymentDeadlines();
    await this.checkOverduePayments();

    // Set up periodic checking (every hour)
    setInterval(async () => {
      await this.checkPaymentDeadlines();
      await this.checkOverduePayments();
    }, 60 * 60 * 1000); // 1 hour
  }
}

export default NotificationService;
