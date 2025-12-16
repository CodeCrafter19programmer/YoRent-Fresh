import { useState, useEffect } from 'react';
import { DollarSign, Calendar, CheckCircle, XCircle, Clock, Plus, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/StatCard';
import {
  paymentService,
  tenantService,
  type DbPayment,
  type DbTenant,
  type PaymentStatus,
} from '@/lib/supabaseApi';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Payment = DbPayment;

type Tenant = DbTenant;

const RentManagementNew = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const { toast } = useToast();

  const [paymentForm, setPaymentForm] = useState({
    tenant_id: '',
    property_id: '',
    amount: '',
    month: '',
    due_date: '',
    paid_date: '',
    status: 'unpaid' as PaymentStatus,
    payment_method: '',
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
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load payments',
        variant: 'destructive',
      });
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
    }
  };

  const handleAddPayment = async () => {
    try {
      const tenant = tenants.find((t) => t.id === paymentForm.tenant_id);
      if (!tenant) {
        toast({ title: 'Error', description: 'Tenant not found', variant: 'destructive' });
        return;
      }

      const parsedAmount = Number.parseFloat(paymentForm.amount);
      if (Number.isNaN(parsedAmount)) {
        toast({ title: 'Error', description: 'Amount must be a valid number', variant: 'destructive' });
        return;
      }

      await paymentService.create({
        tenant_id: paymentForm.tenant_id,
        property_id: tenant.property?.id ?? null,
        amount: parsedAmount,
        month: paymentForm.month,
        due_date: paymentForm.due_date,
        paid_date: paymentForm.paid_date || null,
        status: paymentForm.status,
        payment_method: paymentForm.payment_method || null,
        notes: null,
      });

      toast({ title: 'Success', description: 'Payment record created successfully' });
      setAddDialogOpen(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create payment',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;

    try {
      const parsedAmount = Number.parseFloat(paymentForm.amount);
      if (Number.isNaN(parsedAmount)) {
        toast({ title: 'Error', description: 'Amount must be a valid number', variant: 'destructive' });
        return;
      }

      await paymentService.update(selectedPayment.id, {
        amount: parsedAmount,
        month: paymentForm.month,
        due_date: paymentForm.due_date,
        paid_date: paymentForm.paid_date || null,
        status: paymentForm.status,
        payment_method: paymentForm.payment_method || null,
      });

      toast({ title: 'Success', description: 'Payment updated successfully' });
      setEditDialogOpen(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update payment',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      await paymentService.update(paymentId, {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
      });

      toast({ title: 'Success', description: 'Payment marked as paid' });
      fetchPayments();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark payment as paid',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setPaymentForm({
      tenant_id: payment.tenant_id,
      property_id: payment.property_id ?? '',
      amount: payment.amount.toString(),
      month: payment.month,
      due_date: payment.due_date,
      paid_date: payment.paid_date || '',
      status: payment.status as PaymentStatus,
      payment_method: payment.payment_method || '',
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setPaymentForm({
      tenant_id: '',
      property_id: '',
      amount: '',
      month: '',
      due_date: '',
      paid_date: '',
      status: 'unpaid',
      payment_method: '',
    });
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesMonth = filterMonth === 'all' || payment.month.includes(filterMonth);
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    return matchesMonth && matchesStatus;
  });

  // Calculate current month stats
  const currentMonth = format(new Date(), 'MMMM yyyy');
  const currentMonthPayments = payments.filter((p) => p.month === currentMonth);
  const totalExpected = currentMonthPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const totalCollected = currentMonthPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const totalOutstanding = totalExpected - totalCollected;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'unpaid':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rent Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage rent payments from all tenants
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-primary hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" />
          Add Payment Record
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Expected This Month"
          value={`$${totalExpected.toLocaleString()}`}
          icon={Calendar}
          trend={{ value: currentMonth, isPositive: true }}
          variant="default"
        />
        <StatCard
          title="Collected"
          value={`$${totalCollected.toLocaleString()}`}
          icon={CheckCircle}
          trend={{ value: `${currentMonthPayments.filter(p => p.status === 'paid').length} payments`, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Outstanding"
          value={`$${totalOutstanding.toLocaleString()}`}
          icon={XCircle}
          trend={{ value: `${currentMonthPayments.filter(p => p.status === 'unpaid').length} unpaid`, isPositive: false }}
          variant="danger"
        />
        <StatCard
          title="Collection Rate"
          value={totalExpected > 0 ? `${((totalCollected / totalExpected) * 100).toFixed(1)}%` : '0%'}
          icon={DollarSign}
          trend={{ value: 'This month', isPositive: totalCollected > 0 }}
          variant="default"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="January">January</SelectItem>
                <SelectItem value="February">February</SelectItem>
                <SelectItem value="March">March</SelectItem>
                <SelectItem value="April">April</SelectItem>
                <SelectItem value="May">May</SelectItem>
                <SelectItem value="June">June</SelectItem>
                <SelectItem value="July">July</SelectItem>
                <SelectItem value="August">August</SelectItem>
                <SelectItem value="September">September</SelectItem>
                <SelectItem value="October">October</SelectItem>
                <SelectItem value="November">November</SelectItem>
                <SelectItem value="December">December</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold">Tenant</th>
                  <th className="text-left p-3 text-sm font-semibold">Property</th>
                  <th className="text-left p-3 text-sm font-semibold">Month</th>
                  <th className="text-right p-3 text-sm font-semibold">Amount</th>
                  <th className="text-center p-3 text-sm font-semibold">Status</th>
                  <th className="text-left p-3 text-sm font-semibold">Due Date</th>
                  <th className="text-center p-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{payment.tenant?.full_name ?? 'Unknown'}</td>
                    <td className="p-3 text-sm text-gray-600">{payment.property?.name ?? 'N/A'}</td>
                    <td className="p-3 text-sm">{payment.month}</td>
                    <td className="p-3 text-right font-semibold">${(payment.amount ?? 0).toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(payment.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      {format(new Date(payment.due_date), 'MMM dd, yyyy')}
                      {payment.paid_date && (
                        <div className="text-xs text-green-600">
                          Paid: {format(new Date(payment.paid_date), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        {payment.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsPaid(payment.id)}
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(payment)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPayments.length === 0 && (
              <p className="text-center text-gray-500 py-8">No payment records found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Payment Record</DialogTitle>
            <DialogDescription>
              Create a new payment record for a tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tenant">Tenant *</Label>
              <Select
                value={paymentForm.tenant_id}
                onValueChange={(value) => {
                  const tenant = tenants.find((t) => t.id === value);
                  setPaymentForm({
                    ...paymentForm,
                    tenant_id: value,
                    property_id: tenant?.property?.id ?? '',
                    amount: tenant?.monthly_rent ? tenant.monthly_rent.toString() : '',
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.full_name} (${tenant.monthly_rent}/month)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Month *</Label>
                <Input
                  id="month"
                  placeholder="e.g., January 2025"
                  value={paymentForm.month}
                  onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={paymentForm.due_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={paymentForm.status}
                  onValueChange={(value) =>
                    setPaymentForm({ ...paymentForm, status: value as PaymentStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {paymentForm.status === 'paid' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paid_date">Paid Date</Label>
                  <Input
                    id="paid_date"
                    type="date"
                    value={paymentForm.paid_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paid_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Input
                    id="payment_method"
                    placeholder="e.g., Bank Transfer, Cash"
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment}>
              Create Payment Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Payment Record</DialogTitle>
            <DialogDescription>
              Update payment details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_amount">Amount ($)</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_month">Month</Label>
                <Input
                  id="edit_month"
                  value={paymentForm.month}
                  onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_due_date">Due Date</Label>
                <Input
                  id="edit_due_date"
                  type="date"
                  value={paymentForm.due_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select
                  value={paymentForm.status}
                  onValueChange={(value) =>
                    setPaymentForm({ ...paymentForm, status: value as PaymentStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {paymentForm.status === 'paid' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_paid_date">Paid Date</Label>
                  <Input
                    id="edit_paid_date"
                    type="date"
                    value={paymentForm.paid_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paid_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_payment_method">Payment Method</Label>
                  <Input
                    id="edit_payment_method"
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedPayment(null); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePayment}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentManagementNew;
