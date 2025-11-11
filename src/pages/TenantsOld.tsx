import { useState } from "react";
import { Users, Plus, Search, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const tenants = [
  {
    id: 1,
    name: "John Doe",
    phone: "+1 234-567-8901",
    email: "john.doe@email.com",
    property: "Apartment 101, Building A",
    rentAmount: 1200,
    moveInDate: "Jan 15, 2024",
    status: "active",
    emergencyContact: "+1 234-567-8902",
  },
  {
    id: 2,
    name: "Jane Smith",
    phone: "+1 234-567-8903",
    email: "jane.smith@email.com",
    property: "House 23, Greenview",
    rentAmount: 1500,
    moveInDate: "Feb 1, 2024",
    status: "active",
    emergencyContact: "+1 234-567-8904",
  },
  {
    id: 3,
    name: "Mike Johnson",
    phone: "+1 234-567-8905",
    email: "mike.johnson@email.com",
    property: "Shop 5, Plaza Center",
    rentAmount: 2500,
    moveInDate: "Mar 10, 2024",
    status: "active",
    emergencyContact: "+1 234-567-8906",
  },
];

const Tenants = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground mt-1">
            Manage tenant information and assignments
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
                    <AvatarFallback>{getInitials(tenant.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{tenant.name}</CardTitle>
                    <span className="status-badge-success mt-1">{tenant.status}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{tenant.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{tenant.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{tenant.property}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Move-in: {tenant.moveInDate}</span>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Rent</span>
                  <span className="text-lg font-bold text-success">
                    ${tenant.rentAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <span className="text-xs text-muted-foreground">Emergency Contact</span>
                <p className="mt-1 text-sm font-medium">{tenant.emergencyContact}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Tenants;
