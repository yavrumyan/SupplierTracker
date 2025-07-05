import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Building, TrendingUp, Users, Plus, Search } from "lucide-react";
import type { Supplier } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();

  // Fetch basic stats
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const stats = {
    totalSuppliers: suppliers.length,
    countries: new Set(suppliers.map(s => s.country)).size,
    avgReputation: suppliers.length > 0 
      ? (suppliers.reduce((acc, s) => acc + (s.reputation || 0), 0) / suppliers.length).toFixed(1)
      : '0.0',
    topCategories: suppliers.flatMap(s => s.categories || [])
      .reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
  };

  const topCategories = Object.entries(stats.topCategories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || user?.email || 'User'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-primary-foreground" />
              )}
            </div>
            <span className="text-sm font-medium">
              {user?.firstName || user?.email}
            </span>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold">{stats.totalSuppliers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Countries</p>
                <p className="text-2xl font-bold">{stats.countries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. Reputation</p>
                <p className="text-2xl font-bold">{stats.avgReputation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{topCategories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/suppliers">
                <Search className="h-4 w-4 mr-2" />
                Search & Filter Suppliers
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/add-supplier">
                <Plus className="h-4 w-4 mr-2" />
                Add New Supplier
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/suppliers">
                <Building className="h-4 w-4 mr-2" />
                View All Suppliers
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length > 0 ? (
              <div className="space-y-2">
                {topCategories.map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <Badge variant="secondary">{category}</Badge>
                    <span className="text-sm text-muted-foreground">{count} suppliers</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No suppliers added yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Welcome to SupHub! Here's how to get started with managing your suppliers:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">1. Add Suppliers</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Start by adding your existing suppliers with their contact information and capabilities.
                </p>
                <Button size="sm" asChild>
                  <Link href="/add-supplier">Add Supplier</Link>
                </Button>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">2. Search & Filter</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Use advanced search to find suppliers by country, category, brand, and reputation.
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/suppliers">Search Suppliers</Link>
                </Button>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">3. Manage Orders</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Create orders, track communications, and manage your procurement process.
                </p>
                <Button size="sm" variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}