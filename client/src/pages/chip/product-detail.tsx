import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ChipProduct } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Trash2, Package, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function ChipProductDetail() {
  const [, params] = useRoute("/chip/products/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const productId = params?.id ? parseInt(params.id) : null;

  const { data: product, isLoading } = useQuery<ChipProduct>({
    queryKey: ["/api/chip/products", productId],
    enabled: !!productId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/chip/products/${productId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setLocation("/chip/products");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Product Not Found</h2>
              <p className="text-slate-600 mb-6">
                The product you're looking for doesn't exist or has been deleted.
              </p>
              <Button onClick={() => setLocation("/chip/products")} data-testid="button-back-to-products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isLowStock = product.lowStockAlert && product.currentStock < product.lowStockAlert;
  const stockValue = product.currentStock * parseFloat(product.averageCost || "0");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/chip/products")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                {product.name}
                {isLowStock && (
                  <Badge variant="destructive" className="ml-2" data-testid="badge-low-stock">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Low Stock
                  </Badge>
                )}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {product.sku && `SKU: ${product.sku}`}
                {product.category && ` | Category: ${product.category}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation(`/chip/products/${productId}/edit`)}
                data-testid="button-edit"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700"
                data-testid="button-delete"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Current Stock
                  </p>
                  <p className={`text-2xl font-bold ${isLowStock ? "text-red-600" : "text-slate-900"}`} data-testid="text-current-stock">
                    {product.currentStock} {product.unit || "units"}
                  </p>
                  {product.lowStockAlert > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Alert at: {product.lowStockAlert}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${isLowStock ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                  <Package className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Average Cost
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-avg-cost">
                    {parseFloat(product.averageCost || "0").toLocaleString()} {product.currency}
                  </p>
                  {product.sellingPrice && (
                    <p className="text-xs text-slate-500 mt-1">
                      Selling: {parseFloat(product.sellingPrice).toLocaleString()} {product.currency}
                    </p>
                  )}
                </div>
                <div className="bg-green-50 text-[#2AA448] p-3 rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Stock Value
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-stock-value">
                    {stockValue.toLocaleString()} AMD
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Total inventory value
                  </p>
                </div>
                <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Product Name</h4>
                <p className="text-base text-slate-900" data-testid="text-name">{product.name}</p>
              </div>

              {product.sku && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">SKU</h4>
                  <p className="text-base text-slate-900 font-mono" data-testid="text-sku">{product.sku}</p>
                </div>
              )}

              {product.category && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Category</h4>
                  <p className="text-base text-slate-900" data-testid="text-category">{product.category}</p>
                </div>
              )}

              {product.unit && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Unit</h4>
                  <p className="text-base text-slate-900" data-testid="text-unit">{product.unit}</p>
                </div>
              )}

              {product.supplierReference && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Supplier Reference</h4>
                  <p className="text-base text-slate-900" data-testid="text-supplier-ref">{product.supplierReference}</p>
                </div>
              )}

              {product.description && (
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Description</h4>
                  <p className="text-base text-slate-900" data-testid="text-description">{product.description}</p>
                </div>
              )}

              {product.notes && (
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Notes</h4>
                  <p className="text-base text-slate-900" data-testid="text-notes">{product.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock Movement History */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Movement History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-slate-500">
              <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm">Stock movement history will appear here</p>
              <p className="text-xs text-slate-400 mt-1">
                Track purchases and sales that affect inventory levels
              </p>
            </div>
            {/* TODO: Implement stock movement history table
            This would show:
            - Date
            - Type (Purchase/Sale)
            - Quantity change
            - Reference (PO#/SO#)
            - Running balance
            */}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone and
              will affect all related transactions and reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
