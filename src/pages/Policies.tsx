import { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { policyService, type DbPolicy } from '@/lib/supabaseApi';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type Policy = DbPolicy;

const Policies = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const { toast } = useToast();

  const [policyForm, setPolicyForm] = useState({
    title: '',
    content: '',
    category: 'general',
    is_active: true,
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await policyService.list();
      setPolicies(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load policies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    try {
      if (editingPolicy) {
        // Update existing policy
        await policyService.update(editingPolicy.id, { ...policyForm });
        toast({ title: 'Success', description: 'Policy updated successfully' });
      } else {
        // Create new policy
        await policyService.create({ ...policyForm });
        toast({ title: 'Success', description: 'Policy created successfully' });
      }

      setDialogOpen(false);
      resetForm();
      fetchPolicies();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save policy',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      await policyService.remove(policyId);
      toast({ title: 'Success', description: 'Policy deleted successfully' });
      fetchPolicies();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete policy',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (policy: Policy) => {
    try {
      await policyService.update(policy.id, { is_active: !policy.is_active });
      toast({ 
        title: 'Success', 
        description: `Policy ${!policy.is_active ? 'activated' : 'deactivated'}` 
      });
      fetchPolicies();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update policy',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (policy: Policy) => {
    setEditingPolicy(policy);
    setPolicyForm({
      title: policy.title,
      content: policy.content,
      category: policy.category,
      is_active: policy.is_active,
    });
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingPolicy(null);
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setPolicyForm({
      title: '',
      content: '',
      category: 'general',
      is_active: true,
    });
    setEditingPolicy(null);
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Privacy & Policies
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage rules and policies that tenants will see on their dashboard
          </p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" />
          Add Policy
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Policies</p>
                <p className="text-2xl font-bold text-gray-900">{policies.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Policies</p>
                <p className="text-2xl font-bold text-green-600">
                  {policies.filter(p => p.is_active).length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Policies</p>
                <p className="text-2xl font-bold text-gray-600">
                  {policies.filter(p => !p.is_active).length}
                </p>
              </div>
              <EyeOff className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policies List */}
      <div className="grid gap-6">
        {policies.map((policy) => (
          <Card key={policy.id} className={`transition-all ${!policy.is_active ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{policy.title}</CardTitle>
                    <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                      {policy.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{policy.category}</Badge>
                  </div>
                  <CardDescription className="mt-2">
                    Last updated: {new Date(policy.updated_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{policy.content}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(policy)}
                >
                  {policy.is_active ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Activate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(policy)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDeletePolicy(policy.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {policies.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No policies yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first policy to display rules and guidelines to your tenants
              </p>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Policy
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? 'Edit Policy' : 'Add New Policy'}</DialogTitle>
            <DialogDescription>
              {editingPolicy 
                ? 'Update the policy details below' 
                : 'Create a new policy that will be visible to tenants'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Policy Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Payment Terms, Maintenance Rules"
                value={policyForm.title}
                onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={policyForm.category}
                onValueChange={(value) => setPolicyForm({ ...policyForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="conduct">Conduct</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Policy Content *</Label>
              <Textarea
                id="content"
                placeholder="Enter the full policy text here..."
                value={policyForm.content}
                onChange={(e) => setPolicyForm({ ...policyForm, content: e.target.value })}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                This content will be displayed to tenants on their dashboard
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={policyForm.is_active}
                onChange={(e) => setPolicyForm({ ...policyForm, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Make this policy active immediately
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSavePolicy}>
              {editingPolicy ? 'Update Policy' : 'Create Policy'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Policies;
