import { Building2, Users, DollarSign, TrendingUp, Home, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "recharts";

const rentData = [
  { month: "Jan", collected: 45000, expected: 50000 },
  { month: "Feb", collected: 48000, expected: 50000 },
  { month: "Mar", collected: 50000, expected: 50000 },
  { month: "Apr", collected: 47000, expected: 52000 },
  { month: "May", collected: 52000, expected: 52000 },
  { month: "Jun", collected: 49000, expected: 54000 },
];

const occupancyData = [
  { name: "Occupied", value: 18, color: "hsl(var(--success))" },
  { name: "Available", value: 7, color: "hsl(var(--primary))" },
];

const unpaidRentList = [
  { tenant: "John Doe", property: "Apt 101, Building A", amount: 1200, daysOverdue: 5 },
  { tenant: "Jane Smith", property: "House 23, Greenview", amount: 1500, daysOverdue: 12 },
  { tenant: "Mike Johnson", property: "Shop 5, Plaza Center", amount: 2500, daysOverdue: 3 },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your rental properties.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-dark">
          <Home className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Properties"
          value="25"
          icon={Building2}
          trend={{ value: "2", isPositive: true }}
          variant="default"
        />
        <StatCard
          title="Occupied Properties"
          value="18"
          icon={Home}
          trend={{ value: "72%", isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Rent Collected"
          value="$49,000"
          icon={DollarSign}
          trend={{ value: "$4,500", isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Outstanding Rent"
          value="$5,200"
          icon={AlertCircle}
          trend={{ value: "$800", isPositive: false }}
          variant="danger"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rent Collection (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="collected" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expected" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Occupancy</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Unpaid Rent Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-danger" />
            Unpaid Rent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Amount</th>
                  <th>Days Overdue</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {unpaidRentList.map((item, index) => (
                  <tr key={index}>
                    <td className="font-medium">{item.tenant}</td>
                    <td>{item.property}</td>
                    <td className="font-semibold text-danger">${item.amount.toLocaleString()}</td>
                    <td>
                      <span className="status-badge-danger">{item.daysOverdue} days</span>
                    </td>
                    <td>
                      <Button variant="outline" size="sm">
                        Send Reminder
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
