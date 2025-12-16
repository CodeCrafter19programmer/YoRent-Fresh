import { useState, useEffect } from 'react';
import { Receipt, Plus, TrendingDown, Calendar, DollarSign, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/StatCard';
import { expenseService, propertyService, type DbExpense, type PropertyWithTenants } from '@/lib/supabaseApi';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Expense = DbExpense;

interface PropertyOption {
  id: string;
  name: string;
}

const ExpensesNew = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { toast } = useToast();

  const [expenseForm, setExpenseForm] = useState({
    property_id: '',
    category: 'utilities',
    description: '',
    amount: '',
    expense_date: '',
  });

  useEffect(() => {
    fetchExpenses();
    fetchProperties();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await expenseService.list();
      setExpenses(
        data.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load expenses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const data = await propertyService.list();
      const options: PropertyOption[] = data.map((property: PropertyWithTenants) => ({
        id: property.id,
        name: property.name,
      }));
      setProperties(options);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleAddExpense = async () => {
    try {
      const amount = Number.parseFloat(expenseForm.amount);
      if (Number.isNaN(amount)) {
        throw new Error('Amount must be a valid number');
      }

      await expenseService.create({
        property_id: expenseForm.property_id,
        category: expenseForm.category,
        description: expenseForm.description || null,
        amount,
        expense_date: expenseForm.expense_date,
      });

      toast({ title: 'Success', description: 'Expense added successfully' });
      setAddDialogOpen(false);
      resetForm();
      fetchExpenses();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add expense',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateExpense = async () => {
    if (!selectedExpense) return;

    try {
      const amount = Number.parseFloat(expenseForm.amount);
      if (Number.isNaN(amount)) {
        throw new Error('Amount must be a valid number');
      }

      await expenseService.update(selectedExpense.id, {
        property_id: expenseForm.property_id,
        category: expenseForm.category,
        description: expenseForm.description || null,
        amount,
        expense_date: expenseForm.expense_date,
      });

      toast({ title: 'Success', description: 'Expense updated successfully' });
      setEditDialogOpen(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update expense',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await expenseService.remove(expenseId);

      toast({ title: 'Success', description: 'Expense deleted successfully' });
      fetchExpenses();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete expense',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpenseForm({
      property_id: expense.property_id,
      category: expense.category,
      description: expense.description ?? '',
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setExpenseForm({
      property_id: '',
      category: 'utilities',
      description: '',
      amount: '',
      expense_date: '',
    });
  };

  const filteredExpenses = expenses.filter(
    (expense) => filterCategory === 'all' || expense.category === filterCategory
  );

  // Calculate stats
  const currentMonth = format(new Date(), 'MMMM yyyy');
  const currentMonthExpenses = expenses.filter(e => 
    format(new Date(e.expense_date), 'MMMM yyyy') === currentMonth
  );
  const totalThisMonth = currentMonthExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const totalAllTime = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  // Group by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + (expense.amount ?? 0);
    return acc;
  }, {} as Record<string, number>);

  // Prepare chart data (last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return format(date, 'MMM');
  }).reverse();

  const monthlyExpenses = last6Months.map(month => {
    const monthExpenses = expenses.filter(e => 
      format(new Date(e.expense_date), 'MMM') === month
    );
    return {
      month,
      amount: monthExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0),
    };
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
          <h1 className="text-3xl font-bold tracking-tight">Expenses & Utilities</h1>
          <p className="text-muted-foreground mt-1">
            Track property maintenance costs and utility expenses
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-primary hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total This Month"
          value={`$${totalThisMonth.toLocaleString()}`}
          icon={Calendar}
          trend={{ value: currentMonth, isPositive: false }}
          variant="danger"
        />
        <StatCard
          title="Total Expenses"
          value={`$${totalAllTime.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: `${expenses.length} records`, isPositive: false }}
          variant="default"
        />
        <StatCard
          title="Utilities"
          value={`$${(expensesByCategory['utilities'] || 0).toLocaleString()}`}
          icon={Receipt}
          trend={{ value: 'All time', isPositive: false }}
          variant="default"
        />
        <StatCard
          title="Repairs"
          value={`$${(expensesByCategory['repairs'] || 0).toLocaleString()}`}
          icon={TrendingDown}
          trend={{ value: 'All time', isPositive: false }}
          variant="default"
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expenses (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyExpenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="repairs">Repairs</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold">Property</th>
                  <th className="text-left p-3 text-sm font-semibold">Category</th>
                  <th className="text-left p-3 text-sm font-semibold">Description</th>
                  <th className="text-right p-3 text-sm font-semibold">Amount</th>
                  <th className="text-left p-3 text-sm font-semibold">Date</th>
                  <th className="text-center p-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{expense.property?.name ?? 'Unknown'}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{expense.description}</td>
                    <td className="p-3 text-right font-semibold text-red-600">
                      ${expense.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-sm">
                      {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(expense)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredExpenses.length === 0 && (
              <p className="text-center text-gray-500 py-8">No expense records found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>
              Record a new property expense or utility payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property *</Label>
              <Select
                value={expenseForm.property_id}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, property_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="repairs">Repairs</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the expense..."
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense_date">Date *</Label>
              <Input
                id="expense_date"
                type="date"
                value={expenseForm.expense_date}
                onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddExpense}>
              Add Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update expense details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_category">Category</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="repairs">Repairs</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_amount">Amount ($)</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_expense_date">Date</Label>
              <Input
                id="edit_expense_date"
                type="date"
                value={expenseForm.expense_date}
                onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedExpense(null); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateExpense}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesNew;
