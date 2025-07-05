import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  LogOut, 
  User, 
  Building, 
  TrendingUp, 
  Users, 
  Plus, 
  Search, 
  Filter,
  Star, 
  Globe, 
  Mail, 
  Phone, 
  MessageSquare,
  Send,
  Eye,
  Edit,
  Trash2,
  MapPin,
  ChevronDown
} from "lucide-react";
import type { Supplier } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { COUNTRIES, CATEGORIES, BRANDS, WORKING_STYLES } from "@/lib/types";

interface SearchFilters {
  query?: string;
  country?: string;
  category?: string;
  brand?: string;
  minReputation?: number;
  workingStyle?: string;
}

export default function Home() {
  const { toast } = useToast();
  const { user } = useAuth() as { user: any };
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<number>>(new Set());
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showInquiryPanel, setShowInquiryPanel] = useState(false);

  // Fetch suppliers with filters
  const { data: suppliers = [], isLoading, error, refetch } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers", filters],
    enabled: true,
  });

  // Fetch all orders for total order volume calculation
  const { data: allOrders = [] } = useQuery({
    queryKey: ["/api/orders/all"],
    queryFn: async () => {
      const response = await fetch("/api/orders/all", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      return apiRequest("DELETE", `/api/suppliers/${supplierId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete supplier. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk inquiry mutation
  const inquiryMutation = useMutation({
    mutationFn: async (data: { message: string; supplierIds: number[] }) => {
      return apiRequest("POST", "/api/inquiries", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Inquiry sent to ${selectedSuppliers.size} suppliers`,
      });
      setSelectedSuppliers(new Set());
      setInquiryMessage("");
      setShowInquiryPanel(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleSearch = () => {
    refetch();
  };

  const handleSupplierSelection = (supplierId: number, selected: boolean) => {
    const newSelection = new Set(selectedSuppliers);
    if (selected) {
      newSelection.add(supplierId);
    } else {
      newSelection.delete(supplierId);
    }
    setSelectedSuppliers(newSelection);
  };

  const handleDeleteSupplier = (supplierId: number, supplierName: string) => {
    if (window.confirm(`Are you sure you want to delete "${supplierName}"? This action cannot be undone.`)) {
      deleteSupplierMutation.mutate(supplierId);
    }
  };

  const handleBulkInquiry = () => {
    if (selectedSuppliers.size === 0) {
      toast({
        title: "No suppliers selected",
        description: "Please select at least one supplier to send inquiry.",
        variant: "destructive",
      });
      return;
    }

    if (!inquiryMessage.trim()) {
      toast({
        title: "No message provided",
        description: "Please enter an inquiry message.",
        variant: "destructive",
      });
      return;
    }

    inquiryMutation.mutate({
      message: inquiryMessage,
      supplierIds: Array.from(selectedSuppliers),
    });
  };

  const stats = {
    totalSuppliers: suppliers.length,
    countries: new Set(suppliers.map(s => s.country)).size,
    totalOrderVolume: allOrders.reduce((total: number, order: any) => total + (order.totalAmount || 0), 0),
    topCategories: suppliers.flatMap(s => s.categories || [])
      .reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
  };

  const topCategories = Object.entries(stats.topCategories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const renderSupplierCard = (supplier: Supplier) => (
    <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedSuppliers.has(supplier.id)}
              onCheckedChange={(checked) => 
                handleSupplierSelection(supplier.id, checked as boolean)
              }
            />
            <div>
              <CardTitle className="text-lg">{supplier.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {supplier.country}
                {supplier.reputation && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {supplier.reputation}/10
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/suppliers/${supplier.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/edit-supplier?id=${supplier.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {supplier.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{supplier.email}</span>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{supplier.phone}</span>
              </div>
            )}
            {supplier.website && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="truncate">{supplier.website}</span>
              </div>
            )}
            {supplier.whatsapp && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>{supplier.whatsapp}</span>
              </div>
            )}
          </div>

          {/* Categories */}
          {supplier.categories && supplier.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {supplier.categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
              {supplier.categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{supplier.categories.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Brands */}
          {supplier.brands && supplier.brands.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {supplier.brands.slice(0, 3).map((brand) => (
                <Badge key={brand} variant="outline" className="text-xs">
                  {brand}
                </Badge>
              ))}
              {supplier.brands.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{supplier.brands.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

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
                <p className="text-sm text-muted-foreground">Total Order Volume</p>
                <p className="text-2xl font-bold">${stats.totalOrderVolume.toLocaleString()}</p>
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Supplier Search</h2>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/add-supplier">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search suppliers by name, email, or phone..."
                value={filters.query || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                className="w-full"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Select
                  value={filters.country || ""}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, country: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Countries</SelectItem>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.category || ""}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, category: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.brand || ""}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, brand: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Brands</SelectItem>
                    {BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.workingStyle || ""}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, workingStyle: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Working Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Working Styles</SelectItem>
                    {WORKING_STYLES.map((style) => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="Min Reputation"
                  value={filters.minReputation || ""}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    minReputation: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  min="0"
                  max="10"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Suppliers {suppliers.length > 0 && `(${suppliers.length} found)`}
          </h2>
          {selectedSuppliers.size > 0 && (
            <Button
              onClick={() => setShowInquiryPanel(true)}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send Inquiry to {selectedSuppliers.size} suppliers
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Searching suppliers...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No suppliers found. Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(renderSupplierCard)}
          </div>
        )}
      </div>

      {/* Bulk Inquiry Panel */}
      {showInquiryPanel && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Send Inquiry to {selectedSuppliers.size} suppliers</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInquiryPanel(false)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your inquiry message..."
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleBulkInquiry}
                disabled={inquiryMutation.isPending}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {inquiryMutation.isPending ? "Sending..." : "Send Inquiry"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowInquiryPanel(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}