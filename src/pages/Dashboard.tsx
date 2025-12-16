import { useEffect, useState } from 'react';
import { Building2, Users, DollarSign, TrendingUp, Home, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  propertyService,
  tenantService,
  paymentService,
  type PropertyWithTenants,
  type DbTenant,
  type DbPayment,
} from '@/lib/supabaseApi';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardStats {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  totalTenants: number;
  totalRentExpected: number;
  totalRentCollected: number;
  outstandingRent: number;
  overduePayments: number;
}

interface UnpaidRent {
  tenant_name: string;
  property_name: string;
  amount: number;
  days_overdue: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    totalTenants: 0,
    totalRentExpected: 0,
    totalRentCollected: 0,
    outstandingRent: 0,
    overduePayments: 0,
  });
  const [unpaidRentList, setUnpaidRentList] = useState<UnpaidRent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [properties, tenants, payments] = await Promise.all([
        propertyService.list(),
        tenantService.list(),
        paymentService.list(),
      ]);

      const totalProperties = properties.length;
      const occupiedProperties = properties.filter((p) => p.status === 'occupied').length;
      const vacantProperties = totalProperties - occupiedProperties;
      const totalTenants = tenants.filter((t) => t.status === 'active').length;

      const totalRentExpected = properties
        .filter((property) => property.status === 'occupied')
        .reduce((sum, property) => sum + property.monthly_rent, 0);

      const totalRentCollected = payments
        .filter((payment) => payment.status === 'paid')
        .reduce((sum, payment) => sum + (payment.amount ?? 0), 0);

      const outstandingRent = payments
        .filter((payment) => payment.status === 'unpaid')
        .reduce((sum, payment) => sum + (payment.amount ?? 0), 0);

      const overduePayments = payments.filter(
        (payment) => payment.status === 'unpaid' && payment.due_date && new Date(payment.due_date) < new Date()
      );

      const unpaid = overduePayments.map((payment) => ({
        tenant_name: payment.tenant?.full_name ?? 'Unknown',
        property_name: payment.property?.name ?? 'Unknown',
        amount: payment.amount ?? 0,
        days_overdue: payment.due_date
          ? Math.floor((Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }));

      setStats({
        totalProperties,
        occupiedProperties,
        vacantProperties,
        totalTenants,
        totalRentExpected,
        totalRentCollected,
        outstandingRent,
        overduePayments: overduePayments.length,
      });

      setUnpaidRentList(unpaid.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const occupancyData = [
    { name: 'Occupied', value: stats.occupiedProperties, color: 'hsl(var(--success))' },
    { name: 'Vacant', value: stats.vacantProperties, color: 'hsl(var(--primary))' },
  ];

  const occupancyRate = stats.totalProperties > 0 
    ? ((stats.occupiedProperties / stats.totalProperties) * 100).toFixed(0)
    : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your rental properties.
          </p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary-dark"
          onClick={() => navigate('/properties')}
        >
          <Home className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Properties"
          value={stats.totalProperties.toString()}
          icon={Building2}
          trend={{ value: `${stats.occupiedProperties} occupied`, isPositive: true }}
          variant="default"
        />
        <StatCard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          icon={Home}
          trend={{ value: `${stats.occupiedProperties}/${stats.totalProperties}`, isPositive: stats.occupiedProperties > 0 }}
          variant="success"
        />
        <StatCard
          title="Rent Collected"
          value={`$${stats.totalRentCollected.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: `Expected: $${stats.totalRentExpected.toLocaleString()}`, isPositive: stats.totalRentCollected > 0 }}
          variant="success"
        />
        <StatCard
          title="Outstanding Rent"
          value={`$${stats.outstandingRent.toLocaleString()}`}
          icon={AlertCircle}
          trend={{ value: `${stats.overduePayments} overdue`, isPositive: false }}
          variant="danger"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Property Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {occupancyData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value} properties</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Expected Monthly Rent</span>
                  <span className="text-lg font-bold">${stats.totalRentExpected.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Rent Collected</span>
                  <span className="text-lg font-bold text-green-600">${stats.totalRentCollected.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: stats.totalRentExpected > 0 
                        ? `${(stats.totalRentCollected / stats.totalRentExpected) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Outstanding</span>
                  <span className="text-lg font-bold text-red-600">${stats.outstandingRent.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ 
                      width: stats.totalRentExpected > 0 
                        ? `${(stats.outstandingRent / stats.totalRentExpected) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unpaid Rent Table */}
      {unpaidRentList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Overdue Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold">Tenant</th>
                    <th className="text-left p-3 text-sm font-semibold">Property</th>
                    <th className="text-right p-3 text-sm font-semibold">Amount</th>
                    <th className="text-right p-3 text-sm font-semibold">Days Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidRentList.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.tenant_name}</td>
                      <td className="p-3 text-sm text-gray-600">{item.property_name}</td>
                      <td className="p-3 text-right font-semibold text-red-600">
                        ${item.amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          {item.days_overdue} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold">{stats.totalTenants}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vacant Properties</p>
                <p className="text-2xl font-bold">{stats.vacantProperties}</p>
              </div>
              <Home className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold">
                  {stats.totalRentExpected > 0 
                    ? ((stats.totalRentCollected / stats.totalRentExpected) * 100).toFixed(1) 
                    : '0'}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
