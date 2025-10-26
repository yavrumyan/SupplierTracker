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
import { Users, Plus, Edit, Trash2, Search, AlertCircle, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { ChipCustomer } from "@shared/schema";

export default function ChipCustomers() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<ChipCustomer | null>(null);

  const { data: customers, isLoading } = useQuery<ChipCustomer[]>({
    queryKey: ["/api/chip/customers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/chip/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/customers"] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (customer: ChipCustomer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
    }
  };

  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.company && customer.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const totalReceivable = customers?.reduce(
    (sum, c) => sum + parseFloat(c.balance || "0"),
    0
  ) || 0;

  const overdueAccounts = customers?.filter(
    (c) => parseFloat(c.balance || "0") > 0
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
                <Users className="h-6 w-6 text-[#2AA448]" />
                Customers
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Manage your customer database and receivables
              </p>
            </div>
            <Link href="/chip/customers/new">
              <Button className="bg-[#2AA448] hover:bg-[#239639]" data-testid="button-add-customer">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
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
                    Total Customers
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-total-customers">
                    {customers?.length || 0}
                  </p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Total Receivable
                  </p>
                  <p className="text-2xl font-bold text-[#2AA448]" data-testid="text-total-receivable">
                    {totalReceivable.toLocaleString()} AMD
                  </p>
                </div>
                <div className="bg-green-50 text-[#2AA448] p-3 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Overdue Accounts
                  </p>
                  <p className="text-2xl font-bold text-red-600" data-testid="text-overdue-accounts">
                    {overdueAccounts}
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
                  {filteredCustomers && filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => setLocation(`/chip/customers/${customer.id}`)}
                        data-testid={`row-customer-${customer.id}`}
                      >
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.company || "—"}</TableCell>
                        <TableCell>{customer.email || "—"}</TableCell>
                        <TableCell>{customer.phone || "—"}</TableCell>
                        <TableCell className="text-right">
                          <span className={parseFloat(customer.balance || "0") > 0 ? "text-red-600" : ""}>
                            {parseFloat(customer.balance || "0").toLocaleString()} AMD
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {customer.paymentTerms || 0} days
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/chip/customers/${customer.id}/edit`)}
                              data-testid={`button-edit-${customer.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(customer)}
                              data-testid={`button-delete-${customer.id}`}
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
                        {searchQuery ? "No customers found matching your search" : "No customers yet. Add your first customer to get started."}
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
        <AlertDialogContent data-testid="dialog-delete-customer">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{customerToDelete?.name}"? This action cannot be undone.
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
