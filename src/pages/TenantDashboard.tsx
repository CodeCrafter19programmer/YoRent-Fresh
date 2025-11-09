import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, CreditCard, Home, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface TenantData {
  id: string;
  full_name: string;
  email: string;
  monthly_rent: number;
  property: {
    name: string;
    address: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  month: string;
  due_date: string;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const TenantDashboard = () => {
  const { user, signOut } = useAuth();
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTenantData();
      fetchPayments();
      fetchNotifications();
      
      // Subscribe to real-time updates
      const paymentsSubscription = supabase
        .channel('tenant-payments')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'payments' },
          () => fetchPayments()
        )
        .subscribe();

      const notificationsSubscription = supabase
        .channel('tenant-notifications')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          () => fetchNotifications()
        )
        .subscribe();

      return () => {
        paymentsSubscription.unsubscribe();
        notificationsSubscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchTenantData = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          full_name,
          email,
          monthly_rent,
          properties:property_id (
            name,
            address
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      setTenantData({
        ...data,
        property: data.properties
      });
    } catch (error) {
      console.error('Error fetching tenant data:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .in('tenant_id', [tenantData?.id])
        .order('due_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUpcomingPayments = () => {
    return payments.filter(payment => 
      payment.status === 'unpaid' && 
      new Date(payment.due_date) >= new Date()
    ).slice(0, 3);
  };

  const getOverduePayments = () => {
    return payments.filter(payment => 
      payment.status === 'unpaid' && 
      new Date(payment.due_date) < new Date()
    );
  };

  const getTotalBalance = () => {
    return payments
      .filter(payment => payment.status === 'unpaid')
      .reduce((total, payment) => total + payment.amount, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">YoRent</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {tenantData?.full_name}</span>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Rent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${tenantData?.monthly_rent?.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${getTotalBalance().toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue Payments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getOverduePayments().length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unread Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications.filter(n => !n.read).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Property Info */}
        {tenantData?.property && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Your Property
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Property Name</p>
                  <p className="text-lg font-semibold">{tenantData.property.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Address</p>
                  <p className="text-lg font-semibold">{tenantData.property.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment History
              </CardTitle>
              <CardDescription>
                Track your rent payments and outstanding balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{payment.month}</p>
                      <p className="text-sm text-gray-600">
                        Due: {format(new Date(payment.due_date), 'MMM dd, yyyy')}
                      </p>
                      {payment.paid_date && (
                        <p className="text-sm text-gray-600">
                          Paid: {format(new Date(payment.paid_date), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${payment.amount.toFixed(2)}</p>
                      <Badge className={getPaymentStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No payment records found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </CardTitle>
              <CardDescription>
                Stay updated with payment reminders and important notices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border rounded-lg ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No notifications</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Payments Alert */}
        {getUpcomingPayments().length > 0 && (
          <Alert className="mt-8">
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              You have {getUpcomingPayments().length} upcoming payment(s) due soon.
            </AlertDescription>
          </Alert>
        )}

        {/* Overdue Payments Alert */}
        {getOverduePayments().length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {getOverduePayments().length} overdue payment(s). Please contact your landlord.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;
