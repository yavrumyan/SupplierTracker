import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ChipSupplier } from "@shared/schema";
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
import { ArrowLeft, Edit, Trash2, DollarSign, ShoppingBag, CreditCard } from "lucide-react";
import { useState } from "react";

export default function ChipSupplierDetail() {
  const [, params] = useRoute("/chip/suppliers/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const supplierId = params?.id ? parseInt(params.id) : null;

  const { data: supplier, isLoading } = useQuery<ChipSupplier>({
    queryKey: ["/api/chip/suppliers", supplierId],
    enabled: !!supplierId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/chip/suppliers/${supplierId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/suppliers"] });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
      setLocation("/chip/suppliers");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

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

  if (!supplier) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-slate-600">Supplier not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/chip/suppliers")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Suppliers
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">{supplier.name}</h1>
              <p className="text-sm text-slate-600 mt-1">
                {supplier.company || "Individual Supplier"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation(`/chip/suppliers/${supplier.id}/edit`)}
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
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Supplier Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Name
                </p>
                <p className="text-sm text-slate-900" data-testid="text-name">{supplier.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Company
                </p>
                <p className="text-sm text-slate-900" data-testid="text-company">{supplier.company || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Email
                </p>
                <p className="text-sm text-slate-900" data-testid="text-email">{supplier.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Phone
                </p>
                <p className="text-sm text-slate-900" data-testid="text-phone">{supplier.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Address
                </p>
                <p className="text-sm text-slate-900" data-testid="text-address">{supplier.address || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Tax ID
                </p>
                <p className="text-sm text-slate-900" data-testid="text-tax-id">{supplier.taxId || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Payment Terms
                </p>
                <p className="text-sm text-slate-900" data-testid="text-payment-terms">
                  {supplier.paymentTerms || 0} days
                </p>
              </div>
              {supplier.notes && (
                <div className="col-span-2">
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-slate-900" data-testid="text-notes">{supplier.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Current Balance
                  </p>
                  <p className="text-2xl font-bold text-red-600" data-testid="text-current-balance">
                    {parseFloat(supplier.balance || "0").toLocaleString()} AMD
                  </p>
                </div>
                <div className="bg-red-50 text-red-600 p-3 rounded-lg">
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
                    Total Purchases
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-total-purchases">
                    0 AMD
                  </p>
                  <p className="text-xs text-slate-500 mt-1">0 transactions</p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                  <ShoppingBag className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Total Payments
                  </p>
                  <p className="text-2xl font-bold text-[#2AA448]" data-testid="text-total-payments">
                    0 AMD
                  </p>
                  <p className="text-xs text-slate-500 mt-1">0 payments</p>
                </div>
                <div className="bg-green-50 text-[#2AA448] p-3 rounded-lg">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase History */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Purchase Number</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No purchases recorded from this supplier yet
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No payments recorded to this supplier yet
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-supplier">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{supplier.name}"? This action cannot be undone and will remove all associated purchase and payment records.
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
