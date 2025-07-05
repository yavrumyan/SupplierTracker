import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchFilters } from "@/components/search-filters";
import { SupplierCard } from "@/components/supplier-card";
import { Send, LogOut, User } from "lucide-react";
import type { Supplier } from "@shared/schema";
import type { SearchFilters as SearchFiltersType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<number>>(new Set());
  const [inquiryMessage, setInquiryMessage] = useState("");

  const { data: suppliers = [], isLoading, refetch } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers", filters],
    enabled: false, // Only search when explicitly triggered
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

  const handleBulkInquiry = async () => {
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

    try {
      await apiRequest("POST", "/api/inquiries", {
        message: inquiryMessage,
        supplierIds: Array.from(selectedSuppliers),
      });

      toast({
        title: "Inquiry sent successfully",
        description: `Inquiry sent to ${selectedSuppliers.size} suppliers.`,
      });

      setSelectedSuppliers(new Set());
      setInquiryMessage("");
    } catch (error) {
      toast({
        title: "Failed to send inquiry",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 -mx-6 -mt-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Search & Filter Suppliers</h1>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">JD</span>
            </div>
            <span className="text-sm font-medium text-slate-700">John Doe</span>
          </div>
        </div>
      </div>

      {/* Search filters */}
      <SearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
      />

      {/* Search results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Search Results</CardTitle>
            <span className="text-sm text-slate-500">
              {suppliers.length} suppliers found
            </span>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-slate-500">Searching suppliers...</p>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No suppliers found. Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  isSelected={selectedSuppliers.has(supplier.id)}
                  onSelectionChange={(selected) => handleSupplierSelection(supplier.id, selected)}
                  showMatches={!!filters.query}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-supplier inquiry */}
      {suppliers.length > 0 && (
        <Card>
          <CardContent className="p-6 bg-slate-50">
            <h4 className="text-lg font-semibold text-slate-800 mb-4">
              Send Inquiry to Selected Suppliers
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Inquiry Message
                </label>
                <Textarea
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  rows={4}
                  placeholder="Enter your inquiry details..."
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  {selectedSuppliers.size} suppliers selected
                </span>
                <Button 
                  onClick={handleBulkInquiry}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={selectedSuppliers.size === 0 || !inquiryMessage.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Inquiry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
