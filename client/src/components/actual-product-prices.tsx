import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, RefreshCw, Search, DollarSign } from "lucide-react";
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

  // Load data initially
  useEffect(() => {
    productListQuery.refetch();
    suppliersQuery.refetch();
  }, []);

  // Rebuild product list mutation
  const rebuildMutation = useMutation({
    mutationFn: () => apiRequest('/api/compstyle/product-list/rebuild', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      productListQuery.refetch();
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<ProductListItem> }) =>
      apiRequest(`/api/compstyle/product-list/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      productListQuery.refetch();
    }
  });

  const handleActualPriceChange = (productId: number, actualPrice: string) => {
    updateProductMutation.mutate({
      id: productId,
      updates: { actualPrice: actualPrice || null }
    });
  };

  const handleSupplierChange = (productId: number, supplier: string) => {
    updateProductMutation.mutate({
      id: productId,
      updates: { supplier: supplier || null }
    });
  };

  // Filter products based on search query
  const filteredProducts = productListQuery.data?.filter(product =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

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
                <TableHead className="w-20">SKU</TableHead>
                <TableHead className="min-w-[300px]">Product Name</TableHead>
                <TableHead className="w-20">Stock</TableHead>
                <TableHead className="w-20">Transit</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24">Retail USD</TableHead>
                <TableHead className="w-24">Retail AMD</TableHead>
                <TableHead className="w-24">Dealer 1</TableHead>
                <TableHead className="w-24">Dealer 2</TableHead>
                <TableHead className="w-24">Cost</TableHead>
                <TableHead className="w-24">Latest Purchase</TableHead>
                <TableHead className="w-24">Latest Cost</TableHead>
                <TableHead className="w-24">Avg Sales</TableHead>
                <TableHead className="w-32">Actual Price</TableHead>
                <TableHead className="w-24">Actual Cost</TableHead>
                <TableHead className="w-40">Supplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-xs">{product.sku || "-"}</TableCell>
                  <TableCell className="font-medium text-sm">{product.productName}</TableCell>
                  <TableCell className="text-center">{product.stock}</TableCell>
                  <TableCell className="text-center">{product.transit}</TableCell>
                  <TableCell>{getStockBadge(product.stock, product.transit)}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.retailPriceUsd)}</TableCell>
                  <TableCell className="text-right">{product.retailPriceAmd ? `֏${parseFloat(product.retailPriceAmd).toFixed(0)}` : "-"}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.dealerPrice1)}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.dealerPrice2)}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.cost)}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.latestPurchase)}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.latestCost)}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.aveSalesPrice)}</TableCell>
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