import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Search, 
  Filter, 
  Plus, 
  Star, 
  Globe, 
  Mail, 
  Phone, 
  MessageSquare,
  Send,
  Eye,
  Edit,
  Trash2,
  Building,
  MapPin,
  TrendingUp,
  Users,
  ChevronDown
} from "lucide-react";
import type { Supplier } from "@shared/schema";
import { COUNTRIES, CATEGORIES, BRANDS, WORKING_STYLES } from "@/lib/types";

interface SearchFilters {
  query?: string;
  country?: string;
  category?: string;
  brand?: string;
  minReputation?: number;
  workingStyle?: string;
}

export default function Suppliers() {
  const { toast } = useToast();
  const { user } = useAuth();
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

  // Handle unauthorized error
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

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
                <div className="flex items-center gap-1 ml-2">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  {supplier.reputation}/5
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/suppliers/${supplier.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Contact Information */}
          <div className="flex flex-wrap gap-2">
            {supplier.email && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                {supplier.email}
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                {supplier.phone}
              </div>
            )}
            {supplier.website && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Globe className="h-3 w-3" />
                {supplier.website}
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

          {/* Working Style */}
          {supplier.workingStyle && supplier.workingStyle.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {supplier.workingStyle.map((style) => (
                <Badge key={style} variant="outline" className="text-xs">
                  {style}
                </Badge>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your supplier relationships and find new partners
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button asChild>
            <Link href="/add-supplier">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Countries</p>
                <p className="text-2xl font-bold">
                  {new Set(suppliers.map(s => s.country)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. Reputation</p>
                <p className="text-2xl font-bold">
                  {suppliers.length > 0 
                    ? (suppliers.reduce((acc, s) => acc + (s.reputation || 0), 0) / suppliers.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold">{selectedSuppliers.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
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
                    <SelectItem value="">All Styles</SelectItem>
                    {WORKING_STYLES.map((style) => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.minReputation?.toString() || ""}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    minReputation: value ? parseInt(value) : undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Min Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Rating</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="2">2+ Stars</SelectItem>
                    <SelectItem value="1">1+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedSuppliers.size > 0 && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {selectedSuppliers.size} supplier{selectedSuppliers.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowInquiryPanel(!showInquiryPanel)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Inquiry
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedSuppliers(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>

            {showInquiryPanel && (
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Inquiry Message</label>
                    <Textarea
                      placeholder="Enter your inquiry message..."
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleBulkInquiry}
                      disabled={inquiryMutation.isPending}
                      className="flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send to {selectedSuppliers.size} Suppliers
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowInquiryPanel(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No suppliers found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or add your first supplier.
            </p>
            <Button asChild>
              <Link href="/add-supplier">
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(renderSupplierCard)}
        </div>
      )}
    </div>
  );
}