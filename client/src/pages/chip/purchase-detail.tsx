import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ArrowLeft, Edit, Trash2, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { ChipPurchase, ChipPurchaseItem, ChipProduct, ChipSupplier } from "@shared/schema";
import { useState } from "react";

type PurchaseDetail = ChipPurchase & {
  items: (ChipPurchaseItem & {
    product?: ChipProduct;
  })[];
  supplier?: ChipSupplier;
};

export default function ChipPurchaseDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: purchase, isLoading } = useQuery<PurchaseDetail>({
    queryKey: ["/api/chip/purchases", id],
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/chip/purchases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/purchases"] });
      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
      });
      setLocation("/chip/purchases");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete purchase order",
        variant: "destructive",
      });
    },
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

  if (!purchase) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-600">Purchase order not found</p>
        </div>
      </div>
    );
  }

  const outstandingBalance = parseFloat(purchase.totalAmountAMD || "0") - parseFloat(purchase.paidAmount || "0");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/chip/purchases")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-[#2AA448]" />
                  {purchase.purchaseNumber}
                </h1>
                <p className="text-sm text-slate-600 mt-1">Purchase Order Details</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                data-testid="button-delete"
              >
                <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Purchase Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Purchase Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 mb-1">Supplier</p>
                <p className="text-sm font-medium" data-testid="text-supplier">
                  {purchase.supplier?.name || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 mb-1">Purchase Date</p>
                <p className="text-sm" data-testid="text-date">
                  {format(new Date(purchase.purchaseDate), "MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 mb-1">Total Amount</p>
                <p className="text-lg font-bold text-slate-900" data-testid="text-total">
                  {parseFloat(purchase.totalAmount || "0").toLocaleString()} {purchase.currency}
                </p>
                {purchase.currency !== "AMD" && (
                  <p className="text-sm text-slate-600">
                    {parseFloat(purchase.totalAmountAMD || "0").toLocaleString()} AMD
                  </p>
                )}
              </div>
              {purchase.notes && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 mb-1">Notes</p>
                  <p className="text-sm" data-testid="text-notes">{purchase.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 mb-1">Payment Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    purchase.paymentStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : purchase.paymentStatus === "partial"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                  data-testid="text-payment-status"
                >
                  {purchase.paymentStatus?.charAt(0).toUpperCase() + (purchase.paymentStatus?.slice(1) || "")}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 mb-1">Paid Amount</p>
                <p className="text-sm font-medium" data-testid="text-paid-amount">
                  {parseFloat(purchase.paidAmount || "0").toLocaleString()} AMD
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 mb-1">Outstanding Balance</p>
                <p className={`text-sm font-medium ${outstandingBalance > 0 ? "text-red-600" : "text-green-600"}`} data-testid="text-outstanding">
                  {outstandingBalance.toLocaleString()} AMD
                </p>
              </div>
              {purchase.paymentMethod && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 mb-1">Payment Method</p>
                  <p className="text-sm" data-testid="text-payment-method">{purchase.paymentMethod}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Serial Numbers</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.items?.map((item, index) => (
                    <TableRow key={item.id} data-testid={`row-item-${index}`}>
                      <TableCell className="font-medium">
                        {item.product?.name || "Unknown Product"}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {parseFloat(item.unitPrice || "0").toLocaleString()} {purchase.currency}
                      </TableCell>
                      <TableCell>
                        {item.serialNumbers && Array.isArray(item.serialNumbers) && item.serialNumbers.length > 0
                          ? item.serialNumbers.join(", ")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {parseFloat(item.totalPrice || "0").toLocaleString()} {purchase.currency}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete purchase order {purchase.purchaseNumber}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
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
