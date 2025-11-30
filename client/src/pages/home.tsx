import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchFilters } from "@/components/search-filters";
import { SupplierCard } from "@/components/supplier-card";
import { Send } from "lucide-react";
import type { Supplier } from "@shared/schema";
import type { SearchFilters as SearchFiltersType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<number>>(new Set());
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(true);
  const [sendViaEmail, setSendViaEmail] = useState(true);

  const { data: suppliers = [], isLoading, refetch } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.query) params.append('query', filters.query);
      if (filters.country) params.append('country', filters.country);
      if (filters.category) params.append('category', filters.category);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.minReputation) params.append('minReputation', filters.minReputation.toString());
      if (filters.workingStyle) params.append('workingStyle', filters.workingStyle);
      
      const url = `/api/suppliers${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { credentials: "include" });
      
      if (!res.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      
      return await res.json();
    },
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

  const sendBulkInquiryMutation = useMutation({
    mutationFn: async (data: { message: string; supplierIds: number[]; sendViaWhatsApp: boolean; sendViaEmail: boolean }) => {
      const response = await apiRequest("POST", "/api/inquiries", data);
      const jsonData = await response.json();
      return jsonData;
    },
    onSuccess: (response: { inquiry: any; sendingResults: Array<{ supplier: string; email?: string; whatsapp?: string; whatsappLink?: string; error?: string }> }) => {
      const results = response.sendingResults || [];
      
      results.forEach(result => {
        if (result.whatsappLink) {
          window.open(result.whatsappLink, '_blank');
        }
      });

      let description = "";
      results.forEach(result => {
        if (result.email === "sent") {
          description += `✓ Email sent to ${result.supplier}\n`;
        }
        if (result.whatsapp === "ready") {
          description += `✓ WhatsApp link opened for ${result.supplier}\n`;
        }
        if (result.error) {
          description += `✗ ${result.error}\n`;
        }
      });

      if (!description) {
        description = `Your inquiry has been sent to ${selectedSuppliers.size} supplier(s).`;
      }

      toast({
        title: "Inquiry processed",
        description: description.substring(0, 500),
      });
      setInquiryMessage("");
      setSelectedSuppliers(new Set());
    },
    onError: () => {
      toast({
        title: "Failed to send inquiry",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

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

    if (!sendViaWhatsApp && !sendViaEmail) {
      toast({
        title: "No channel selected",
        description: "Please select at least one communication channel.",
        variant: "destructive",
      });
      return;
    }

    sendBulkInquiryMutation.mutate({
      message: inquiryMessage,
      supplierIds: Array.from(selectedSuppliers),
      sendViaWhatsApp,
      sendViaEmail,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 -mx-6 -mt-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800 ml-[35px] mr-[35px] pl-[0px] pr-[0px]">Search & Filter Suppliers</h1>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">GY</span>
            </div>
            <span className="text-sm font-medium text-slate-700">Greg</span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={sendViaWhatsApp}
                      onCheckedChange={(checked) => setSendViaWhatsApp(checked === true)}
                    />
                    <span className="text-sm text-slate-700">Send via WhatsApp</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={sendViaEmail}
                      onCheckedChange={(checked) => setSendViaEmail(checked === true)}
                    />
                    <span className="text-sm text-slate-700">Send via Email</span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  {selectedSuppliers.size} suppliers selected
                </span>
                <Button 
                  onClick={handleBulkInquiry}
                  disabled={selectedSuppliers.size === 0 || !inquiryMessage.trim() || sendBulkInquiryMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendBulkInquiryMutation.isPending ? "Sending..." : "Send Inquiry"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
