import { useEffect, useState, type FormEvent } from 'react';
import {
  taxService,
  paymentService,
  expenseService,
  type DbTaxRecord,
  type DbExpense,
  type DbPayment,
} from '@/lib/supabaseApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, Plus, Edit, DollarSign, TrendingUp, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type TaxRecord = DbTaxRecord;

interface UtilityExpenseSummary {
  id: string;
  property_id: string;
  property_name: string;
  month: string;
  electricity: number;
  water: number;
  gas: number;
  maintenance: number;
  other: number;
}

const TaxAccountability = () => {
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [utilityExpenses, setUtilityExpenses] = useState<UtilityExpenseSummary[]>([]);
  const [cachedPayments, setCachedPayments] = useState<DbPayment[]>([]);
  const [cachedExpenses, setCachedExpenses] = useState<DbExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TaxRecord | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    month: '',
    year: new Date().getFullYear(),
    tax_rate: '25'
  });

  useEffect(() => {
    fetchTaxRecords();
  }, [selectedYear]);

  useEffect(() => {
    preloadFinancialSnapshots();
  }, []);

  const fetchTaxRecords = async () => {
    setLoading(true);
    try {
      const data = await taxService.list(selectedYear);
      setTaxRecords(data);
    } catch (error) {
      console.error('Error fetching tax records:', error);
      toast.error('Failed to fetch tax records');
    } finally {
      setLoading(false);
    }
  };

  const preloadFinancialSnapshots = async () => {
    try {
      const [payments, expenses] = await Promise.all([
        paymentService.list(),
        expenseService.list(),
      ]);
      setCachedPayments(payments);
      setCachedExpenses(expenses);
      setUtilityExpenses(transformUtilityExpenses(expenses));
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('Failed to load financial data');
    }
  };

  const transformUtilityExpenses = (expenses: DbExpense[]): UtilityExpenseSummary[] =>
    expenses.map((expense) => ({
      id: expense.id,
      property_id: expense.property_id,
      property_name: expense.property?.name ?? 'N/A',
      month: new Date(expense.expense_date).toLocaleString('en-US', { month: 'long' }),
      electricity: expense.category === 'utilities' ? expense.amount ?? 0 : 0,
      water: 0,
      gas: 0,
      maintenance: expense.category === 'maintenance' ? expense.amount ?? 0 : 0,
      other:
        expense.category !== 'utilities' && expense.category !== 'maintenance'
          ? expense.amount ?? 0
          : 0,
    }));

  const calculateMonthlyTaxRecord = async (month: string, year: number) => {
    let payments = cachedPayments;
    let expenses = cachedExpenses;

    if (!payments.length || !expenses.length) {
      const [freshPayments, freshExpenses] = await Promise.all([
        paymentService.list(),
        expenseService.list(),
      ]);
      payments = freshPayments;
      expenses = freshExpenses;
      setCachedPayments(freshPayments);
      setCachedExpenses(freshExpenses);
      setUtilityExpenses(transformUtilityExpenses(freshExpenses));
    }

    const monthMatches = (dateString: string | null | undefined) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      const m = date.toLocaleString('en-US', { month: 'long' });
      const y = date.getFullYear();
      return m === month && y === year;
    };

    const totalRevenue = payments
      .filter((payment) => payment.status === 'paid')
      .filter((payment) => {
        if (payment.month) {
          return payment.month.toLowerCase().includes(month.toLowerCase());
        }
        return monthMatches(payment.paid_date ?? payment.due_date);
      })
      .reduce((sum, payment) => sum + (payment.amount ?? 0), 0);

    const expensesThisMonth = expenses.filter((expense) => monthMatches(expense.expense_date));
    const electricity = expensesThisMonth
      .filter((expense) => expense.category === 'utilities')
      .reduce((sum, expense) => sum + (expense.amount ?? 0), 0);
    const maintenance = expensesThisMonth
      .filter((expense) => expense.category === 'maintenance')
      .reduce((sum, expense) => sum + (expense.amount ?? 0), 0);
    const water = 0;
    const gas = 0;
    const otherExpenses = expensesThisMonth
      .filter((expense) => !['utilities', 'maintenance'].includes(expense.category))
      .reduce((sum, expense) => sum + (expense.amount ?? 0), 0);

    const total_utilities = electricity + maintenance + water + gas + otherExpenses;
    const net_income = totalRevenue - total_utilities;
    const parsedTaxRate = Number.parseFloat(formData.tax_rate);
    const tax_rate = Number.isNaN(parsedTaxRate) ? 0 : parsedTaxRate;
    const tax_amount = net_income * (tax_rate / 100);

    return {
      month,
      year,
      total_revenue: totalRevenue,
      total_utilities,
      electricity,
      water,
      gas,
      maintenance,
      other_expenses: otherExpenses,
      net_income,
      tax_rate,
      tax_amount,
    };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      const calculatedData = await calculateMonthlyTaxRecord(formData.month, formData.year);

      if (editingRecord) {
        await taxService.update(editingRecord.id, calculatedData);
        toast.success('Tax record updated successfully');
      } else {
        await taxService.create(calculatedData);
        toast.success('Tax record created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTaxRecords();
    } catch (error) {
      console.error('Error saving tax record:', error);
      toast.error('Failed to save tax record');
    }
  };

  const resetForm = () => {
    setFormData({
      month: '',
      year: new Date().getFullYear(),
      tax_rate: '25'
    });
    setEditingRecord(null);
  };

  const openEditDialog = (record: TaxRecord) => {
    setEditingRecord(record);
    setFormData({
      month: record.month,
      year: record.year,
      tax_rate: record.tax_rate.toString()
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getYearlyTotals = () => {
    const totalRevenue = taxRecords.reduce((sum, record) => sum + record.total_revenue, 0);
    const totalUtilities = taxRecords.reduce((sum, record) => sum + record.total_utilities, 0);
    const totalNetIncome = taxRecords.reduce((sum, record) => sum + record.net_income, 0);
    const totalTaxAmount = taxRecords.reduce((sum, record) => sum + record.tax_amount, 0);
    
    return { totalRevenue, totalUtilities, totalNetIncome, totalTaxAmount };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const yearlyTotals = getYearlyTotals();

  return (
    <div className="space-y-6">
      {/* Year Selection */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Label htmlFor="year">Year:</Label>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${yearlyTotals.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Utilities</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${yearlyTotals.totalUtilities.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${yearlyTotals.totalNetIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tax Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${yearlyTotals.totalTaxAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Records Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Tax Accountability Records
              </CardTitle>
              <CardDescription>
                Track revenue, utilities, and tax calculations for {selectedYear}
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Calculate Monthly Tax
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingRecord ? 'Edit Tax Record' : 'Calculate Monthly Tax'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRecord ? 'Update tax calculation' : 'Generate tax calculation for a specific month'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="month">Month</Label>
                    <Select value={formData.month} onValueChange={(value) => setFormData({...formData, month: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.1"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({...formData, tax_rate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingRecord ? 'Update' : 'Calculate'}
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
                <TableHead>Month</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Utilities</TableHead>
                <TableHead>Net Income</TableHead>
                <TableHead>Tax Rate</TableHead>
                <TableHead>Tax Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.month} {record.year}</TableCell>
                  <TableCell>${record.total_revenue.toFixed(2)}</TableCell>
                  <TableCell>${record.total_utilities.toFixed(2)}</TableCell>
                  <TableCell className={record.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${record.net_income.toFixed(2)}
                  </TableCell>
                  <TableCell>{record.tax_rate}%</TableCell>
                  <TableCell>${record.tax_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(record)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {taxRecords.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No tax records found for {selectedYear}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Utilities Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Utilities Breakdown
          </CardTitle>
          <CardDescription>
            Detailed breakdown of utility expenses by property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Electricity</TableHead>
                <TableHead>Water</TableHead>
                <TableHead>Gas</TableHead>
                <TableHead>Maintenance</TableHead>
                <TableHead>Other</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {utilityExpenses.slice(0, 10).map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.property_name}</TableCell>
                  <TableCell>{expense.month}</TableCell>
                  <TableCell>${expense.electricity.toFixed(2)}</TableCell>
                  <TableCell>${expense.water.toFixed(2)}</TableCell>
                  <TableCell>${expense.gas.toFixed(2)}</TableCell>
                  <TableCell>${expense.maintenance.toFixed(2)}</TableCell>
                  <TableCell>${expense.other.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">
                    ${(expense.electricity + expense.water + expense.gas + expense.maintenance + expense.other).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {utilityExpenses.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No utility expenses found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxAccountability;
