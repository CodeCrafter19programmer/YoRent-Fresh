import { useState } from "react";
import { DollarSign, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
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

const rentPayments = [
  {
    id: 1,
    tenant: "John Doe",
    property: "Apartment 101",
    month: "January 2025",
    amount: 1200,
    status: "paid",
    datePaid: "Jan 5, 2025",
  },
  {
    id: 2,
    tenant: "Jane Smith",
    property: "House 23",
    month: "January 2025",
    amount: 1500,
    status: "unpaid",
    datePaid: null,
  },
  {
    id: 3,
    tenant: "Mike Johnson",
    property: "Shop 5",
    month: "January 2025",
    amount: 2500,
    status: "unpaid",
    datePaid: null,
  },
  {
    id: 4,
    tenant: "John Doe",
    property: "Apartment 101",
    month: "December 2024",
    amount: 1200,
    status: "paid",
    datePaid: "Dec 3, 2024",
  },
  {
    id: 5,
    tenant: "Jane Smith",
    property: "House 23",
    month: "December 2024",
    amount: 1500,
    status: "paid",
    datePaid: "Dec 1, 2024",
  },
  {
    id: 6,
    tenant: "Sarah Williams",
    property: "Apartment 205",
    month: "January 2025",
    amount: 1100,
    status: "pending",
    datePaid: null,
  },
];

const RentManagement = () => {
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredPayments = rentPayments.filter((payment) => {
    const matchesMonth = filterMonth === "all" || payment.month.includes(filterMonth);
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
    return matchesMonth && matchesStatus;
  });

  const totalExpected = rentPayments
    .filter((p) => p.month === "January 2025")
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalCollected = rentPayments
    .filter((p) => p.month === "January 2025" && p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalOutstanding = totalExpected - totalCollected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rent Management</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage rent payments from all tenants
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Expected This Month"
          value={`$${totalExpected.toLocaleString()}`}
          icon={Calendar}
          variant="default"
        />
        <StatCard
          title="Collected This Month"
          value={`$${totalCollected.toLocaleString()}`}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Outstanding"
          value={`$${totalOutstanding.toLocaleString()}`}
          icon={XCircle}
          variant="danger"
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
                <SelectItem value="January 2025">January 2025</SelectItem>
                <SelectItem value="December 2024">December 2024</SelectItem>
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
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date Paid</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="font-medium">{payment.tenant}</td>
                    <td>{payment.property}</td>
                    <td>{payment.month}</td>
                    <td className="font-semibold">${payment.amount.toLocaleString()}</td>
                    <td>
                      {payment.status === "paid" && (
                        <span className="status-badge-success">
                          <CheckCircle className="mr-1 inline h-3 w-3" />
                          Paid
                        </span>
                      )}
                      {payment.status === "unpaid" && (
                        <span className="status-badge-danger">
                          <XCircle className="mr-1 inline h-3 w-3" />
                          Unpaid
                        </span>
                      )}
                      {payment.status === "pending" && (
                        <span className="status-badge-warning">
                          <Clock className="mr-1 inline h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td>{payment.datePaid || "-"}</td>
                    <td>
                      {payment.status !== "paid" && (
                        <Button size="sm" className="bg-success hover:bg-success/90">
                          Record Payment
                        </Button>
                      )}
                      {payment.status === "paid" && (
                        <Button variant="outline" size="sm">
                          View Receipt
                        </Button>
                      )}
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

export default RentManagement;
