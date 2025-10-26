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
import { TrendingUp, Plus, Eye, Trash2, Search, DollarSign, Wallet } from "lucide-react";
import { Link } from "wouter";
import { ChipSale, ChipCustomer } from "@shared/schema";
import { format } from "date-fns";

type SaleWithCustomer = ChipSale & {
  customer?: ChipCustomer;
};

export default function ChipSales() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<ChipSale | null>(null);

  const { data: sales, isLoading } = useQuery<SaleWithCustomer[]>({
    queryKey: ["/api/chip/sales"],
  });

  const { data: customers } = useQuery<ChipCustomer[]>({
    queryKey: ["/api/chip/customers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/chip/sales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/sales"] });
      toast({
        title: "Success",
        description: "Sales order deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete sales order",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (sale: ChipSale) => {
    setSaleToDelete(sale);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (saleToDelete) {
      deleteMutation.mutate(saleToDelete.id);
    }
  };

  // Calculate stats
  const totalSales = sales?.reduce(
    (sum, s) => sum + parseFloat(s.totalAmountAMD || "0"),
    0
  ) || 0;

  const totalProfit = sales?.reduce(
    (sum, s) => sum + parseFloat(s.profit || "0"),
    0
  ) || 0;

  const thisMonthSales = sales?.filter(s => {
    const saleDate = new Date(s.saleDate);
    const now = new Date();
    return saleDate.getMonth() === now.getMonth() && 
           saleDate.getFullYear() === now.getFullYear();
  }).reduce((sum, s) => sum + parseFloat(s.totalAmountAMD || "0"), 0) || 0;

  // Filter sales
  const filteredSales = sales?.filter((sale) => {
    const customer = customers?.find(c => c.id === sale.customerId);
    const matchesSearch = searchQuery === "" ||
      sale.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer?.name && customer.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !statusFilter || sale.paymentStatus === statusFilter;
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
                <TrendingUp className="h-6 w-6 text-[#2AA448]" />
                Sales Orders
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Track and manage your customer sales
              </p>
            </div>
            <Link href="/chip/sales/new">
              <Button className="bg-[#2AA448] hover:bg-[#239639]" data-testid="button-add-sale">
                <Plus className="h-4 w-4 mr-2" />
                New Sale
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
                    Total Sales
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-total-sales">
                    {totalSales.toLocaleString()} AMD
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
                    Total Profit
                  </p>
                  <p className="text-2xl font-bold text-[#2AA448]" data-testid="text-total-profit">
                    {totalProfit.toLocaleString()} AMD
                  </p>
                </div>
                <div className="bg-green-50 text-[#2AA448] p-3 rounded-lg">
                  <Wallet className="h-5 w-5" />
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
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-month-sales">
                    {thisMonthSales.toLocaleString()} AMD
                  </p>
                </div>
                <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
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
                  placeholder="Search by sale number or customer..."
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
                  <TableHead className="font-medium">Sale #</TableHead>
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="font-medium">Customer</TableHead>
                  <TableHead className="font-medium">Amount</TableHead>
                  <TableHead className="font-medium">Currency</TableHead>
                  <TableHead className="font-medium">Profit</TableHead>
                  <TableHead className="font-medium">Payment Status</TableHead>
                  <TableHead className="font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales && filteredSales.length > 0 ? (
                  filteredSales.map((sale) => {
                    const customer = customers?.find(c => c.id === sale.customerId);
                    return (
                      <TableRow
                        key={sale.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => setLocation(`/chip/sales/${sale.id}`)}
                        data-testid={`row-sale-${sale.id}`}
                      >
                        <TableCell className="font-medium">
                          {sale.saleNumber}
                        </TableCell>
                        <TableCell>
                          {format(new Date(sale.saleDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{customer?.name || "Unknown"}</TableCell>
                        <TableCell>
                          {parseFloat(sale.totalAmount || "0").toLocaleString()}
                        </TableCell>
                        <TableCell>{sale.currency}</TableCell>
                        <TableCell className="font-medium text-[#2AA448]">
                          {parseFloat(sale.profit || "0").toLocaleString()} AMD
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              sale.paymentStatus === "paid"
                                ? "bg-green-100 text-green-800"
                                : sale.paymentStatus === "partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                            data-testid={`status-${sale.id}`}
                          >
                            {sale.paymentStatus?.charAt(0).toUpperCase() + (sale.paymentStatus?.slice(1) || "")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/chip/sales/${sale.id}`);
                              }}
                              data-testid={`button-view-${sale.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(sale);
                              }}
                              data-testid={`button-delete-${sale.id}`}
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
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      No sales orders found
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
            <AlertDialogTitle>Delete Sales Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete sales order{" "}
              <span className="font-semibold">{saleToDelete?.saleNumber}</span>?
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
