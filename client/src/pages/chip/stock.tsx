import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { ChipProduct } from "@shared/schema";

export default function ChipStock() {
  const { data: products, isLoading } = useQuery<ChipProduct[]>({
    queryKey: ["/api/chip/products"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const stockItems = products?.filter(p => p.currentStock > 0) || [];

  const totalStockValue = stockItems.reduce((sum, item) => {
    const itemValue = (parseFloat(item.averageCost || "0") || 0) * item.currentStock;
    return sum + itemValue;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-8 w-8 text-[#2AA448]" />
            <h1 className="text-3xl font-bold text-slate-900">Current Stock</h1>
          </div>
          <p className="text-slate-600">All purchased products currently in inventory</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 mb-1">Total Items in Stock</p>
              <p className="text-3xl font-bold text-[#2AA448]">{stockItems.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 mb-1">Total Units</p>
              <p className="text-3xl font-bold text-blue-600">
                {stockItems.reduce((sum, item) => sum + item.currentStock, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 mb-1">Stock Value (AMD)</p>
              <p className="text-3xl font-bold text-amber-600">
                {totalStockValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Table */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Product Name</TableHead>
                    <TableHead className="font-semibold">SKU</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="text-right font-semibold">Current Stock</TableHead>
                    <TableHead className="text-right font-semibold">Unit Price (AMD)</TableHead>
                    <TableHead className="text-right font-semibold">Avg Cost (AMD)</TableHead>
                    <TableHead className="text-right font-semibold">Stock Value (AMD)</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        No items in stock
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockItems.map((product) => {
                      const itemValue = (parseFloat(product.averageCost || "0") || 0) * product.currentStock;
                      const isLowStock = product.lowStockAlert && product.currentStock < product.lowStockAlert;
                      
                      return (
                        <TableRow key={product.id} className="hover:bg-slate-50">
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-slate-600">{product.sku || "-"}</TableCell>
                          <TableCell className="text-slate-600">{product.category || "-"}</TableCell>
                          <TableCell className="text-right font-semibold">{product.currentStock}</TableCell>
                          <TableCell className="text-right">
                            {product.unitPrice ? parseFloat(product.unitPrice).toLocaleString() : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.averageCost ? parseFloat(product.averageCost).toLocaleString() : "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-[#2AA448]">
                            {itemValue.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {isLowStock ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                In Stock
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
