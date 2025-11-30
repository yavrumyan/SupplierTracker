import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ImportedProduct {
  id: number;
  invoiceType: 'purchase' | 'sales';
  invoiceNumber: string;
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  vatAmount: string;
  hsCode?: string;
  issueDate: string;
}

export default function ChipInvoicesList() {
  const { data: products, isLoading } = useQuery<ImportedProduct[]>({
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

  const purchaseProducts = products?.filter(p => p.invoiceType === 'purchase') || [];
  const salesProducts = products?.filter(p => p.invoiceType === 'sales') || [];
  const totalQuantity = products?.reduce((sum, p) => sum + p.quantity, 0) || 0;
  const totalValue = products?.reduce((sum, p) => sum + parseFloat(p.lineTotal), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#2AA448] rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Imported Products</h1>
          </div>
          <p className="text-slate-600">All products from imported tax invoices</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products?.length || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Across all invoices</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Units across all items</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} AMD</div>
              <p className="text-xs text-slate-500 mt-1">Including VAT</p>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Invoices Section */}
        {purchaseProducts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Purchase</Badge>
              <h2 className="text-xl font-semibold">{purchaseProducts.length} Products Received</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200">
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Product Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price (AMD)</TableHead>
                      <TableHead className="text-right">Total (AMD)</TableHead>
                      <TableHead className="text-right">VAT (AMD)</TableHead>
                      <TableHead>HS Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseProducts.map((product) => (
                      <TableRow key={product.id} className="border-b border-slate-100">
                        <TableCell className="font-medium text-slate-900">{product.invoiceNumber}</TableCell>
                        <TableCell className="text-slate-700">{product.description}</TableCell>
                        <TableCell className="text-right">{product.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{parseFloat(product.unitPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-medium">{parseFloat(product.lineTotal).toLocaleString('en-US', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right text-slate-600">{parseFloat(product.vatAmount).toLocaleString('en-US', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-sm text-slate-500">{product.hsCode || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sales Invoices Section */}
        {salesProducts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Sales</Badge>
              <h2 className="text-xl font-semibold">{salesProducts.length} Products Issued</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200">
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Product Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price (AMD)</TableHead>
                      <TableHead className="text-right">Total (AMD)</TableHead>
                      <TableHead className="text-right">VAT (AMD)</TableHead>
                      <TableHead>HS Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesProducts.map((product) => (
                      <TableRow key={product.id} className="border-b border-slate-100">
                        <TableCell className="font-medium text-slate-900">{product.invoiceNumber}</TableCell>
                        <TableCell className="text-slate-700">{product.description}</TableCell>
                        <TableCell className="text-right">{product.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{parseFloat(product.unitPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-medium">{parseFloat(product.lineTotal).toLocaleString('en-US', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right text-slate-600">{parseFloat(product.vatAmount).toLocaleString('en-US', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-sm text-slate-500">{product.hsCode || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {!products || products.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No products imported yet</h3>
              <p className="text-slate-600">Upload invoice CSV files to see imported products here</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
