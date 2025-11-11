import { useState, useEffect } from 'react';
import { Users, Plus, Search, Phone, Mail, MapPin, Calendar, Edit2, FileText, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InvoiceModal } from '@/components/InvoiceModal';

interface Tenant {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  monthly_rent: number;
  lease_start: string | null;
  lease_end: string | null;
  status: string;
  deposit: number | null;
  property: {
    id: string;
    name: string;
    address: string;
  } | null;
}

interface Payment {
  id: string;
  amount: number;
  month: string;
  due_date: string;
  paid_date: string | null;
  status: string;
}

const TenantsNew = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const { toast } = useToast();

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    monthly_rent: 0,
    lease_start: '',
    lease_end: '',
    deposit: 0,
    status: 'active',
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          full_name,
          email,
          phone,
          monthly_rent,
          lease_start,
          lease_end,
          status,
          deposit,
          property:property_id (
            id,
            name,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantPayments = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'paid')
        .order('paid_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditForm({
      full_name: tenant.full_name,
      email: tenant.email,
      phone: tenant.phone || '',
      monthly_rent: tenant.monthly_rent,
      lease_start: tenant.lease_start || '',
      lease_end: tenant.lease_end || '',
      deposit: tenant.deposit || 0,
      status: tenant.status,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTenant) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .update(editForm)
        .eq('id', selectedTenant.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Tenant updated successfully',
      });
      setEditDialogOpen(false);
      fetchTenants();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleGenerateInvoice = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    await fetchTenantPayments(tenant.id);
    
    if (payments.length > 0) {
      setSelectedPayment(payments[0]); // Latest payment
      setInvoiceDialogOpen(true);
    } else {
      toast({
        title: 'No Payments',
        description: 'This tenant has no paid payments yet.',
        variant: 'destructive',
      });
    }
  };

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.property?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
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
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground mt-1">
            Manage tenant information, payments, and generate invoices
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tenants by name, property, or email..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tenants List */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 bg-primary text-primary-foreground">
                    <AvatarFallback>{getInitials(tenant.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{tenant.full_name}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tenant.status}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{tenant.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{tenant.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{tenant.property?.name || 'No property assigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Lease: {tenant.lease_start ? new Date(tenant.lease_start).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Rent</span>
                  <span className="text-lg font-bold text-success">
                    ${tenant.monthly_rent.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditTenant(tenant)}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleGenerateInvoice(tenant)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant Details</DialogTitle>
            <DialogDescription>
              Update tenant information, rent amount, and lease dates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_rent">Monthly Rent ($)</Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  value={editForm.monthly_rent}
                  onChange={(e) => setEditForm({ ...editForm, monthly_rent: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit">Deposit ($)</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={editForm.deposit}
                  onChange={(e) => setEditForm({ ...editForm, deposit: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lease_start">Lease Start</Label>
                <Input
                  id="lease_start"
                  type="date"
                  value={editForm.lease_start}
                  onChange={(e) => setEditForm({ ...editForm, lease_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lease_end">Lease End</Label>
                <Input
                  id="lease_end"
                  type="date"
                  value={editForm.lease_end}
                  onChange={(e) => setEditForm({ ...editForm, lease_end: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Modal */}
      {selectedTenant && selectedPayment && (
        <InvoiceModal
          open={invoiceDialogOpen}
          onClose={() => setInvoiceDialogOpen(false)}
          tenant={selectedTenant}
          payment={selectedPayment}
        />
      )}
    </div>
  );
};

export default TenantsNew;
