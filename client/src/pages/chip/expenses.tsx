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
import { Receipt, Plus, Trash2, Search, DollarSign, Calendar, TrendingDown } from "lucide-react";
import { Link } from "wouter";
import { ChipExpense } from "@shared/schema";
import { format } from "date-fns";

export default function ChipExpenses() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ChipExpense | null>(null);

  const { data: expenses, isLoading } = useQuery<ChipExpense[]>({
    queryKey: ["/api/chip/expenses"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/chip/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/expenses"] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (expense: ChipExpense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (expenseToDelete) {
      deleteMutation.mutate(expenseToDelete.id);
    }
  };

  // Calculate stats
  const totalExpenses = expenses?.reduce(
    (sum, e) => sum + parseFloat(e.amountAMD || "0"),
    0
  ) || 0;

  const thisMonthExpenses = expenses?.filter(e => {
    const expDate = new Date(e.date);
    const now = new Date();
    return expDate.getMonth() === now.getMonth() && 
           expDate.getFullYear() === now.getFullYear();
  }).reduce((sum, e) => sum + parseFloat(e.amountAMD || "0"), 0) || 0;

  // Group by category
  const byCategory = expenses?.reduce((acc, e) => {
    const cat = e.category || "Other";
    acc[cat] = (acc[cat] || 0) + parseFloat(e.amountAMD || "0");
    return acc;
  }, {} as Record<string, number>) || {};

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  // Filter expenses
  const filteredExpenses = expenses?.filter((expense) => {
    const matchesSearch = searchQuery === "" ||
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || expense.category === categoryFilter;
    const matchesPaymentMethod = !paymentMethodFilter || expense.paymentMethod === paymentMethodFilter;
    return matchesSearch && matchesCategory && matchesPaymentMethod;
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
                <Receipt className="h-6 w-6 text-[#2AA448]" />
                Expenses
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Track and manage business expenses
              </p>
            </div>
            <Link href="/chip/expenses/new">
              <Button className="bg-[#2AA448] hover:bg-[#239639]" data-testid="button-add-expense">
                <Plus className="h-4 w-4 mr-2" />
                New Expense
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
                    Total Expenses
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-total-expenses">
                    {totalExpenses.toLocaleString()} AMD
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
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-this-month">
                    {thisMonthExpenses.toLocaleString()} AMD
                  </p>
                </div>
                <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Top Category
                  </p>
                  <p className="text-lg font-bold text-slate-900" data-testid="text-top-category">
                    {topCategory ? topCategory[0] : "N/A"}
                  </p>
                  {topCategory && (
                    <p className="text-sm text-slate-600 mt-1">
                      {topCategory[1].toLocaleString()} AMD
                    </p>
                  )}
                </div>
                <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
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
                  placeholder="Search by description or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-expense"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="Rent">Rent</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Salaries">Salaries</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-payment-method-filter">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Methods</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses && filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} data-testid={`row-expense-${expense.id}`}>
                        <TableCell data-testid={`text-date-${expense.id}`}>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {format(new Date(expense.date), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-category-${expense.id}`}>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {expense.category}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`text-description-${expense.id}`}>
                          {expense.description}
                        </TableCell>
                        <TableCell className="text-right font-medium" data-testid={`text-amount-${expense.id}`}>
                          {parseFloat(expense.amount || "0").toLocaleString()}
                        </TableCell>
                        <TableCell data-testid={`text-currency-${expense.id}`}>
                          {expense.currency}
                        </TableCell>
                        <TableCell data-testid={`text-payment-method-${expense.id}`}>
                          {expense.paymentMethod || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(expense)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-${expense.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                        No expenses found. Add your first expense to get started.
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
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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
