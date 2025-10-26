import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ChipCustomer } from "@shared/schema";
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
import { ArrowLeft, Edit, Trash2, DollarSign, ShoppingCart, CreditCard } from "lucide-react";
import { useState } from "react";

export default function ChipCustomerDetail() {
  const [, params] = useRoute("/chip/customers/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const customerId = params?.id ? parseInt(params.id) : null;

  const { data: customer, isLoading } = useQuery<ChipCustomer>({
    queryKey: ["/api/chip/customers", customerId],
    enabled: !!customerId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/chip/customers/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/customers"] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      setLocation("/chip/customers");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete customer",
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

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-slate-600">Customer not found</p>
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
            onClick={() => setLocation("/chip/customers")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">{customer.name}</h1>
              <p className="text-sm text-slate-600 mt-1">
                {customer.company || "Individual Customer"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation(`/chip/customers/${customer.id}/edit`)}
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
        {/* Customer Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Name
                </p>
                <p className="text-sm text-slate-900" data-testid="text-name">{customer.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Company
                </p>
                <p className="text-sm text-slate-900" data-testid="text-company">{customer.company || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Email
                </p>
                <p className="text-sm text-slate-900" data-testid="text-email">{customer.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Phone
                </p>
                <p className="text-sm text-slate-900" data-testid="text-phone">{customer.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Address
                </p>
                <p className="text-sm text-slate-900" data-testid="text-address">{customer.address || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Tax ID
                </p>
                <p className="text-sm text-slate-900" data-testid="text-tax-id">{customer.taxId || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Payment Terms
                </p>
                <p className="text-sm text-slate-900" data-testid="text-payment-terms">
                  {customer.paymentTerms || 0} days
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Credit Limit
                </p>
                <p className="text-sm text-slate-900" data-testid="text-credit-limit">
                  {parseFloat(customer.creditLimit || "0").toLocaleString()} AMD
                </p>
              </div>
              {customer.notes && (
                <div className="col-span-2">
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-slate-900" data-testid="text-notes">{customer.notes}</p>
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
                    {parseFloat(customer.balance || "0").toLocaleString()} AMD
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
                    Total Sales
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-total-sales">
                    0 AMD
                  </p>
                  <p className="text-xs text-slate-500 mt-1">0 transactions</p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                  <ShoppingCart className="h-5 w-5" />
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

        {/* Sales History */}
        <Card>
          <CardHeader>
            <CardTitle>Sales History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Sale Number</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No sales recorded for this customer yet
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
                    No payments recorded for this customer yet
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-customer">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{customer.name}"? This action cannot be undone and will remove all associated sales and payment records.
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
