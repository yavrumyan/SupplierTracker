import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown, Wallet, AlertCircle } from "lucide-react";
import { ChipInvoice, ChipPurchase, ChipPayment } from "@shared/schema";

export default function ChipFinanceReport() {
  const { data: invoices, isLoading: loadingInvoices } = useQuery<ChipInvoice[]>({
    queryKey: ["/api/chip/invoices"],
  });

  const { data: purchases, isLoading: loadingPurchases } = useQuery<ChipPurchase[]>({
    queryKey: ["/api/chip/purchases"],
  });

  const { data: payments, isLoading: loadingPayments } = useQuery<ChipPayment[]>({
    queryKey: ["/api/chip/payments"],
  });

  const isLoading = loadingInvoices || loadingPurchases || loadingPayments;

  // Calculate stats
  const accountsReceivable = invoices?.filter(
    inv => inv.status !== "paid" && inv.status !== "cancelled"
  ).reduce((sum, inv) => sum + (parseFloat(inv.total || "0") - parseFloat(inv.paidAmount || "0")), 0) || 0;

  const accountsPayable = purchases?.filter(
    p => p.paymentStatus !== "paid"
  ).reduce((sum, p) => sum + (parseFloat(p.totalAmountAMD || "0") - parseFloat(p.paidAmount || "0")), 0) || 0;

  // Cash on hand (simplified - total paid invoices minus total paid purchases)
  const cashOnHand = (invoices?.filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0) || 0) -
    (purchases?.filter(p => p.paymentStatus === "paid")
      .reduce((sum, p) => sum + parseFloat(p.totalAmountAMD || "0"), 0) || 0);

  const netPosition = cashOnHand + accountsReceivable - accountsPayable;

  // Payment methods breakdown
  const paymentsByMethod = payments?.reduce((acc, payment) => {
    const method = payment.paymentMethod || "Other";
    acc[method] = (acc[method] || 0) + parseFloat(payment.amountAMD || "0");
    return acc;
  }, {} as Record<string, number>) || {};

  // Recent payments
  const recentPayments = payments?.slice(0, 10) || [];

  // Overdue invoices
  const overdueInvoices = invoices?.filter(inv => {
    if (!inv.dueDate || inv.status === "paid" || inv.status === "cancelled") return false;
    return new Date(inv.dueDate) < new Date();
  }) || [];

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
          <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-[#2AA448]" />
            Finance Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Overview of your financial position
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                    Accounts Receivable
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-accounts-receivable">
                    {accountsReceivable.toLocaleString()} AMD
                  </p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
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
                    Accounts Payable
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-accounts-payable">
                    {accountsPayable.toLocaleString()} AMD
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
                    Cash On Hand
                  </p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-cash-on-hand">
                    {cashOnHand.toLocaleString()} AMD
                  </p>
                </div>
                <div className="bg-green-50 text-green-600 p-3 rounded-lg">
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
                    Net Position
                  </p>
                  <p 
                    className={`text-2xl font-bold ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    data-testid="text-net-position"
                  >
                    {netPosition.toLocaleString()} AMD
                  </p>
                </div>
                <div className={`${netPosition >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} p-3 rounded-lg`}>
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Payment Methods Breakdown */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
              <div className="space-y-3">
                {Object.entries(paymentsByMethod).map(([method, amount]) => {
                  const total = Object.values(paymentsByMethod).reduce((sum, a) => sum + a, 0);
                  const percentage = total > 0 ? (amount / total) * 100 : 0;
                  return (
                    <div key={method} data-testid={`payment-method-${method}`}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700">{method}</span>
                        <span className="font-medium">{amount.toLocaleString()} AMD ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-[#2AA448] h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(paymentsByMethod).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No payment data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Invoices Warning */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Overdue Invoices
              </h3>
              {overdueInvoices.length > 0 ? (
                <div className="space-y-2">
                  {overdueInvoices.slice(0, 5).map(invoice => (
                    <div 
                      key={invoice.id} 
                      className="flex justify-between items-center p-2 bg-red-50 rounded-lg"
                      data-testid={`overdue-invoice-${invoice.id}`}
                    >
                      <div>
                        <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-slate-600">
                          Due: {new Date(invoice.dueDate!).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-bold text-red-600">
                        {parseFloat(invoice.total || "0").toLocaleString()} {invoice.currency}
                      </p>
                    </div>
                  ))}
                  {overdueInvoices.length > 5 && (
                    <p className="text-xs text-slate-500 text-center pt-2">
                      +{overdueInvoices.length - 5} more overdue invoices
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-green-600 font-medium">No overdue invoices</p>
                  <p className="text-sm text-slate-500">All invoices are on track!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments Table */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.length > 0 ? (
                    recentPayments.map((payment, index) => (
                      <TableRow key={payment.id} data-testid={`row-payment-${index}`}>
                        <TableCell>
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {parseFloat(payment.amountAMD || "0").toLocaleString()} AMD
                        </TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            payment.referenceType === "sale" ? "bg-green-100 text-green-800" :
                            payment.referenceType === "purchase" ? "bg-blue-100 text-blue-800" :
                            "bg-purple-100 text-purple-800"
                          }`}>
                            {payment.referenceType}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {payment.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No recent payments
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
