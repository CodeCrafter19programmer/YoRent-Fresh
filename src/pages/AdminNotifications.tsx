import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Plus, Send, Users, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  tenant_name?: string;
  property_name?: string;
  amount?: number;
  due_date?: string;
  created_at: string;
}

interface Tenant {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  property: {
    name: string;
  };
}

const AdminNotifications = () => {
  const { userRole } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    recipient: 'all',
    tenant_id: '',
    title: '',
    message: '',
    type: 'general'
  });

  useEffect(() => {
    if (userRole === 'admin') {
      fetchAdminNotifications();
      fetchTenants();
      
      // Subscribe to real-time updates
      const subscription = supabase
        .channel('admin-notifications')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'payments' },
          handlePaymentChange
        )
        .subscribe();

      return () => subscription.unsubscribe();
    }
  }, [userRole]);

  const fetchAdminNotifications = async () => {
    try {
      // Get payment-related notifications
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          month,
          due_date,
          status,
          created_at,
          tenants:tenant_id (
            full_name
          ),
          properties:property_id (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (paymentsError) throw paymentsError;

      // Transform payments into notification format
      const paymentNotifications: AdminNotification[] = payments.map(payment => {
        let type = 'payment_created';
        let title = 'New Payment Record';
        let message = `Payment record created for ${payment.tenants?.full_name}`;

        if (payment.status === 'paid') {
          type = 'payment_received';
          title = 'Payment Received';
          message = `Payment of $${payment.amount} received from ${payment.tenants?.full_name}`;
        } else if (payment.status === 'overdue') {
          type = 'payment_overdue';
          title = 'Payment Overdue';
          message = `Payment of $${payment.amount} is overdue from ${payment.tenants?.full_name}`;
        } else if (new Date(payment.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
          type = 'payment_due_soon';
          title = 'Payment Due Soon';
          message = `Payment of $${payment.amount} due soon from ${payment.tenants?.full_name}`;
        }

        return {
          id: payment.id,
          type,
          title,
          message,
          tenant_name: payment.tenants?.full_name,
          property_name: payment.properties?.name,
          amount: payment.amount,
          due_date: payment.due_date,
          created_at: payment.created_at
        };
      });

      setNotifications(paymentNotifications);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          user_id,
          full_name,
          email,
          properties:property_id (
            name
          )
        `)
        .eq('status', 'active');

      if (error) throw error;
      
      setTenants(data.map(tenant => ({
        ...tenant,
        property: tenant.properties
      })));
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handlePaymentChange = (payload: any) => {
    // Refresh notifications when payments change
    fetchAdminNotifications();
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (formData.recipient === 'all') {
        // Send to all tenants
        const notifications = tenants.map(tenant => ({
          user_id: tenant.user_id,
          title: formData.title,
          message: formData.message,
          type: formData.type
        }));

        const { error } = await supabase
          .from('notifications')
          .insert(notifications);

        if (error) throw error;
        toast.success(`Notification sent to ${tenants.length} tenants`);
      } else {
        // Send to specific tenant
        const tenant = tenants.find(t => t.id === formData.tenant_id);
        if (!tenant) throw new Error('Tenant not found');

        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: tenant.user_id,
            title: formData.title,
            message: formData.message,
            type: formData.type
          });

        if (error) throw error;
        toast.success('Notification sent successfully');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const resetForm = () => {
    setFormData({
      recipient: 'all',
      tenant_id: '',
      title: '',
      message: '',
      type: 'general'
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_received':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'payment_overdue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'payment_due_soon':
        return <Calendar className="h-5 w-5 text-yellow-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment_received':
        return 'border-green-200 bg-green-50';
      case 'payment_overdue':
        return 'border-red-200 bg-red-50';
      case 'payment_due_soon':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getOverviewStats = () => {
    const paymentReceived = notifications.filter(n => n.type === 'payment_received').length;
    const paymentOverdue = notifications.filter(n => n.type === 'payment_overdue').length;
    const paymentDueSoon = notifications.filter(n => n.type === 'payment_due_soon').length;
    
    return { paymentReceived, paymentOverdue, paymentDueSoon };
  };

  if (userRole !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Access denied. Admin privileges required.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getOverviewStats();

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payments Received</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.paymentReceived}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.paymentOverdue}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Due Soon</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.paymentDueSoon}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenants.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Send Notification */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Send Notification
              </CardTitle>
              <CardDescription>
                Send notifications to tenants about payments, reminders, or general announcements
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Send Notification</DialogTitle>
                  <DialogDescription>
                    Send a notification to tenants
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSendNotification} className="space-y-4">
                  <div>
                    <Label htmlFor="recipient">Recipient</Label>
                    <Select value={formData.recipient} onValueChange={(value) => setFormData({...formData, recipient: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tenants</SelectItem>
                        <SelectItem value="specific">Specific Tenant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.recipient === 'specific' && (
                    <div>
                      <Label htmlFor="tenant_id">Tenant</Label>
                      <Select value={formData.tenant_id} onValueChange={(value) => setFormData({...formData, tenant_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.full_name} - {tenant.property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Send Notification
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Activity Feed
          </CardTitle>
          <CardDescription>
            Real-time updates on tenant activities and payment status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 border rounded-lg ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start space-x-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{notification.title}</h4>
                      <span className="text-xs text-gray-500">
                        {format(new Date(notification.created_at), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    {notification.property_name && (
                      <p className="text-xs text-gray-500 mt-1">
                        Property: {notification.property_name}
                      </p>
                    )}
                    {notification.amount && (
                      <p className="text-xs text-gray-500">
                        Amount: ${notification.amount.toFixed(2)}
                      </p>
                    )}
                    {notification.due_date && (
                      <p className="text-xs text-gray-500">
                        Due: {format(new Date(notification.due_date), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;
