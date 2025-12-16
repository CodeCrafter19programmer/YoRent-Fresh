import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, CreditCard, Home, Calendar, DollarSign, AlertTriangle, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  tenantService,
  notificationService,
  policyService,
  type DbTenant,
  type DbPayment,
  type DbNotification,
  type DbPolicy,
} from '@/lib/supabaseApi';

type TenantData = DbTenant;
type Payment = DbPayment;
type Notification = DbNotification;
type Policy = DbPolicy;

const TenantDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut: signOutAuth, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const tenant = await tenantService.getByUserId(user.id);
        if (!tenant) {
          toast({
            title: 'Tenant not found',
            description: 'We could not locate tenant data for your account.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        setTenantData(tenant);

        const [tenantPayments, tenantNotifications, activePolicies] = await Promise.all([
          tenantService.getPayments(tenant.id),
          notificationService.listForUser(user.id),
          policyService.listActive(),
        ]);

        setPayments(tenantPayments);
        setNotifications(tenantNotifications);
        setPolicies(activePolicies);
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load tenant dashboard',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [authLoading, toast, user]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationService.markRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOutAuth();
    if (error) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    navigate('/login');
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
    return payments
      .filter(
        (payment) =>
          payment.status === 'unpaid' &&
          payment.due_date && new Date(payment.due_date) >= new Date()
      )
      .slice(0, 3);
  };

  const getOverduePayments = () => {
    return payments.filter(
      (payment) => payment.status === 'unpaid' && payment.due_date && new Date(payment.due_date) < new Date()
    );
  };

  const getTotalBalance = () => {
    return payments
      .filter((payment) => payment.status === 'unpaid')
      .reduce((total, payment) => total + (payment.amount ?? 0), 0);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !tenantData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">No tenant data</h2>
          <p className="text-muted-foreground">We couldn't find tenant information for this account.</p>
          <Button onClick={handleSignOut}>Return to login</Button>
        </div>
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
              <Button variant="outline" onClick={handleSignOut}>
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
                      {payment.due_date && (
                        <p className="text-sm text-gray-600">
                          Due: {format(new Date(payment.due_date), 'MMM dd, yyyy')}
                        </p>
                      )}
                      {payment.paid_date && (
                        <p className="text-sm text-gray-600">
                          Paid: {format(new Date(payment.paid_date), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(payment.amount ?? 0).toFixed(2)}</p>
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
