import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, TrendingDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StockItem {
  productName: string;
  purchaseQty: number;
  salesQty: number;
  currentStock: number;
  purchasePrice: number;
  salesPrice: number;
  purchaseValue: number;
  salesValue: number;
  netValue: number;
  lastUpdate: string;
}

export default function ChipInvoicesList() {
  const { data: stocks, isLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/chip/imported-products"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalCurrentStock = stocks?.reduce((sum, s) => sum + s.currentStock, 0) || 0;
  const totalNetValue = stocks?.reduce((sum, s) => sum + s.netValue, 0) || 0;
  const totalPurchaseQty = stocks?.reduce((sum, s) => sum + s.purchaseQty, 0) || 0;
  const totalSalesQty = stocks?.reduce((sum, s) => sum + s.salesQty, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#2AA448] rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Stock Inventory</h1>
          </div>
          <p className="text-slate-600">Real-time inventory tracking from imported invoices</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Current Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2AA448]">{totalCurrentStock.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Units in stock</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Received (Purchase)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalPurchaseQty.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Total received</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Issued (Sales)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{totalSalesQty.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Total issued</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Net Inventory Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalNetValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalNetValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} AMD
              </div>
              <p className="text-xs text-slate-500 mt-1">Purchase - Sales</p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Table */}
        {stocks && stocks.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{stocks.length} Products in Inventory</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200 bg-slate-50">
                      <TableHead className="font-semibold">Product Name (Armenian)</TableHead>
                      <TableHead className="text-right font-semibold">Purchase Qty</TableHead>
                      <TableHead className="text-right font-semibold">Sales Qty</TableHead>
                      <TableHead className="text-right font-semibold">Current Stock</TableHead>
                      <TableHead className="text-right font-semibold">Avg Buy Price (AMD)</TableHead>
                      <TableHead className="text-right font-semibold">Avg Sell Price (AMD)</TableHead>
                      <TableHead className="text-right font-semibold">Purchase Value (AMD)</TableHead>
                      <TableHead className="text-right font-semibold">Sales Value (AMD)</TableHead>
                      <TableHead className="text-right font-semibold">Net Value (AMD)</TableHead>
                      <TableHead className="text-center font-semibold">Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.map((stock, idx) => (
                      <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-900 max-w-xs">{stock.productName}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {stock.purchaseQty.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {stock.salesQty.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={stock.currentStock >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            <span className="flex items-center gap-1">
                              {stock.currentStock >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {stock.currentStock.toLocaleString()}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {stock.purchasePrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {stock.salesPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-slate-700 font-medium">
                          {stock.purchaseValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-slate-700 font-medium">
                          {stock.salesValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${stock.netValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.netValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-500">
                          {new Date(stock.lastUpdate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No stock data available</h3>
              <p className="text-slate-600">Upload invoice CSV files to see inventory here</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
