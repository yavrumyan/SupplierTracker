import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Truck, Plus, Edit, Trash2, Search, AlertCircle, TrendingDown } from "lucide-react";
import { Link } from "wouter";
import { ChipSupplier } from "@shared/schema";

export default function ChipSuppliers() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<ChipSupplier | null>(null);

  const { data: suppliers, isLoading } = useQuery<ChipSupplier[]>({
    queryKey: ["/api/chip/suppliers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/chip/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/suppliers"] });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (supplier: ChipSupplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (supplierToDelete) {
      deleteMutation.mutate(supplierToDelete.id);
    }
  };

  const filteredSuppliers = suppliers?.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.company && supplier.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const totalPayable = suppliers?.reduce(
    (sum, s) => sum + parseFloat(s.balance || "0"),
    0
  ) || 0;

  const overduePayments = suppliers?.filter(
    (s) => parseFloat(s.balance || "0") > 0
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
                <Truck className="h-6 w-6 text-[#2AA448]" />
                Suppliers
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Manage your supplier database and payables
              </p>
            </div>
            <Link href="/chip/suppliers/new">
              <Button className="bg-[#2AA448] hover:bg-[#239639]" data-testid="button-add-supplier">
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
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
                    Total Suppliers
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-total-suppliers">
                    {suppliers?.length || 0}
                  </p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Total Payable
                  </p>
                  <p className="text-2xl font-bold text-red-600" data-testid="text-total-payable">
                    {totalPayable.toLocaleString()} AMD
                  </p>
                </div>
                <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                  <TrendingDown className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Overdue Payments
                  </p>
                  <p className="text-2xl font-bold text-red-600" data-testid="text-overdue-payments">
                    {overduePayments}
                  </p>
                </div>
                <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, company, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-medium">Name</TableHead>
                    <TableHead className="font-medium">Company</TableHead>
                    <TableHead className="font-medium">Email</TableHead>
                    <TableHead className="font-medium">Phone</TableHead>
                    <TableHead className="font-medium text-right">Current Balance</TableHead>
                    <TableHead className="font-medium text-center">Payment Terms</TableHead>
                    <TableHead className="font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers && filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                      <TableRow
                        key={supplier.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => setLocation(`/chip/suppliers/${supplier.id}`)}
                        data-testid={`row-supplier-${supplier.id}`}
                      >
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.company || "—"}</TableCell>
                        <TableCell>{supplier.email || "—"}</TableCell>
                        <TableCell>{supplier.phone || "—"}</TableCell>
                        <TableCell className="text-right">
                          <span className={parseFloat(supplier.balance || "0") > 0 ? "text-red-600" : ""}>
                            {parseFloat(supplier.balance || "0").toLocaleString()} AMD
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {supplier.paymentTerms || 0} days
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/chip/suppliers/${supplier.id}/edit`)}
                              data-testid={`button-edit-${supplier.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(supplier)}
                              data-testid={`button-delete-${supplier.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        {searchQuery ? "No suppliers found matching your search" : "No suppliers yet. Add your first supplier to get started."}
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
        <AlertDialogContent data-testid="dialog-delete-supplier">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{supplierToDelete?.name}"? This action cannot be undone.
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
