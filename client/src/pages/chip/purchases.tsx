import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ShoppingCart, Plus, Eye, Trash2, Search, DollarSign, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { ChipPurchase, ChipSupplier } from "@shared/schema";
import { format } from "date-fns";

type PurchaseWithSupplier = ChipPurchase & {
  supplier?: ChipSupplier;
};

export default function ChipPurchases() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<ChipPurchase | null>(null);

  const { data: purchases, isLoading } = useQuery<PurchaseWithSupplier[]>({
    queryKey: ["/api/chip/purchases"],
  });

  const { data: suppliers } = useQuery<ChipSupplier[]>({
    queryKey: ["/api/chip/suppliers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/chip/purchases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/purchases"] });
      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
      });
      setDeleteDialogOpen(false);
      setPurchaseToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete purchase order",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (purchase: ChipPurchase) => {
    setPurchaseToDelete(purchase);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (purchaseToDelete) {
      deleteMutation.mutate(purchaseToDelete.id);
    }
  };

  // Calculate stats
  const totalPurchases = purchases?.reduce(
    (sum, p) => sum + parseFloat(p.totalAmountAMD || "0"),
    0
  ) || 0;

  const pendingPayments = purchases?.filter(
    p => p.paymentStatus === "unpaid" || p.paymentStatus === "partial"
  ).reduce((sum, p) => sum + (parseFloat(p.totalAmountAMD || "0") - parseFloat(p.paidAmount || "0")), 0) || 0;

  const thisMonthPurchases = purchases?.filter(p => {
    const purchaseDate = new Date(p.purchaseDate);
    const now = new Date();
    return purchaseDate.getMonth() === now.getMonth() && 
           purchaseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + parseFloat(p.totalAmountAMD || "0"), 0) || 0;

  // Filter purchases
  const filteredPurchases = purchases?.filter((purchase) => {
    const supplier = suppliers?.find(s => s.id === purchase.supplierId);
    const matchesSearch = searchQuery === "" ||
      purchase.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier?.name && supplier.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !statusFilter || purchase.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-[#2AA448]" />
                Purchase Orders
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Track and manage your supplier purchases
              </p>
            </div>
            <Link href="/chip/purchases/new">
              <Button className="bg-[#2AA448] hover:bg-[#239639]" data-testid="button-add-purchase">
                <Plus className="h-4 w-4 mr-2" />
                New Purchase
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
                    Total Purchases
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-total-purchases">
                    {totalPurchases.toLocaleString()} AMD
                  </p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
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
                    Pending Payments
                  </p>
                  <p className="text-2xl font-bold text-red-600" data-testid="text-pending-payments">
                    {pendingPayments.toLocaleString()} AMD
                  </p>
                </div>
                <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-[#2AA448]" data-testid="text-month-purchases">
                    {thisMonthPurchases.toLocaleString()} AMD
                  </p>
                </div>
                <div className="bg-green-50 text-[#2AA448] p-3 rounded-lg">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by purchase number or supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-medium">Purchase #</TableHead>
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="font-medium">Supplier</TableHead>
                  <TableHead className="font-medium">Amount</TableHead>
                  <TableHead className="font-medium">Currency</TableHead>
                  <TableHead className="font-medium">Payment Status</TableHead>
                  <TableHead className="font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases && filteredPurchases.length > 0 ? (
                  filteredPurchases.map((purchase) => {
                    const supplier = suppliers?.find(s => s.id === purchase.supplierId);
                    return (
                      <TableRow
                        key={purchase.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => setLocation(`/chip/purchases/${purchase.id}`)}
                        data-testid={`row-purchase-${purchase.id}`}
                      >
                        <TableCell className="font-medium">
                          {purchase.purchaseNumber}
                        </TableCell>
                        <TableCell>
                          {format(new Date(purchase.purchaseDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{supplier?.name || "Unknown"}</TableCell>
                        <TableCell>
                          {parseFloat(purchase.totalAmount || "0").toLocaleString()}
                        </TableCell>
                        <TableCell>{purchase.currency}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              purchase.paymentStatus === "paid"
                                ? "bg-green-100 text-green-800"
                                : purchase.paymentStatus === "partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                            data-testid={`status-${purchase.id}`}
                          >
                            {purchase.paymentStatus?.charAt(0).toUpperCase() + (purchase.paymentStatus?.slice(1) || "")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/chip/purchases/${purchase.id}`);
                              }}
                              data-testid={`button-view-${purchase.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(purchase);
                              }}
                              data-testid={`button-delete-${purchase.id}`}
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
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No purchase orders found
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete purchase order{" "}
              <span className="font-semibold">{purchaseToDelete?.purchaseNumber}</span>?
              This action cannot be undone.
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
