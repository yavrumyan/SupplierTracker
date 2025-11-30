import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Edit, Trash2, Search, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { ChipProduct } from "@shared/schema";

export default function ChipProducts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ChipProduct | null>(null);
  const [sortField, setSortField] = useState<keyof ChipProduct | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { data: products, isLoading } = useQuery<ChipProduct[]>({
    queryKey: ["/api/chip/products"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/chip/products/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (product: ChipProduct) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
    }
  };

  const handleSort = (field: keyof ChipProduct) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredProducts = products
    ?.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !categoryFilter || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const uniqueCategories = products
    ? Array.from(new Set(products.map((p) => p.category).filter(Boolean)))
    : [];

  const lowStockCount = products?.filter(
    (p) => p.lowStockAlert && p.currentStock < p.lowStockAlert
  ).length || 0;

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                <Package className="h-6 w-6 text-[#2AA448]" />
                Products & Inventory
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Manage your product catalog and stock levels
              </p>
            </div>
            <Link href="/chip/products/new">
              <Button className="bg-[#2AA448] hover:bg-[#239639]" data-testid="button-add-product">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Total Products
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-total-products">
                    {products?.length || 0}
                  </p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
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
                    Low Stock Items
                  </p>
                  <p className="text-2xl font-bold text-red-600" data-testid="text-low-stock">
                    {lowStockCount}
                  </p>
                </div>
                <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Total Stock Value
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-stock-value">
                    {products
                      ?.reduce(
                        (sum, p) =>
                          sum + (p.currentStock * parseFloat(p.averageCost || "0")),
                        0
                      )
                      .toLocaleString()}{" "}
                    AMD
                  </p>
                </div>
                <div className="bg-green-50 text-[#2AA448] p-3 rounded-lg">
                  <Package className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 px-3 rounded-md border border-slate-300 bg-white text-sm"
                data-testid="select-category"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("name")}
                    data-testid="header-name"
                  >
                    Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100 text-right"
                    onClick={() => handleSort("currentStock")}
                    data-testid="header-stock"
                  >
                    Current Stock {sortField === "currentStock" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="text-right" data-testid="header-actions">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts && filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const isLowStock = product.lowStockAlert && product.currentStock < product.lowStockAlert;
                    return (
                      <TableRow
                        key={product.id}
                        className={`cursor-pointer hover:bg-slate-50 ${
                          isLowStock ? "bg-red-50" : ""
                        }`}
                        onClick={() => setLocation(`/chip/products/${product.id}`)}
                        data-testid={`row-product-${product.id}`}
                      >
                        <TableCell className="font-medium" data-testid={`cell-name-${product.id}`}>
                          {product.name}
                          {isLowStock && (
                            <Badge variant="destructive" className="ml-2">
                              Low Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={`text-right ${isLowStock ? "text-red-600 font-semibold" : ""}`} data-testid={`cell-stock-${product.id}`}>
                          {product.currentStock}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Link href={`/chip/products/${product.id}/edit`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-edit-${product.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(product)}
                              data-testid={`button-delete-${product.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                      {searchQuery || categoryFilter
                        ? "No products match your filters"
                        : "No products found. Add your first product to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be
              undone and will affect all related transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
