import { useState, useEffect } from 'react';
import { Building2, Plus, Search, MapPin, DollarSign, Edit, Trash2, Users, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  propertyService,
  tenantService,
  type PropertyWithTenants,
  type DbTenant,
  type PropertyStatus,
} from '@/lib/supabaseApi';

type Property = PropertyWithTenants;

type TenantOption = Pick<DbTenant, 'id' | 'full_name' | 'email'>;

interface PropertyFormState {
  name: string;
  address: string;
  type: string;
  monthly_rent: string;
  status: PropertyStatus;
  image_url: string;
}

const PropertiesNew = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const { toast } = useToast();

  const createEmptyForm = (): PropertyFormState => ({
    name: '',
    address: '',
    type: 'apartment',
    monthly_rent: '',
    status: 'vacant',
    image_url: '',
  });

  const [propertyForm, setPropertyForm] = useState<PropertyFormState>(createEmptyForm());

  useEffect(() => {
    fetchProperties();
    fetchTenants();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await propertyService.list();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load properties',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const data = await tenantService.listActive();
      setTenants(
        data.map((tenant) => ({
          id: tenant.id,
          full_name: tenant.full_name,
          email: tenant.email,
        }))
      );
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handleAddProperty = async () => {
    try {
      const monthlyRent = Number.parseFloat(propertyForm.monthly_rent);
      if (Number.isNaN(monthlyRent)) {
        throw new Error('Monthly rent must be a valid number');
      }

      await propertyService.create({
        name: propertyForm.name,
        address: propertyForm.address,
        type: propertyForm.type,
        monthly_rent: monthlyRent,
        status: propertyForm.status,
        image_url: propertyForm.image_url || null,
      });

      toast({
        title: 'Success',
        description: 'Property added successfully',
      });
      setAddDialogOpen(false);
      resetForm();
      fetchProperties();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add property',
        variant: 'destructive',
      });
    }
  };

  const handleEditProperty = async () => {
    if (!selectedProperty) return;

    try {
      const monthlyRent = Number.parseFloat(propertyForm.monthly_rent);
      if (Number.isNaN(monthlyRent)) {
        throw new Error('Monthly rent must be a valid number');
      }

      await propertyService.update(selectedProperty.id, {
        name: propertyForm.name,
        address: propertyForm.address,
        type: propertyForm.type,
        monthly_rent: monthlyRent,
        status: propertyForm.status,
        image_url: propertyForm.image_url || null,
      });

      toast({
        title: 'Success',
        description: 'Property updated successfully',
      });
      setEditDialogOpen(false);
      setSelectedProperty(null);
      fetchProperties();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update property',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      await propertyService.remove(propertyId);

      toast({
        title: 'Success',
        description: 'Property deleted successfully',
      });
      fetchProperties();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete property',
        variant: 'destructive',
      });
    }
  };

  const handleAssignTenant = async (propertyId: string, tenantId: string) => {
    try {
      await tenantService.assignToProperty(tenantId, propertyId);

      toast({
        title: 'Success',
        description: 'Tenant assigned successfully',
      });
      fetchProperties();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign tenant',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (property: Property) => {
    setSelectedProperty(property);
    setPropertyForm({
      name: property.name,
      address: property.address,
      type: property.type,
      monthly_rent: property.monthly_rent.toString(),
      status: property.status,
      image_url: property.image_url || '',
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setPropertyForm(createEmptyForm());
  };

  const filteredProperties = properties.filter((property) => {
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
    const matchesSearch = 
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground mt-1">
            Manage properties, pricing, occupancy, and tenant assignments
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-primary hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupied</p>
                <p className="text-2xl font-bold text-green-600">
                  {properties.filter(p => p.status === 'occupied').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vacant</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {properties.filter(p => p.status === 'vacant').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${properties.filter(p => p.status === 'occupied').reduce((sum, p) => sum + p.monthly_rent, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden transition-all hover:shadow-lg">
            {property.image_url && (
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={property.image_url}
                  alt={property.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';
                  }}
                />
                <div className="absolute right-2 top-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    property.status === 'occupied' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {property.status === 'occupied' ? 'Occupied' : 'Vacant'}
                  </span>
                </div>
              </div>
            )}
            <CardHeader>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold">{property.name}</h3>
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                    {property.type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {property.address}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold">${property.monthly_rent}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </div>
              
              {property.tenants && property.tenants.length > 0 ? (
                <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Current Tenant</span>
                  </div>
                  {property.tenants.map(tenant => (
                    <div key={tenant.id} className="text-sm">
                      <p className="font-medium">{tenant.full_name}</p>
                      <p className="text-blue-700 text-xs">{tenant.email}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription className="text-sm">
                    No tenant assigned
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openEditDialog(property)}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteProperty(property.id)}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Property Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>
              Create a new property listing. Image URL is optional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name / Room Number *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Apartment 101"
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Property Type *</Label>
                <Select 
                  value={propertyForm.type}
                  onValueChange={(value) => setPropertyForm({ ...propertyForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                placeholder="Full property address"
                value={propertyForm.address}
                onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_rent">Monthly Rent ($) *</Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  placeholder="1200"
                  value={propertyForm.monthly_rent}
                  onChange={(e) => setPropertyForm({ ...propertyForm, monthly_rent: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select 
                  value={propertyForm.status}
                  onValueChange={(value) => setPropertyForm({ ...propertyForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL (Optional)</Label>
              <Input
                id="image_url"
                placeholder="https://example.com/image.jpg"
                value={propertyForm.image_url}
                onChange={(e) => setPropertyForm({ ...propertyForm, image_url: e.target.value })}
              />
              <p className="text-xs text-gray-500">Leave blank if no image available</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddProperty}>
              Create Property
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Property Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update property details, pricing, and occupancy status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Property Name / Room Number</Label>
                <Input
                  id="edit_name"
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_type">Property Type</Label>
                <Select 
                  value={propertyForm.type}
                  onValueChange={(value) => setPropertyForm({ ...propertyForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_address">Address</Label>
              <Textarea
                id="edit_address"
                value={propertyForm.address}
                onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_monthly_rent">Monthly Rent ($)</Label>
                <Input
                  id="edit_monthly_rent"
                  type="number"
                  value={propertyForm.monthly_rent}
                  onChange={(e) => setPropertyForm({ ...propertyForm, monthly_rent: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">Occupancy Status</Label>
                <Select 
                  value={propertyForm.status}
                  onValueChange={(value) => setPropertyForm({ ...propertyForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_image_url">Image URL</Label>
              <Input
                id="edit_image_url"
                placeholder="https://example.com/image.jpg"
                value={propertyForm.image_url}
                onChange={(e) => setPropertyForm({ ...propertyForm, image_url: e.target.value })}
              />
            </div>

            {/* Assign Tenant Section */}
            {selectedProperty && (
              <div className="border-t pt-4 mt-4">
                <Label>Assign Tenant (Optional)</Label>
                <Select onValueChange={(value) => handleAssignTenant(selectedProperty.id, value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a tenant to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map(tenant => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.full_name} ({tenant.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedProperty(null); }}>
              Cancel
            </Button>
            <Button onClick={handleEditProperty}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertiesNew;
