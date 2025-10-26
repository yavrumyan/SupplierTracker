import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import { FileText, Edit, Trash2, Download, CheckCircle } from "lucide-react";
import { ChipInvoice, ChipInvoiceItem, ChipCustomer } from "@shared/schema";
import { format } from "date-fns";
import { useState } from "react";

type InvoiceWithDetails = ChipInvoice & {
  items: ChipInvoiceItem[];
  customer?: ChipCustomer;
};

export default function ChipInvoiceDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: invoice, isLoading } = useQuery<InvoiceWithDetails>({
    queryKey: ["/api/chip/invoices", id],
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/chip/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/invoices"] });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      setLocation("/chip/invoices");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/chip/invoices/${id}`, {
        status: "paid",
        paidAmount: invoice?.total,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/chip/invoices"] });
      toast({
        title: "Success",
        description: "Invoice marked as paid",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleMarkAsPaid = () => {
    markAsPaidMutation.mutate();
  };

  const handleExportPDF = () => {
    toast({
      title: "Coming Soon",
      description: "PDF export functionality will be implemented soon",
    });
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

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center text-slate-500">
              Invoice not found
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="h-6 w-6 text-[#2AA448]" />
                Invoice {invoice.invoiceNumber}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Invoice details and line items
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportPDF}
                data-testid="button-export-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              {invoice.status !== "paid" && (
                <Button
                  onClick={handleMarkAsPaid}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={markAsPaidMutation.isPending}
                  data-testid="button-mark-paid"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-6">
        {/* Invoice Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Customer
                </p>
                <p className="text-base font-medium text-slate-900" data-testid="text-customer-name">
                  {invoice.customer?.name || "Unknown"}
                </p>
                {invoice.customer?.company && (
                  <p className="text-sm text-slate-600">{invoice.customer.company}</p>
                )}
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Status
                </p>
                <span 
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    invoice.status === "paid" ? "bg-green-100 text-green-800" :
                    invoice.status === "sent" ? "bg-blue-100 text-blue-800" :
                    invoice.status === "overdue" ? "bg-red-100 text-red-800" :
                    invoice.status === "cancelled" ? "bg-gray-100 text-gray-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}
                  data-testid="badge-invoice-status"
                >
                  {invoice.status}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Invoice Date
                </p>
                <p className="text-base text-slate-900" data-testid="text-invoice-date">
                  {format(new Date(invoice.invoiceDate), "MMMM d, yyyy")}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                  Due Date
                </p>
                <p className="text-base text-slate-900" data-testid="text-due-date">
                  {invoice.dueDate ? format(new Date(invoice.dueDate), "MMMM d, yyyy") : "Not set"}
                </p>
              </div>

              {invoice.notes && (
                <div className="md:col-span-2">
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-1">
                    Notes
                  </p>
                  <p className="text-base text-slate-900" data-testid="text-notes">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Line Items Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items?.map((item, index) => (
                    <TableRow key={item.id} data-testid={`row-item-${index}`}>
                      <TableCell data-testid={`text-item-description-${index}`}>
                        {item.description}
                      </TableCell>
                      <TableCell className="text-center" data-testid={`text-item-quantity-${index}`}>
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`text-item-unit-price-${index}`}>
                        {parseFloat(item.unitPrice || "0").toFixed(2)} {invoice.currency}
                      </TableCell>
                      <TableCell className="text-right font-medium" data-testid={`text-item-total-${index}`}>
                        {parseFloat(item.total || "0").toFixed(2)} {invoice.currency}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t pt-4">
              <div className="flex flex-col items-end space-y-2 max-w-sm ml-auto">
                <div className="flex justify-between w-full text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium" data-testid="text-subtotal">
                    {parseFloat(invoice.subtotal || "0").toFixed(2)} {invoice.currency}
                  </span>
                </div>
                <div className="flex justify-between w-full text-sm">
                  <span className="text-slate-600">VAT (20%):</span>
                  <span className="font-medium" data-testid="text-vat">
                    {parseFloat(invoice.vatAmount || "0").toFixed(2)} {invoice.currency}
                  </span>
                </div>
                <div className="flex justify-between w-full text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span data-testid="text-total">
                    {parseFloat(invoice.total || "0").toFixed(2)} {invoice.currency}
                  </span>
                </div>
                {invoice.paidAmount && parseFloat(invoice.paidAmount) > 0 && (
                  <div className="flex justify-between w-full text-sm text-green-600">
                    <span>Paid Amount:</span>
                    <span className="font-medium" data-testid="text-paid-amount">
                      {parseFloat(invoice.paidAmount).toFixed(2)} {invoice.currency}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/chip/invoices")}
            data-testid="button-back"
          >
            Back to Invoices
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setDeleteDialogOpen(true)}
            data-testid="button-delete"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {invoice.invoiceNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
