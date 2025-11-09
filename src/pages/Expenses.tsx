import { useState } from "react";
import { Receipt, Plus, TrendingDown, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/StatCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const expenses = [
  {
    id: 1,
    property: "Apartment 101",
    category: "Repairs",
    description: "Fixed broken water heater",
    amount: 450,
    date: "Jan 12, 2025",
  },
  {
    id: 2,
    property: "House 23",
    category: "Maintenance",
    description: "Lawn care and landscaping",
    amount: 120,
    date: "Jan 8, 2025",
  },
  {
    id: 3,
    property: "Shop 5",
    category: "Utilities",
    description: "Water bill - January",
    amount: 85,
    date: "Jan 5, 2025",
  },
  {
    id: 4,
    property: "Building A",
    category: "Cleaning",
    description: "Common area cleaning",
    amount: 200,
    date: "Jan 15, 2025",
  },
  {
    id: 5,
    property: "Apartment 205",
    category: "Repairs",
    description: "Fixed leaking faucet",
    amount: 75,
    date: "Jan 18, 2025",
  },
];

const monthlyExpenses = [
  { month: "Jan", amount: 930 },
  { month: "Feb", amount: 780 },
  { month: "Mar", amount: 1200 },
  { month: "Apr", amount: 650 },
  { month: "May", amount: 890 },
  { month: "Jun", amount: 1100 },
];

const Expenses = () => {
  const [filterCategory, setFilterCategory] = useState("all");

  const filteredExpenses = expenses.filter(
    (expense) => filterCategory === "all" || expense.category === filterCategory
  );

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const avgMonthlyExpenses = monthlyExpenses.reduce((sum, m) => sum + m.amount, 0) / monthlyExpenses.length;

  // Calculate rent collected vs expenses (mock data)
  const rentCollected = 49000;
  const profit = rentCollected - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage property-related expenses
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Total Expenses (Jan)"
          value={`$${totalExpenses.toLocaleString()}`}
          icon={Receipt}
          variant="danger"
        />
        <StatCard
          title="Average Monthly"
          value={`$${Math.round(avgMonthlyExpenses).toLocaleString()}`}
          icon={TrendingDown}
          variant="warning"
        />
        <StatCard
          title="Net Profit (Jan)"
          value={`$${profit.toLocaleString()}`}
          icon={DollarSign}
          variant="success"
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
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Bar dataKey="amount" fill="hsl(var(--danger))" radius={[8, 8, 0, 0]} />
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
              <SelectItem value="Repairs">Repairs</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Utilities">Utilities</SelectItem>
              <SelectItem value="Cleaning">Cleaning</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Property</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {expense.date}
                      </div>
                    </td>
                    <td className="font-medium">{expense.property}</td>
                    <td>
                      <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                        {expense.category}
                      </span>
                    </td>
                    <td>{expense.description}</td>
                    <td className="font-semibold text-danger">
                      ${expense.amount.toLocaleString()}
                    </td>
                    <td>
                      <Button variant="outline" size="sm">
                        View Receipt
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

export default Expenses;
