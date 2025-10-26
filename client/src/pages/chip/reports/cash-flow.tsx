import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Droplet } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type CashFlowData = {
  salesRevenue: number;
  purchaseCosts: number;
  expenses: number;
  netCashFlow: number;
  paymentsByMethod: { method: string; amount: number }[];
};

export default function ChipCashFlowReport() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: cashFlowData, isLoading } = useQuery<CashFlowData>({
    queryKey: ["/api/chip/cash-flow", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }],
  });

  const handleExport = () => {
    toast({
      title: "Coming Soon",
      description: "Export functionality will be implemented soon",
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

  const salesRevenue = cashFlowData?.salesRevenue || 0;
  const purchaseCosts = cashFlowData?.purchaseCosts || 0;
  const expenses = cashFlowData?.expenses || 0;
  const netCashFlow = cashFlowData?.netCashFlow || 0;
  const paymentsByMethod = cashFlowData?.paymentsByMethod || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                <Droplet className="h-6 w-6 text-[#2AA448]" />
                Cash Flow Report
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Cash inflows and outflows for the selected period
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-6">
        {/* Date Range Selector */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Start Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  End Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Statement */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Cash Flow for {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Operating Activities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-slate-800 border-b pb-2">
                Operating Activities
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">Cash from Sales</span>
                  <span className="font-medium text-green-600" data-testid="text-sales-revenue">
                    +{salesRevenue.toLocaleString()} AMD
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">Cash to Suppliers</span>
                  <span className="font-medium text-red-600" data-testid="text-purchase-costs">
                    -{purchaseCosts.toLocaleString()} AMD
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">Cash for Expenses</span>
                  <span className="font-medium text-red-600" data-testid="text-expenses">
                    -{expenses.toLocaleString()} AMD
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-t font-bold">
                  <span>Net Cash from Operating Activities</span>
                  <span className={netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {netCashFlow >= 0 ? '+' : ''}{(salesRevenue - purchaseCosts - expenses).toLocaleString()} AMD
                  </span>
                </div>
              </div>
            </div>

            {/* Investing Activities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-slate-800 border-b pb-2">
                Investing Activities
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">Equipment Purchases</span>
                  <span className="font-medium text-slate-500">0 AMD</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t font-bold">
                  <span>Net Cash from Investing Activities</span>
                  <span>0 AMD</span>
                </div>
              </div>
            </div>

            {/* Financing Activities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-slate-800 border-b pb-2">
                Financing Activities
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">Loans & Financing</span>
                  <span className="font-medium text-slate-500">0 AMD</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t font-bold">
                  <span>Net Cash from Financing Activities</span>
                  <span>0 AMD</span>
                </div>
              </div>
            </div>

            {/* Net Cash Flow */}
            <div className={`p-4 rounded-lg ${netCashFlow >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className="flex justify-between items-center">
                <p className={`text-xl font-bold ${netCashFlow >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  Net Change in Cash
                </p>
                <p 
                  className={`text-3xl font-bold ${netCashFlow >= 0 ? 'text-green-900' : 'text-red-900'}`}
                  data-testid="text-net-cash-flow"
                >
                  {netCashFlow >= 0 ? '+' : ''}{netCashFlow.toLocaleString()} AMD
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow by Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentsByMethod.length > 0 ? (
                paymentsByMethod.map((pm) => {
                  const total = paymentsByMethod.reduce((sum, p) => sum + p.amount, 0);
                  const percentage = total > 0 ? (pm.amount / total) * 100 : 0;
                  return (
                    <div key={pm.method} data-testid={`payment-method-${pm.method}`}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700">{pm.method}</span>
                        <span className="font-medium">
                          {pm.amount.toLocaleString()} AMD ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-[#2AA448] h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  No payment data available for this period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
