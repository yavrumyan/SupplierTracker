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
import { FileText, Plus, Eye, Trash2, Search, DollarSign, AlertCircle, Calendar } from "lucide-react";
import { Link } from "wouter";
import { ChipInvoice, ChipCustomer } from "@shared/schema";
import { format } from "date-fns";

type InvoiceWithCustomer = ChipInvoice & {
  customer?: ChipCustomer;
};

export default function ChipInvoices() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<ChipInvoice | null>(null);

  const { data: invoices, isLoading } = useQuery<InvoiceWithCustomer[]>({
    queryKey: ["/api/chip/invoices"],
  });

  const { data: customers } = useQuery<ChipCustomer[]>({
    queryKey: ["/api/chip/customers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/chip/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/invoices"] });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (invoice: ChipInvoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (invoiceToDelete) {
      deleteMutation.mutate(invoiceToDelete.id);
    }
  };

  // Calculate stats
  const totalInvoices = invoices?.length || 0;

  const outstandingAmount = invoices?.filter(
    inv => inv.status !== "paid" && inv.status !== "cancelled"
  ).reduce((sum, inv) => sum + (parseFloat(inv.total || "0") - parseFloat(inv.paidAmount || "0")), 0) || 0;

  const paidThisMonth = invoices?.filter(inv => {
    const invDate = new Date(inv.invoiceDate);
    const now = new Date();
    return invDate.getMonth() === now.getMonth() && 
           invDate.getFullYear() === now.getFullYear() &&
           inv.status === "paid";
  }).reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0) || 0;

  // Filter invoices
  const filteredInvoices = invoices?.filter((invoice) => {
    const customer = customers?.find(c => c.id === invoice.customerId);
    const matchesSearch = searchQuery === "" ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer?.name && customer.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
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
                <FileText className="h-6 w-6 text-[#2AA448]" />
                Invoices
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Manage customer invoices and payments
              </p>
            </div>
            <Link href="/chip/invoices/new">
              <Button className="bg-[#2AA448] hover:bg-[#239639]" data-testid="button-add-invoice">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
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
                    Total Invoices
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-total-invoices">
                    {totalInvoices}
                  </p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Outstanding Amount
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-outstanding-amount">
                    {outstandingAmount.toLocaleString()} AMD
                  </p>
                </div>
                <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
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
                    Paid This Month
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-paid-this-month">
                    {paidThisMonth.toLocaleString()} AMD
                  </p>
                </div>
                <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by invoice number or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-invoice"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices && filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => {
                      const customer = customers?.find(c => c.id === invoice.customerId);
                      return (
                        <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                          <TableCell className="font-medium" data-testid={`text-invoice-number-${invoice.id}`}>
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell data-testid={`text-invoice-date-${invoice.id}`}>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {format(new Date(invoice.invoiceDate), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-due-date-${invoice.id}`}>
                            {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM d, yyyy") : "-"}
                          </TableCell>
                          <TableCell data-testid={`text-customer-${invoice.id}`}>
                            {customer?.name || "Unknown"}
                          </TableCell>
                          <TableCell className="text-right font-medium" data-testid={`text-amount-${invoice.id}`}>
                            {parseFloat(invoice.total || "0").toLocaleString()} {invoice.currency}
                          </TableCell>
                          <TableCell>
                            <span 
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                invoice.status === "paid" ? "bg-green-100 text-green-800" :
                                invoice.status === "sent" ? "bg-blue-100 text-blue-800" :
                                invoice.status === "overdue" ? "bg-red-100 text-red-800" :
                                invoice.status === "cancelled" ? "bg-gray-100 text-gray-800" :
                                "bg-yellow-100 text-yellow-800"
                              }`}
                              data-testid={`badge-status-${invoice.id}`}
                            >
                              {invoice.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLocation(`/chip/invoices/${invoice.id}`)}
                                data-testid={`button-view-${invoice.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(invoice)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                data-testid={`button-delete-${invoice.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                        No invoices found. Create your first invoice to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {invoiceToDelete?.invoiceNumber}? This action cannot be undone.
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
