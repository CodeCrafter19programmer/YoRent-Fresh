import { useEffect, useState, type FormEvent } from 'react';
import {
  paymentService,
  tenantService,
  notificationService,
  type DbPayment,
  type DbTenant,
} from '@/lib/supabaseApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Plus, Edit, DollarSign, Calendar, Users, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Payment = DbPayment;

type Tenant = DbTenant;

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tenant_id: '',
    amount: '',
    month: '',
    due_date: '',
    paid_date: '',
    status: 'unpaid',
    payment_method: '',
    notes: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchTenants();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentService.list();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const data = await tenantService.listActive();
      setTenants(data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to fetch tenants');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      const parsedAmount = Number.parseFloat(formData.amount);
      if (Number.isNaN(parsedAmount)) {
        throw new Error('Please provide a valid payment amount.');
      }

      const paymentData = {
        ...formData,
        amount: parsedAmount,
        paid_date: formData.paid_date || null,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
      };

      const tenant = tenants.find((t) => t.id === formData.tenant_id);
      const paymentPayload = {
        tenant_id: formData.tenant_id,
        property_id: tenant?.property?.id ?? null,
        amount: paymentData.amount,
        month: paymentData.month,
        due_date: paymentData.due_date,
        paid_date: paymentData.paid_date,
        status: paymentData.status,
        payment_method: paymentData.payment_method,
        notes: paymentData.notes,
      };

      if (editingPayment) {
        const updatedPayment = await paymentService.update(editingPayment.id, paymentPayload);

        if (formData.status === 'paid' && editingPayment.status !== 'paid' && tenant?.user_id) {
          await createNotification(
            tenant.user_id,
            'Payment Confirmed',
            `Your payment of $${paymentData.amount.toFixed(2)} for ${paymentData.month} has been confirmed.`,
            'payment_success'
          );
        }

        toast.success('Payment updated successfully');
        setEditingPayment(updatedPayment);
      } else {
        const createdPayment = await paymentService.create(paymentPayload);

        if (paymentPayload.status === 'paid' && tenant?.user_id) {
          await createNotification(
            tenant.user_id,
            'Payment Confirmed',
            `Your payment of $${paymentData.amount.toFixed(2)} for ${paymentData.month} has been recorded.`,
            'payment_success'
          );
        }

        toast.success('Payment created successfully');
        setEditingPayment(createdPayment);
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save payment');
    }
  };

  const createNotification = async (userId: string, title: string, message: string, type: string) => {
    try {
      await notificationService.create(userId, title, message, type);
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const resetForm = () => {
    setFormData({
      tenant_id: '',
      amount: '',
      month: '',
      due_date: '',
      paid_date: '',
      status: 'unpaid',
      payment_method: '',
      notes: ''
    });
    setEditingPayment(null);
  };

  const openEditDialog = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      tenant_id: payment.tenant_id,
      amount: payment.amount.toString(),
      month: payment.month,
      due_date: payment.due_date,
      paid_date: payment.paid_date || '',
      status: payment.status,
      payment_method: payment.payment_method || '',
      notes: payment.notes || '',
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverviewStats = () => {
    const totalRevenue = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const pendingAmount = payments
      .filter((p) => p.status === 'unpaid')
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const overdueCount = payments.filter((p) => p.status === 'unpaid' && new Date(p.due_date) < new Date()).length;

    return { totalRevenue, pendingAmount, overdueCount };
  };

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
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.pendingAmount.toFixed(2)}
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
                  {stats.overdueCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
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

      {/* Payments Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Management
              </CardTitle>
              <CardDescription>
                Manage tenant payments and track payment history
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingPayment ? 'Edit Payment' : 'Add New Payment'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPayment ? 'Update payment details' : 'Create a new payment record'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="tenant_id">Tenant</Label>
                    <Select value={formData.tenant_id} onValueChange={(value) => setFormData({...formData, tenant_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.full_name}
                            {tenant.property?.name ? ` - ${tenant.property.name}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="month">Month</Label>
                    <Input
                      id="month"
                      type="text"
                      placeholder="e.g., January 2024"
                      value={formData.month}
                      onChange={(e) => setFormData({...formData, month: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.status === 'paid' && (
                    <>
                      <div>
                        <Label htmlFor="paid_date">Paid Date</Label>
                        <Input
                          id="paid_date"
                          type="date"
                          value={formData.paid_date}
                          onChange={(e) => setFormData({...formData, paid_date: e.target.value})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="payment_method">Payment Method</Label>
                        <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="online">Online Payment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      type="text"
                      placeholder="Optional notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingPayment ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payment.tenant?.full_name ?? 'Unknown tenant'}</p>
                      <p className="text-sm text-gray-600">{payment.tenant?.email ?? '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell>{payment.property?.name ?? 'N/A'}</TableCell>
                  <TableCell>{payment.month}</TableCell>
                  <TableCell>${(payment.amount ?? 0).toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(payment.due_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(payment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {payments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No payments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayments;
