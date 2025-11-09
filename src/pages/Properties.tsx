import { useState } from "react";
import { Building2, Plus, Search, MapPin, DollarSign, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const properties = [
  {
    id: 1,
    name: "Apartment 101",
    type: "Apartment",
    location: "Building A, Downtown",
    rent: 1200,
    status: "occupied",
    tenant: "John Doe",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
  },
  {
    id: 2,
    name: "House 23",
    type: "House",
    location: "Greenview Estate",
    rent: 1500,
    status: "occupied",
    tenant: "Jane Smith",
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    name: "Shop 5",
    type: "Commercial",
    location: "Plaza Center",
    rent: 2500,
    status: "available",
    tenant: null,
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop",
  },
  {
    id: 4,
    name: "Apartment 205",
    type: "Apartment",
    location: "Building B, Midtown",
    rent: 1100,
    status: "available",
    tenant: null,
    image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=400&h=300&fit=crop",
  },
];

const Properties = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProperties = properties.filter((property) => {
    const matchesStatus = filterStatus === "all" || property.status === filterStatus;
    const matchesSearch = property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your rental properties in one place
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
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
                <SelectItem value="available">Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden transition-all hover:shadow-lg">
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src={property.image}
                alt={property.name}
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
              <div className="absolute right-2 top-2">
                {property.status === "occupied" ? (
                  <span className="status-badge-success">Occupied</span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Available
                  </span>
                )}
              </div>
            </div>
            <CardHeader>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold">{property.name}</h3>
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                    {property.type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {property.location}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  <span className="text-2xl font-bold">${property.rent}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </div>
              {property.tenant && (
                <div className="rounded-md bg-muted p-2 text-sm">
                  <span className="text-muted-foreground">Tenant: </span>
                  <span className="font-medium">{property.tenant}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-danger hover:bg-danger-light">
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Properties;
