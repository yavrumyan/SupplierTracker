import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, RefreshCw, Search, DollarSign, Save, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProductListItem {
  id: number;
  sku: string | null;
  productName: string;
  stock: number;
  transit: number;
  retailPriceUsd: string | null;
  retailPriceAmd: string | null;
  dealerPrice1: string | null;
  dealerPrice2: string | null;
  cost: string | null;
  latestPurchase: string | null;
  latestCost: string | null;
  aveSalesPrice: string | null;
  actualPrice: string | null;
  actualCost: string | null;
  supplier: string | null;
  lastUpdated: string;
}

export default function ActualProductPrices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [pendingChanges, setPendingChanges] = useState<Record<number, { actualPrice?: string; supplier?: string }>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const queryClient = useQueryClient();

  // Fetch product list data - only on manual rebuild
  const productListQuery = useQuery<ProductListItem[]>({
    queryKey: ['/api/compstyle/product-list'],
    enabled: false, // Disable automatic fetching
  });

  // Fetch suppliers for dropdown - only when needed
  const suppliersQuery = useQuery<any[]>({
    queryKey: ['/api/suppliers'],
    enabled: false, // Disable automatic fetching
  });

  // No automatic loading - suppliers will be loaded when product data is loaded

  // Rebuild product list mutation
  const rebuildMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/compstyle/product-list/rebuild'),
    onSuccess: () => {
      productListQuery.refetch();
      suppliersQuery.refetch(); // Load suppliers after product data is loaded
    }
  });

  // Batch save mutation
  const batchSaveMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/compstyle/product-list/batch-save', { changes: pendingChanges }),
    onSuccess: () => {
      setPendingChanges({});
      setHasUnsavedChanges(false);
      productListQuery.refetch();
    }
  });

  // CSV export mutation
  const exportCsvMutation = useMutation({
    mutationFn: () => fetch('/api/compstyle/product-list/export-csv').then(response => {
      if (!response.ok) throw new Error('Export failed');
      return response.blob();
    }),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-list-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  });

  const handleActualPriceChange = (productId: number, actualPrice: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [productId]: { ...prev[productId], actualPrice: actualPrice || "" }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSupplierChange = (productId: number, supplier: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [productId]: { ...prev[productId], supplier: supplier || "" }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = () => {
    batchSaveMutation.mutate();
  };

  const handleExportCsv = () => {
    exportCsvMutation.mutate();
  };

  // Filter products based on search query and merge with pending changes
  const filteredProducts = productListQuery.data?.filter(product =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  ).map(product => {
    const pendingChangesForProduct = pendingChanges[product.id];
    return {
      ...product,
      actualPrice: pendingChangesForProduct?.actualPrice !== undefined ? pendingChangesForProduct.actualPrice : product.actualPrice,
      supplier: pendingChangesForProduct?.supplier !== undefined ? pendingChangesForProduct.supplier : product.supplier
    };
  }) || [];

  const formatPrice = (price: string | null) => {
    if (!price) return "-";
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const getStockBadge = (stock: number, transit: number) => {
    if (stock > 0 && transit > 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800">In Stock + Transit</Badge>;
    } else if (stock > 0) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">In Stock</Badge>;
    } else if (transit > 0) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Transit Only</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-100 text-gray-600">Out of Stock</Badge>;
    }
  };

  // Show initial state when no data is loaded
  if (!productListQuery.data && !productListQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Actual Product Prices
          </CardTitle>
          <CardDescription>
            Click "Rebuild List" to load the comprehensive product catalog
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <Package className="h-16 w-16 mx-auto text-gray-400" />
            <p className="text-gray-600">Product data not loaded</p>
            <Button
              onClick={() => rebuildMutation.mutate()}
              disabled={rebuildMutation.isPending}
              size="lg"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${rebuildMutation.isPending ? 'animate-spin' : ''}`} />
              Rebuild List
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (productListQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Actual Product Prices
          </CardTitle>
          <CardDescription>Loading product data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Actual Product Prices
        </CardTitle>
        <CardDescription>
          Comprehensive product catalog with pricing data from all sources ({filteredProducts.length} products)
          {hasUnsavedChanges && (
            <span className="text-orange-600 font-medium"> • Unsaved changes</span>
          )}
        </CardDescription>
        
        {/* Controls */}
        <div className="flex gap-4 items-center mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || batchSaveMutation.isPending}
            variant={hasUnsavedChanges ? "default" : "outline"}
            size="sm"
          >
            <Save className={`h-4 w-4 mr-2 ${batchSaveMutation.isPending ? 'animate-spin' : ''}`} />
            Save Changes
          </Button>
          <Button
            onClick={handleExportCsv}
            disabled={exportCsvMutation.isPending}
            variant="outline"
            size="sm"
          >
            <Download className={`h-4 w-4 mr-2 ${exportCsvMutation.isPending ? 'animate-spin' : ''}`} />
            Export to CSV
          </Button>
          <Button
            onClick={() => rebuildMutation.mutate()}
            disabled={rebuildMutation.isPending}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${rebuildMutation.isPending ? 'animate-spin' : ''}`} />
            Rebuild List
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border overflow-auto max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-white">
              <TableRow>
                {/* Hidden: SKU, Status, Retail AMD, Dealer 2, Latest Cost, Avg Sales */}
                <TableHead className="min-w-[300px]">Product Name</TableHead>
                <TableHead className="w-20">Stock</TableHead>
                <TableHead className="w-20">Transit</TableHead>
                <TableHead className="w-24">Retail USD</TableHead>
                <TableHead className="w-24">Dealer 1</TableHead>
                <TableHead className="w-24">Cost</TableHead>
                <TableHead className="w-24">Latest Purchase</TableHead>
                <TableHead className="w-32">Actual Price</TableHead>
                <TableHead className="w-24">Actual Cost</TableHead>
                <TableHead className="w-40">Supplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50">
                  {/* Hidden: SKU, Status, Retail AMD, Dealer 2, Latest Cost, Avg Sales */}
                  <TableCell className="font-medium text-sm">{product.productName}</TableCell>
                  <TableCell className="text-center">{product.stock}</TableCell>
                  <TableCell className="text-center">{product.transit}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.retailPriceUsd)}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.dealerPrice1)}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.cost)}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.latestPurchase)}</TableCell>
                  <TableCell>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={product.actualPrice || ""}
                        onChange={(e) => handleActualPriceChange(product.id, e.target.value)}
                        className="pl-7 text-right text-xs h-8"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {product.actualCost ? formatPrice(product.actualCost) : "-"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={product.supplier || "none"}
                      onValueChange={(value) => handleSupplierChange(product.id, value === "none" ? "" : value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {suppliersQuery.data?.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.name}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? "No products found matching your search." : "No products available."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}